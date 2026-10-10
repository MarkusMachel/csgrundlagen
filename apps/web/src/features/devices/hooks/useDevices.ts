import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/shared/api/client';

import type { AdminUser, AdminUserDetail, DeviceSession } from '../types';

export function useMySessions() {
  return useQuery({
    queryKey: ['me', 'sessions'],
    queryFn: () => api.get<DeviceSession[]>('/me/sessions'),
  });
}

export function useRevokeMySession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/me/sessions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me', 'sessions'] }),
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<AdminUser[]>('/admin/users'),
  });
}

export function useAdminUserDetail(id: string) {
  return useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => api.get<AdminUserDetail>(`/admin/users/${id}`),
  });
}

/** Changes another account's role, or blocks/unblocks it. */
export function useAdminChangeUser(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (change: { role?: 'admin' | 'user'; blocked?: boolean }) =>
      api.patch<void>(`/admin/users/${userId}`, change),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useAdminDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.delete<void>(`/admin/users/${userId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useAdminRevokeSession(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    /** A session id, or 'all' to sign the user out everywhere. */
    mutationFn: (sessionId: string) =>
      api.delete<unknown>(
        sessionId === 'all'
          ? `/admin/users/${userId}/sessions`
          : `/admin/users/${userId}/sessions/${sessionId}`,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}
