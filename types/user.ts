export type UserRole = "Owner" | "Admin" | "Editor" | "Author";

export interface PublicUser {
  _id: string;
  id?: string;
  firstName: string;
  surname: string;
  email: string;
  role: UserRole;
  school: string;
  bio?: string;
  avatar?: string;
  avatarPublicId?: string;
  phone?: string;
  dateOfBirth?: string;
  isFrozen?: boolean;
  isEmailVerified?: boolean;
  googleId?: string;
  onboardingCompleted?: boolean;
  genres?: string[];
  age?: number;
  bookmarks?: string[];
  likedArticles?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  surname?: string;
  school?: string;
  bio?: string;
  phone?: string;
  dateOfBirth?: string;
  avatar?: string;
  avatarPublicId?: string;
  genres?: string[];
  isFrozen?: boolean;
  isEmailVerified?: boolean;
  onboardingCompleted?: boolean;
}

export interface UpdateRolePayload {
  role: UserRole;
}

