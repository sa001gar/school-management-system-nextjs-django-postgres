import { setTokens, clearTokens } from './client';
import type { LoginResponse, CurrentUserResponse, StudentLoginResponse } from '@/types/auth';

export class AuthError extends Error {
  retryAfter?: number;
  constructor(message: string, options?: { retryAfter?: number }) {
    super(message);
    this.name = 'AuthError';
    this.retryAfter = options?.retryAfter;
  }
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        throw new AuthError(errorData.message || 'Too many failed login attempts.', { retryAfter: errorData.retry_after });
      }
      throw new AuthError(errorData.detail || errorData.message || 'Invalid login credentials');
    }
    const data: LoginResponse = await response.json();
    setTokens(data.access, data.refresh);
    return data;
  },

  studentLogin: async (studentId: string, password: string): Promise<StudentLoginResponse> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/student-login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, password }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AuthError(errorData.detail || errorData.message || 'Invalid student credentials');
    }
    const data: StudentLoginResponse = await response.json();
    setTokens(data.access, data.refresh);
    return data;
  },

  logout: async (): Promise<void> => {
    try {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      if (refreshToken) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });
      }
    } catch {
      // Ignore logout errors
    }
    clearTokens();
  },

  getCurrentUser: async (): Promise<CurrentUserResponse> => {
    const { default: api } = await import('./client');
    return api.get<CurrentUserResponse>('/auth/me/');
  },
};
