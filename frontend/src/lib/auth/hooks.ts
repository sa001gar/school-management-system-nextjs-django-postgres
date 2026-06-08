'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { clearTokens } from './session';
import type { UserRole } from '@/types';

export function useAuth() {
  const router = useRouter();
  const store = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (email: string, password: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
      setError(null);
      try {
        if (role === 'student') {
          await store.studentLogin(email, password);
        } else {
          await store.login(email, password);
        }
        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Login failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [store]
  );

  const logout = useCallback(async () => {
    await store.logout();
    clearTokens();
    router.push('/login');
  }, [store, router]);

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error,
    login,
    logout,
  };
}
