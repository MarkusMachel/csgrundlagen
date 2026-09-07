import ContentCutIcon from '@mui/icons-material/ContentCut';
import { IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ScissorsToggleProps {
  optionLabel: string;
  struck: boolean;
  onToggle: () => void;
}

/**
 * Personal elimination aid (§10.4). Session-only by design (§15 open decision:
 * struck state is not persisted). Hover-revealed on pointer devices, always
 * visible on touch devices, and revealed on keyboard focus — see the
 * `.scissors-toggle` styles applied by AnswerOptions.
 */
export function ScissorsToggle({ optionLabel, struck, onToggle }: ScissorsToggleProps) {
  const { t } = useTranslation();
  const label = struck
    ? t('question.unstrike', { option: optionLabel })
    : t('question.strike', { option: optionLabel });
  return (
    <IconButton
      className="scissors-toggle"
      aria-label={label}
      aria-pressed={struck}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      size="small"
      sx={{
        // ≥44px touch target (§12) even though the glyph is small
        width: 44,
        height: 44,
        color: struck ? 'primary.main' : 'text.secondary',
      }}
    >
      <ContentCutIcon fontSize="small" />
    </IconButton>
  );
}
