const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const isClient = typeof window !== 'undefined';

export function getAccessToken(): string | null {
  if (!isClient) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!isClient) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (!isClient) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  document.cookie = `access_token=${accessToken}; path=/; max-age=${60 * 60}; SameSite=Lax`;
  document.cookie = `refresh_token=${refreshToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearTokens(): void {
  if (!isClient) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  document.cookie = 'access_token=; path=/; max-age=0';
  document.cookie = 'refresh_token=; path=/; max-age=0';
  document.cookie = 'user_role=; path=/; max-age=0';
}

export function isTokenExpired(token: string, marginMs = 0): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000 - marginMs;
  } catch {
    return true;
  }
}

const TOKEN_REFRESH_MARGIN = 60 * 1000;
let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  const refreshToken = getRefreshToken();
  if (!refreshToken || isTokenExpired(refreshToken)) {
    clearTokens();
    return null;
  }
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function getValidAccessToken(): Promise<string | null> {
  const accessToken = getAccessToken();
  if (!accessToken) return null;
  if (isTokenExpired(accessToken, TOKEN_REFRESH_MARGIN)) {
    return refreshAccessToken();
  }
  return accessToken;
}

export async function validateSession(): Promise<{ valid: boolean; user?: { id: string; email: string; role: string; name: string } }> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) return { valid: false };
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return { valid: false };
    const data = await response.json();
    return {
      valid: true,
      user: { id: data.user.id, email: data.user.email, role: data.user.role, name: data.user.name },
    };
  } catch {
    return { valid: false };
  }
}
