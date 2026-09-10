import {
  ArticleQueryParams,
  ArticlesResponse,
  CreateArticlePayload,
  PublicArticle,
  UpdateArticleStatusPayload,
  ArticleStatus,
  UpdateArticlePayload,
} from "@/types/article";
import { AuthResponse, LoginPayload, RegisterPayload } from "@/types/auth";
import { PublicUser, UpdateProfilePayload, UserRole } from "@/types/user";
import type { AdminStats } from "@/types/admin";
import {
  ContactPayload,
  NewsletterPayload,
  PublicResponse,
} from "@/types/public";
import {
  CategoriesResponse,
  Category,
  CreateCategoryPayload,
  CreateTagPayload,
  Tag,
  TagsResponse,
  UpdateCategoryPayload,
} from "@/types/category";

const BASE_URL = "/api";

const getHeaders = (customHeaders?: HeadersInit) => {
  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("token");
    if (!token) {
      const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
      if (match && match[1] && match[1] !== "null" && match[1] !== "undefined") {
        token = match[1];
      }
    }
  }
  return {
    "Content-Type": "application/json",
    ...(token && token !== "null" && token !== "undefined" ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };
};

const apiFetch = (url: string, init?: RequestInit) => {
  return fetch(url, {
    credentials: "include",
    ...init,
    headers: getHeaders(init?.headers),
  });
};

