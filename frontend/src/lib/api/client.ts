/**
 * API Client Configuration
 * Central configuration for Django backend API with server-side support
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Check if we're on the client side
const isClient = typeof window !== 'undefined';

/**
 * Get stored access token (client-side only)
 */
export const getAccessToken = (): string | null => {
  if (!isClient) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get stored refresh token (client-side only)
 */
export const getRefreshToken = (): string | null => {
  if (!isClient) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Store tokens (client-side only)
 */
export const setTokens = (accessToken: string, refreshToken: string): void => {
  if (!isClient) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  
  // Also set in cookie for middleware
  document.cookie = `access_token=${accessToken}; path=/; max-age=${60 * 60}; SameSite=Lax`;
  document.cookie = `refresh_token=${refreshToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
};

/**
 * Clear stored tokens (client-side only)
 */
export const clearTokens = (): void => {
  if (!isClient) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  
  // Clear cookies
  document.cookie = 'access_token=; path=/; max-age=0';
  document.cookie = 'refresh_token=; path=/; max-age=0';
  document.cookie = 'user_role=; path=/; max-age=0';
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    return Date.now() >= exp;
  } catch {
    return true;
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();
    setTokens(data.access, data.refresh || refreshToken);
    return data.access;
  } catch {
    clearTokens();
    return null;
  }
};

/**
 * Build query string from params object
 */
const buildQueryString = (params?: Record<string, unknown>): string => {
  if (!params) return '';
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * API Client class with authentication handling
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    let token = getAccessToken();
    
    if (token && isTokenExpired(token)) {
      token = await refreshAccessToken();
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        clearTokens();
        if (isClient) {
          window.location.href = '/login';
        }
      }

      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      
      throw new Error(error.detail || error.message || 'Request failed');
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const headers = await this.getAuthHeaders();
    const queryString = buildQueryString(params);
    
    const response = await fetch(`${this.baseUrl}${endpoint}${queryString}`, {
      method: 'GET',
      headers,
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T = void>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    return this.handleResponse<T>(response);
  }

  // FormData methods for file uploads (no Content-Type header - browser sets it with boundary)
  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    let token = getAccessToken();
    
    if (token && isTokenExpired(token)) {
      token = await refreshAccessToken();
    }

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<T>(response);
  }

  async patchFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    let token = getAccessToken();
    
    if (token && isTokenExpired(token)) {
      token = await refreshAccessToken();
    }

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: formData,
    });

    return this.handleResponse<T>(response);
  }
}

// Export singleton instance
const api = new ApiClient(API_BASE_URL);

export default api;
