import { Scissors } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ScissorsToggleProps {
  optionLabel: string;
  struck: boolean;
  onToggle: () => void;
}

/**
 * Personal elimination aid (§10.4). Session-only by design (§15).
 * Hover-revealed on pointer devices, always visible on touch, revealed on
 * keyboard focus — see the `.scissors-toggle` rules in global.css.
 */
export function ScissorsToggle({ optionLabel, struck, onToggle }: ScissorsToggleProps) {
  const { t } = useTranslation();
  const label = struck
    ? t('question.unstrike', { option: optionLabel })
    : t('question.strike', { option: optionLabel });
  return (
    <button
      type="button"
      className="scissors-toggle"
      aria-label={label}
      aria-pressed={struck}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
    >
      <Scissors size={15} aria-hidden />
    </button>
  );
}
