import { Box, FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { AnswerValue, Question } from '../types';
import { ScissorsToggle } from './ScissorsToggle';

export interface AnswerReveal {
  correctAnswer: AnswerValue;
  givenAnswer?: AnswerValue;
}

interface AnswerOptionsProps {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  disabled?: boolean;
  reveal?: AnswerReveal;
  showScissors: boolean;
  struckOptions: ReadonlySet<string>;
  onToggleStruck: (optionKey: string) => void;
  /** Shuffled option-id order for this attempt (multiple-choice only). */
  optionOrder?: string[];
}

interface RowSpec {
  key: string; // option id or 'true'/'false'
  label: string;
  letter: string; // circled badge: 'A'…'E', or first letter of True/False
  answerValue: AnswerValue;
}

type BadgeState = 'idle' | 'selected' | 'correct' | 'wrong';

/** The circled option letter — used as the Radio's icon, QConcursos-style. */
function LetterBadge({ letter, state }: { letter: string; state: BadgeState }) {
  const stateSx =
    state === 'correct'
      ? { bgcolor: 'success.main', borderColor: 'success.main', color: 'success.contrastText' }
      : state === 'wrong'
        ? { bgcolor: 'error.main', borderColor: 'error.main', color: 'error.contrastText' }
        : state === 'selected'
          ? { bgcolor: 'primary.main', borderColor: 'primary.main', color: 'primary.contrastText' }
          : { bgcolor: 'transparent', borderColor: 'text.disabled', color: 'text.secondary' };
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
        flexShrink: 0,
        transition: 'background-color 120ms, border-color 120ms',
        ...stateSx,
      }}
    >
      {letter}
    </Box>
  );
}

export function AnswerOptions({
  question,
  value,
  onChange,
  disabled = false,
  reveal,
  showScissors,
  struckOptions,
  onToggleStruck,
  optionOrder,
}: AnswerOptionsProps) {
  const { t } = useTranslation();

  let rows: RowSpec[];
  if (question.type === 'multiple-choice') {
    let options = question.options;
    if (optionOrder) {
      options = [...options].sort((a, b) => optionOrder.indexOf(a.id) - optionOrder.indexOf(b.id));
    }
    rows = options.map((o) => ({ key: o.id, label: o.label, letter: o.id, answerValue: o.id }));
  } else {
    const trueLabel = t('question.true');
    const falseLabel = t('question.false');
    rows = [
      { key: 'true', label: trueLabel, letter: trueLabel.charAt(0), answerValue: true },
      { key: 'false', label: falseLabel, letter: falseLabel.charAt(0), answerValue: false },
    ];
  }

  const selectedKey = value === undefined ? '' : String(value);

  return (
    <FormControl fullWidth disabled={disabled}>
      <RadioGroup
        aria-label={question.prompt}
        value={selectedKey}
        onChange={(e) => {
          const key = e.target.value;
          const row = rows.find((r) => r.key === key);
          if (row) onChange(row.answerValue);
        }}
      >
        {rows.map((row) => {
          const struck = struckOptions.has(row.key);
          const isCorrect = reveal !== undefined && String(reveal.correctAnswer) === row.key;
          const isWrongPick =
            reveal !== undefined &&
            reveal.givenAnswer !== undefined &&
            String(reveal.givenAnswer) === row.key &&
            !isCorrect;
          // The badge is the radio's icon; correctness reveal wins over selection.
          const uncheckedState: BadgeState = isCorrect ? 'correct' : 'idle';
          const checkedState: BadgeState = isCorrect
            ? 'correct'
            : isWrongPick
              ? 'wrong'
              : 'selected';

          return (
            <Box
              key={row.key}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0,
                borderRadius: 1,
                pr: 0.5,
                minHeight: 44, // touch target (§12)
                '&:hover': disabled ? {} : { bgcolor: 'action.hover' },
                '& .option-label': struck
                  ? {
                      textDecoration: 'line-through',
                      // struck state keeps legible contrast in both palettes (§12)
                      color: 'text.disabled',
                    }
                  : {
                      color: isCorrect
                        ? 'success.main'
                        : isWrongPick
                          ? 'error.main'
                          : 'text.primary',
                    },
                '& .scissors-toggle': {
                  opacity: { xs: 1, md: 0 },
                  transition: 'opacity 120ms',
                },
                '&:hover .scissors-toggle, & .scissors-toggle:focus-visible, & .scissors-toggle[aria-pressed="true"]':
                  {
                    opacity: 1,
                  },
                '@media (hover: none)': {
                  '& .scissors-toggle': { opacity: 1 },
                },
              }}
            >
              {showScissors ? (
                <ScissorsToggle
                  optionLabel={row.letter}
                  struck={struck}
                  onToggle={() => onToggleStruck(row.key)}
                />
              ) : (
                // Reserve the toggle's footprint so options don't shift left
                // once scissors are hidden (e.g. after the answer is revealed).
                <Box aria-hidden sx={{ width: 44, height: 44, flexShrink: 0 }} />
              )}
              <FormControlLabel
                value={row.key}
                sx={{ flex: 1, m: 0, alignItems: 'flex-start' }}
                control={
                  <Radio
                    icon={<LetterBadge letter={row.letter} state={uncheckedState} />}
                    checkedIcon={<LetterBadge letter={row.letter} state={checkedState} />}
                    sx={{ py: 1, px: 1 }}
                  />
                }
                label={
                  <Typography
                    component="span"
                    className="option-label"
                    variant="body2"
                    sx={{ display: 'inline-block', pt: '12px', lineHeight: 1.6 }}
                  >
                    {row.label}
                  </Typography>
                }
              />
            </Box>
          );
        })}
      </RadioGroup>
    </FormControl>
  );
}
