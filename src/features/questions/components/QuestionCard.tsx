import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Collapse,
  FormControlLabel,
  IconButton,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsBookmarked, useToggleBookmark } from '../hooks/useBookmark';
import { useSubmitAnswer } from '../hooks/useSubmitAnswer';
import type { AnswerValue, Question, QuestionMode, TestSubMode } from '../types';
import { AnswerOptions, type AnswerReveal } from './AnswerOptions';
import { QuestionTabs } from './ExpandableTabs/QuestionTabs';

export interface QuestionCardProps {
  question: Question;
  mode: QuestionMode;
  /** Only meaningful when mode === 'test'. */
  testMode?: TestSubMode;
  /** pick mode: current selection state + toggle. */
  selected?: boolean;
  onToggleSelect?: (questionId: string) => void;
  /** test mode: controlled answer. */
  value?: AnswerValue;
  onChange?: (value: AnswerValue) => void;
  /** review mode: the answer the user gave (undefined = unanswered). */
  reviewGivenAnswer?: AnswerValue;
  /** test/review mode: per-attempt shuffled option order (multiple choice). */
  optionOrder?: string[];
  /** Optional heading like "Question 2 of 5" in test mode. */
  heading?: string;
}

export function QuestionCard({
  question,
  mode,
  testMode,
  selected = false,
  onToggleSelect,
  value,
  onChange,
  reviewGivenAnswer,
  optionOrder,
  heading,
}: QuestionCardProps) {
  const { t } = useTranslation();
  const isExam = mode === 'test' && testMode === 'exam';

  // feed-mode local answer + submission result
  const [localAnswer, setLocalAnswer] = useState<AnswerValue | undefined>(undefined);
  const submitAnswer = useSubmitAnswer(question.id);
  const submitted = submitAnswer.isSuccess;

  // scissors strike-outs: session-only by design (§15)
  const [struckOptions, setStruckOptions] = useState<ReadonlySet<string>>(new Set());
  const toggleStruck = (key: string) =>
    setStruckOptions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const [tabsOpen, setTabsOpen] = useState(mode === 'review');

  const bookmarkable = mode === 'feed' || mode === 'pick';
  const isBookmarked = useIsBookmarked(question.id);
  const toggleBookmark = useToggleBookmark(question.id);

  const controlled = mode === 'test';
  const currentAnswer = controlled ? value : localAnswer;

  let reveal: AnswerReveal | undefined;
  if (mode === 'review') {
    reveal = {
      correctAnswer:
        question.type === 'multiple-choice' ? question.correctOptionId : question.correctAnswer,
      givenAnswer: reviewGivenAnswer,
    };
  } else if (submitted && submitAnswer.data) {
    reveal = { correctAnswer: submitAnswer.data.correctAnswer, givenAnswer: currentAnswer };
  }

  const showScissors = (mode === 'feed' || mode === 'pick' || mode === 'test') && !isExam && !reveal;
  const showSubmit = mode === 'feed';
  // Practice keeps explanations reachable as the user goes (§15 open decision).
  const explanationRevealed =
    mode === 'review' || submitted || (mode === 'test' && testMode === 'practice');
  const hideRevealingTabs = isExam;

  const answersDisabled = mode === 'review' || (mode === 'feed' && submitted);

  return (
    <Card component="article" variant="outlined" data-testid={`question-card-${question.id}`}>
      {/* Header bar: index/id + tag breadcrumb, bookmark on the right */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'action.hover',
          flexWrap: 'wrap',
        }}
      >
        {heading && (
          <Typography variant="body2" fontWeight={700} color="text.secondary">
            {heading}
          </Typography>
        )}
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 0.2 }}
        >
          Q{question.id.replace(/^q/, '')}
        </Typography>
        <Typography variant="body2" sx={{ minWidth: 0, flex: 1 }} noWrap>
          {question.tags.map((tag, i) => (
            <Fragment key={tag}>
              {i === 1 && <Box component="span" sx={{ color: 'text.disabled', mx: 0.75 }}>›</Box>}
              {i > 1 && <Box component="span" sx={{ color: 'text.disabled' }}>, </Box>}
              <Link
                component="span"
                underline="hover"
                sx={{ color: 'primary.main', fontWeight: i === 0 ? 600 : 400, cursor: 'default' }}
              >
                {tag}
              </Link>
            </Fragment>
          ))}
        </Typography>
        {bookmarkable && (
          <IconButton
            size="small"
            aria-label={isBookmarked ? t('question.removeBookmark') : t('question.bookmark')}
            aria-pressed={isBookmarked}
            onClick={() => toggleBookmark.mutate()}
            sx={{ width: 40, height: 40, ml: 'auto' }}
          >
            {isBookmarked ? (
              <BookmarkIcon fontSize="small" color="primary" />
            ) : (
              <BookmarkBorderIcon fontSize="small" />
            )}
          </IconButton>
        )}
      </Box>

      <CardContent sx={{ pt: 1.5 }}>
        {question.difficulty && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            <strong>{t('question.difficultyLabel')}: </strong>
            {t(`question.difficulty.${question.difficulty}`)}
          </Typography>
        )}

        <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
          {question.prompt}
        </Typography>

        <AnswerOptions
          question={question}
          value={currentAnswer}
          onChange={(v) => (controlled ? onChange?.(v) : setLocalAnswer(v))}
          disabled={answersDisabled}
          reveal={reveal}
          showScissors={showScissors}
          struckOptions={struckOptions}
          onToggleStruck={toggleStruck}
          optionOrder={optionOrder}
        />

        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 2 }}
          alignItems="center"
          useFlexGap
          flexWrap="wrap"
        >
          {showSubmit && (
            <Button
              variant="contained"
              disabled={currentAnswer === undefined || submitted || submitAnswer.isPending}
              onClick={() => {
                if (currentAnswer !== undefined) submitAnswer.mutate(currentAnswer);
              }}
            >
              {t('question.submit')}
            </Button>
          )}
          {mode === 'feed' && submitted && submitAnswer.data && (
            <Alert
              severity={submitAnswer.data.correct ? 'success' : 'error'}
              sx={{ py: 0, flex: 1, minWidth: 240 }}
              data-testid="answer-feedback"
            >
              {submitAnswer.data.correct ? t('question.correct') : t('question.incorrect')}
            </Alert>
          )}
          {mode === 'pick' && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={selected}
                  onChange={() => onToggleSelect?.(question.id)}
                  inputProps={{ 'aria-label': t('builder.addToTest') }}
                />
              }
              label={t('builder.addToTest')}
            />
          )}
          <IconButton
            aria-label={t('question.tabs.explanation')}
            aria-expanded={tabsOpen}
            onClick={() => setTabsOpen((o) => !o)}
            sx={{
              ml: 'auto',
              width: 44,
              height: 44,
              transform: tabsOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 150ms',
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Stack>

        <Collapse in={tabsOpen} mountOnEnter>
          <Box sx={{ mt: 2 }}>
            <QuestionTabs
              question={question}
              explanationRevealed={explanationRevealed}
              hideRevealingTabs={hideRevealingTabs}
            />
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}
