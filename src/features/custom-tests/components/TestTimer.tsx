import { Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { formatSeconds, useCountdown } from '../hooks/useCountdown';

interface TestTimerProps {
  durationMinutes: number;
  onExpire: () => void;
}

export function TestTimer({ durationMinutes, onExpire }: TestTimerProps) {
  const { t } = useTranslation();
  const secondsLeft = useCountdown(durationMinutes * 60, onExpire);
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
