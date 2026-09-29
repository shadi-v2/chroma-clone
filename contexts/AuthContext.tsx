"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/services/api";
import type { PublicUser } from "@/types/user";
import AuthDialog from "@/components/auth/AuthDialog";
import BirthdayDialog from "@/components/birthday/BirthdayDialog";

interface AuthModalOptions {
  title?: string;
  message?: string;
  redirectTo?: string;
}

interface AuthContextType {
  user: PublicUser | null;
  loading: boolean;
  login: (token: string, user: PublicUser) => void;
  logout: () => void;
  openAuthModal: (options?: AuthModalOptions) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalOptions, setAuthModalOptions] = useState<AuthModalOptions>({});

  useEffect(() => {
    async function initAuth() {
      try {
        const userData = await api.users.getMe();

        if (userData && (userData.id || userData._id)) {
          setUser(userData);
          // If a new token was returned, ensure localStorage & cookies match
          const maybeToken = (userData as { token?: string }).token;
          if (maybeToken && typeof window !== "undefined") {
            localStorage.setItem("token", maybeToken);
            document.cookie = `token=${maybeToken}; path=/; max-age=2592000; SameSite=Lax;`;
          }
        } else {
          setUser(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
          }
        }
      } catch {
        setUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const openAuthModal = (options?: AuthModalOptions) => {
    setAuthModalOptions(options || {});
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = (token: string, userData: PublicUser) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      document.cookie = `token=${token}; path=/; max-age=2592000; SameSite=Lax;`;
    }
    setUser(userData);
  };

  const logout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
    setUser(null);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  // Trigger login dialog on new website visit
  useEffect(() => {
    if (!loading && !user) {
      try {
        const hasPrompted = sessionStorage.getItem("chroma_initial_visit_prompt");
        if (!hasPrompted) {
          sessionStorage.setItem("chroma_initial_visit_prompt", "true");
          const timer = setTimeout(() => {
            openAuthModal({
              title: "Welcome to Chroma Diaries",
              message: "Please log in or create an account to discover stories, like articles, leave comments, and join our literary community.",
            });
          }, 800);
          return () => clearTimeout(timer);
        }
      } catch {
        // Ignore session storage errors
      }
    }
  }, [loading, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
      <AuthDialog
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        title={authModalOptions.title}
        message={authModalOptions.message}
        redirectTo={authModalOptions.redirectTo}
      />
      <BirthdayDialog />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be inside AuthProvider");
  }

  return context;
}
