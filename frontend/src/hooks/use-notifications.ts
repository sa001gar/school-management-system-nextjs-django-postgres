import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import type { Notification } from '@/types/notification';

export type { Notification };

export function useNotifications(unreadOnly = false) {
  return useQuery<Notification[]>({
    queryKey: ['notifications', { unreadOnly }],
    queryFn: () => api.get<Notification[]>('/notifications/', { unread_only: unreadOnly }),
    staleTime: 30 * 1000,
  });
}

export function useUnreadNotificationCount() {
  return useQuery<number>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get<number>('/notifications/unread-count/'),
    staleTime: 30 * 1000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      api.post(`/notifications/${notificationId}/read/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/notifications/mark-all-read/'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
