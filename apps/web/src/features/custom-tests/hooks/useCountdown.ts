import { useEffect, useRef, useState } from 'react';

/**
 * Counts down from `totalSeconds` and fires `onExpire` exactly once at zero.
 * Ticks on a 1s interval; expiry is edge-triggered via a ref so re-renders
 * can never re-fire the callback.
 */
export function useCountdown(totalSeconds: number, onExpire: () => void, enabled = true) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!enabled) return;
    setSecondsLeft(totalSeconds);
    expiredRef.current = false;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(id);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpireRef.current();
          }
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [totalSeconds, enabled]);

  return secondsLeft;
}

export function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
