export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isGuest: boolean;
  createdAt: string;
  lastLoginAt: string;
  preferences?: {
    rememberMe: boolean;
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  newPassword: string;
  confirmPassword: string;
}