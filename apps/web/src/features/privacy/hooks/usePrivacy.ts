import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { collectClientInfo } from '@/features/devices/clientInfo';
import { api } from '@/shared/api/client';
import { useAuthStore } from '@/stores/useAuthStore';

import { PRIVACY_POLICY_VERSION, useConsentStore } from '../consent';

/**
 * For signed-in users, logs the consent choice on the server (it ignores a
 * repeat of the latest one) and then, only with device-details consent, sends
 * the browser's self-report for this session.
 */
export function usePrivacySync() {
  const status = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.user?.id);
  const choice = useConsentStore((s) => s.choice);

  useEffect(() => {
    if (status !== 'authenticated' || !choice) return;
    const { preferences, deviceDetails } = choice;
    api
      .post<void>('/me/consent', {
        policyVersion: PRIVACY_POLICY_VERSION,
        preferences,
        deviceDetails,
      })
      .then(() => (deviceDetails ? api.post<void>('/me/device', collectClientInfo()) : undefined))
      .catch(() => {
        // best effort; retried on the next page load
      });
  }, [status, userId, choice]);
}

/** Records that the signed-in user read the current privacy policy. */
export function useAcceptPolicy() {
  return useMutation({
    mutationFn: () => api.post<void>('/me/privacy', { version: PRIVACY_POLICY_VERSION }),
    onSuccess: () =>
      useAuthStore.setState((s) => ({
        user: s.user && { ...s.user, privacyVersion: PRIVACY_POLICY_VERSION },
      })),
  });
}

/** Downloads everything stored about the user as a JSON file (GDPR Art. 15/20). */
export function useExportMyData() {
  return useMutation({
    mutationFn: async () => {
      const data = await api.get<unknown>('/me/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `csgrundlagen-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  });
}

/** Permanently deletes the account (GDPR Art. 17), then signs out locally. */
export function useDeleteAccount() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => api.delete<void>('/me', { password }),
    onSuccess: () => {
      clearSession();
      queryClient.clear();
    },
  });
}
