import { Timer } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { formatSeconds, useCountdown } from '../hooks/useCountdown';

interface TestTimerProps {
  durationMinutes: number;
  /** When the attempt began; a resumed attempt continues where the clock is now. */
  startedAt?: string | null;
  onExpire: () => void;
}

export function TestTimer({ durationMinutes, startedAt, onExpire }: TestTimerProps) {
  const { t } = useTranslation();
  // Computed once per attempt: the clock kept running while the test was closed.
  const total = useMemo(() => {
    const elapsed = startedAt ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000) : 0;
    return Math.max(1, durationMinutes * 60 - Math.max(0, elapsed));
  }, [durationMinutes, startedAt]);
  const secondsLeft = useCountdown(total, onExpire);
  const critical = secondsLeft <= 30;

  return (
    <span
      className={critical ? 'timer-chip timer-chip--critical' : 'timer-chip'}
      // ARIA live region for the countdown (§12); polite to avoid
      // interrupting screen readers every second.
      aria-live="polite"
      role="timer"
      data-testid="test-timer"
    >
      <Timer size={15} aria-hidden />
      {t('takeTest.timeLeft')}: {formatSeconds(secondsLeft)}
    </span>
  );
}
