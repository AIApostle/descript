export interface User {
  id: string;
  email: string;
  name?: string | null;
  organization?: string | null;
  role: 'user' | 'admin' | string;
  createdAt: string;
  lastLoginAt?: string | null;
  emailVerified: boolean;
}

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface AuthSession {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  expiresAt?: number;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
}

export interface AuthResponseDTO {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: number;
}
