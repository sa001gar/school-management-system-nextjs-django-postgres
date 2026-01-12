/**
 * Auth API Service
 * Handles authentication with Django backend
 */
import api, { setTokens, clearTokens, API_BASE_URL } from './api';
import type { LoginResponse, CurrentUserResponse, Teacher } from './types';

export const authApi = {
  /**
   * Login with email and password
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.non_field_errors?.[0] || 'Invalid login credentials');
    }

    const data: LoginResponse = await response.json();
    setTokens(data.access, data.refresh);
    return data;
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout/', { refresh: localStorage.getItem('refresh_token') });
    } catch {
      // Ignore errors during logout
    }
    clearTokens();
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<CurrentUserResponse> => {
    return api.get<CurrentUserResponse>('/auth/me/');
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: string): Promise<{ access: string; refresh?: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  },
};

export const teacherApi = {
  /**
   * Get all teachers
   */
  getAll: async (): Promise<Teacher[]> => {
    const response = await api.get<{ results?: Teacher[] } | Teacher[]>('/teachers/');
    return Array.isArray(response) ? response : (response.results || []);
  },

  /**
   * Get teacher by ID
   */
  getById: async (id: string): Promise<Teacher> => {
    return api.get<Teacher>(`/teachers/${id}/`);
  },

  /**
   * Create new teacher
   */
  create: async (data: { email: string; password: string; name: string }): Promise<Teacher> => {
    return api.post<Teacher>('/teachers/', data);
  },

  /**
   * Update teacher
   */
  update: async (id: string, data: { email?: string; name?: string }): Promise<Teacher> => {
    return api.patch<Teacher>(`/teachers/${id}/`, data);
  },

  /**
   * Delete teacher
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/teachers/${id}/`);
  },

  /**
   * Reset teacher password (send reset email)
   */
  resetPassword: async (id: string): Promise<{ message: string }> => {
    return api.post<{ message: string }>(`/teachers/${id}/reset-password/`);
  },
};

export default authApi;
