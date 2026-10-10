import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useSyncExternalStore } from 'react';

import { useAuthStore } from '@/stores/useAuthStore';

import { flushOutbox, loadPendingCount, pendingCount, subscribePending } from './outbox';

function subscribeOnline(listener: () => void) {
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);
  return () => {
    window.removeEventListener('online', listener);
    window.removeEventListener('offline', listener);
  };
}

export function useOnline() {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}

export function usePendingAnswers() {
  return useSyncExternalStore(subscribePending, pendingCount, () => 0);
}

/**
 * Sends answers given offline: on start, whenever the connection comes back,
 * and every minute while some are waiting. Then refreshes what they affect.
 */
export function useOfflineSync() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const online = useOnline();
  const pending = usePendingAnswers();

  useEffect(() => {
    void loadPendingCount();
  }, []);

  useEffect(() => {
    if (!userId || !online) return;
    const flush = () =>
      void flushOutbox(userId).then((sent) => {
        if (sent > 0) {
          void queryClient.invalidateQueries({ queryKey: ['progress'] });
          void queryClient.invalidateQueries({ queryKey: ['review'] });
          void queryClient.invalidateQueries({ queryKey: ['reviewSummary'] });
          void queryClient.invalidateQueries({ queryKey: ['questions', 'weak'] });
        }
      });
    flush();
    if (pending === 0) return;
    const timer = setInterval(flush, 60_000);
    return () => clearInterval(timer);
  }, [userId, online, pending, queryClient]);
}
