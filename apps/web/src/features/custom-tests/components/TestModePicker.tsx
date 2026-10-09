import { BookOpen, GraduationCap, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { TestMode } from '../types';

interface TestModePickerProps {
  onStart: (mode: TestMode) => void;
}

export function TestModePicker({ onStart }: TestModePickerProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<TestMode>('practice');

  const options: { value: TestMode; icon: LucideIcon; label: string; desc: string }[] = [
    { value: 'practice', icon: BookOpen, label: t('takeTest.practice'), desc: t('takeTest.practiceDesc') },
    { value: 'exam', icon: GraduationCap, label: t('takeTest.exam'), desc: t('takeTest.examDesc') },
  ];

  return (
    <div className="stack" style={{ maxWidth: 620 }}>
      <h2>{t('takeTest.chooseMode')}</h2>
      <div className="mode-cards">
        {options.map(({ value, icon: Icon, label, desc }) => (
          <button
            key={value}
            type="button"
            className="mode-card"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
          >
            <div className="mode-card__glyph" aria-hidden>
              <Icon size={20} />
            </div>
            <h3>{label}</h3>
            <p className="muted" style={{ margin: 0 }}>
              {desc}
            </p>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn btn--primary"
        style={{ alignSelf: 'flex-start' }}
        onClick={() => onStart(mode)}
      >
        <span className="prompt-char" aria-hidden>
          $
        </span>
        {t('takeTest.start')}
      </button>
    </div>
  );
}