export const api = {
  auth: {
    register: async (data: RegisterPayload): Promise<AuthResponse> =>
      apiFetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        body: JSON.stringify(data),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Registration failed");
        return data;
      }),

    login: async (data: LoginPayload): Promise<AuthResponse> =>
      apiFetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        body: JSON.stringify(data),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");
        return data;
      }),

    googleAuth: async (payload: {
      credential?: string;
      email?: string;
      firstName?: string;
      surname?: string;
      avatar?: string;
      googleId?: string;
    }): Promise<AuthResponse & { needsOnboarding?: boolean }> =>
      apiFetch(`${BASE_URL}/auth/google`, {
        method: "POST",
        body: JSON.stringify(payload),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Google authentication failed");
        return data;
      }),

    sendVerificationCode: async (email: string): Promise<{ success: boolean; message: string }> =>
      apiFetch(`${BASE_URL}/auth/send-verification-code`, {
        method: "POST",
        body: JSON.stringify({ email }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to send code");
        return data;
      }),

    verifyCode: async (email: string, code: string): Promise<{ success: boolean; message: string }> =>
      apiFetch(`${BASE_URL}/auth/verify-code`, {
        method: "POST",
        body: JSON.stringify({ email, code }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Verification failed");
        return data;
      }),
  },

  users: {
    getMe: async (): Promise<PublicUser> => {
      const res = await apiFetch(`${BASE_URL}/users/me`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch profile");
      return data;
    },

    uploadAvatar: async (file: File): Promise<{ success: boolean; url: string; publicId: string }> => {
      const formData = new FormData();
      formData.append("avatar", file);

      let token: string | null = null;
      if (typeof window !== "undefined") {
        token = localStorage.getItem("token");
        if (!token) {
          const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
          if (match && match[1] && match[1] !== "null" && match[1] !== "undefined") {
            token = match[1];
          }
        }
      }

      const headers: Record<string, string> = {};
      if (token && token !== "null" && token !== "undefined") {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/users/avatar`, {
        method: "POST",
        body: formData,
        headers,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload avatar");
      return data;
    },

    updateMe: async (data: UpdateProfilePayload): Promise<PublicUser> => {
      const res = await apiFetch(`${BASE_URL}/users/me`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      const response = await res.json();
      if (!res.ok) throw new Error(response.message || "Failed to update profile");
      return response;
    },

    getPublicProfile: async (id: string): Promise<PublicUser> => {
      const res = await apiFetch(`${BASE_URL}/users/public/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch profile");
      return data;
    },

    listAll: async (): Promise<PublicUser[]> => {
      const res = await apiFetch(`${BASE_URL}/users`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch users");
      return data;
    },

    listByRole: async (role: UserRole): Promise<PublicUser[]> => {
      const res = await apiFetch(`${BASE_URL}/users?role=${encodeURIComponent(role)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch users");
      return data;
    },

    updateRole: async (id: string, role: UserRole): Promise<PublicUser> => {
      const res = await apiFetch(`${BASE_URL}/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update role");
      return data;
    },

    delete: async (id: string): Promise<void> => {
      const res = await apiFetch(`${BASE_URL}/users/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete user");
    },
  },

  articles: {
    list: async (params: ArticleQueryParams = {}): Promise<ArticlesResponse> => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      const res = await apiFetch(`${BASE_URL}/articles?${query}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch articles");
      return data;
    },

    getOne: (id: string): Promise<PublicArticle> =>
      apiFetch(`${BASE_URL}/articles/${id}`).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Article not found");
        return data;
      }),

    getMyArticles: async (): Promise<ArticlesResponse> =>
      apiFetch(`${BASE_URL}/articles/my-articles`).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch your articles");
        return data;
      }),

    create: async (data: CreateArticlePayload): Promise<PublicArticle> => {
      const res = await apiFetch(`${BASE_URL}/articles`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      const response = await res.json();
      if (!res.ok) throw new Error(response.message || "Failed to create article");
      return response;
    },

    update: async (id: string, data: UpdateArticlePayload): Promise<PublicArticle> =>
      apiFetch(`${BASE_URL}/articles/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }).then((res) => res.json()),

    delete: (id: string) =>
      apiFetch(`${BASE_URL}/articles/${id}`, {
        method: "DELETE",
      }).then((res) => res.json()),

    updateStatus: async (id: string, status: ArticleStatus | UpdateArticleStatusPayload) => {
      const payload = typeof status === "string" ? { status } : status;
      const res = await apiFetch(`${BASE_URL}/articles/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const response = await res.json();
      if (!res.ok) throw new Error(response.message || "Failed to update article status");
      return response;
    },

    like: (id: string) =>
      apiFetch(`${BASE_URL}/articles/${id}/like`, {
        method: "POST",
      }).then((res) => res.json()),

    bookmark: (id: string) =>
      apiFetch(`${BASE_URL}/articles/${id}/bookmark`, {
        method: "POST",
      }).then((res) => res.json()),

    enroll: async (id: string): Promise<{ enrolled: boolean }> => {
      const res = await apiFetch(`${BASE_URL}/articles/${id}/enroll`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update enrollment");
      return data;
    },

    addComment: (id: string, data: { content: string }) =>
      apiFetch(`${BASE_URL}/articles/${id}/comment`, {
        method: "POST",
        body: JSON.stringify(data),
      }).then((res) => res.json()),

    getComments: (id: string) =>
      apiFetch(`${BASE_URL}/articles/${id}/comment`).then((res) => res.json()),

    incrementViews: async (
      id: string,
    ): Promise<{ reads?: number; incremented?: boolean; message?: string }> => {
      const res = await apiFetch(`/api/articles/${id}/view`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to increment views");
      return res.json();
    },

    search: (query: string) =>
      apiFetch(`${BASE_URL}/articles/search?query=${query}`).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Search failed");
        return data;
      }),
  },

  categories: {
    list: async (): Promise<CategoriesResponse> =>
      apiFetch(`${BASE_URL}/categories`).then((res) => res.json()),

    create: async (payload: CreateCategoryPayload): Promise<Category> =>
      apiFetch(`${BASE_URL}/categories`, {
        method: "POST",
        body: JSON.stringify(payload),
      }).then((res) => res.json()),

    update: async (id: string, payload: UpdateCategoryPayload): Promise<Category> => {
      const res = await apiFetch(`${BASE_URL}/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update category");
      return data;
    },

    delete: async (id: string): Promise<{ message: string }> => {
      const res = await apiFetch(`${BASE_URL}/categories/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete category");
      return data;
    },

    getTags: async (): Promise<TagsResponse> =>
      apiFetch(`${BASE_URL}/categories/tags`).then((res) => res.json()),

    createTag: async (payload: CreateTagPayload): Promise<Tag> =>
      apiFetch(`${BASE_URL}/categories/tags`, {
        method: "POST",
        body: JSON.stringify(payload),
      }).then((res) => res.json()),
  },

  admin: {
    getStats: async (): Promise<AdminStats> => {
      const res = await apiFetch(`${BASE_URL}/admin/stats`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch stats");
      return data;
    },
  },

  public: {
    subscribeNewsletter: async (data: NewsletterPayload): Promise<PublicResponse> => {
      const res = await apiFetch(`${BASE_URL}/public/newsletter/subscribe`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      const response = await res.json();
      if (!res.ok) throw new Error(response.message || "Subscription failed");
      return response;
    },

    submitContactForm: async (data: ContactPayload): Promise<PublicResponse> => {
      const res = await apiFetch(`${BASE_URL}/public/contact`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      const response = await res.json();
      if (!res.ok) throw new Error(response.message || "Failed to send message");
      return response;
    },
  },
};
