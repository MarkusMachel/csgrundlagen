import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { Chip } from '@mui/material';
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
    <Chip
      icon={<TimerOutlinedIcon />}
      color={critical ? 'error' : 'default'}
      label={`${t('takeTest.timeLeft')}: ${formatSeconds(secondsLeft)}`}
      // ARIA live region for the countdown (§12); polite to avoid
      // interrupting screen readers every second.
      aria-live="polite"
      role="timer"
      data-testid="test-timer"
      sx={{ fontVariantNumeric: 'tabular-nums' }}
    />
  );
}
