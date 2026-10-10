// Public API of the questions feature (§4.1) — other features/pages import
// from here only, never from internal files.
export { QuestionCard, type QuestionCardProps } from './components/QuestionCard';
export { QuestionFeed } from './components/QuestionFeed';
export { emptyFilters, type FilterState } from './components/QuestionFilters';
export {
  useDailyQuestion,
  useQuestion,
  useQuestions,
  useTags,
  useWeakQuestions,
  type QuestionsFilter,
} from './hooks/useQuestions';
export { useBookmarkedQuestions, useIsBookmarked, useToggleBookmark } from './hooks/useBookmark';
export { useSubmitAnswer } from './hooks/useSubmitAnswer';
export { useQuestionNote, useSaveQuestionNote } from './hooks/useQuestionNote';
export { useQuestionMaterials } from './hooks/useQuestionExtras';
export { answerKey, canSubmit, correctAnswerOf, isAnswerCorrect, normalizeOutput } from './grading';
export {
  DESIGN_KINDS,
  MAX_DESIGN_EDGES,
  MAX_DESIGN_NODES,
  gradeDesign,
  isDesignGraph,
  offendingEdges,
} from './design';
export type {
  AnswerStat,
  AnswerValue,
  Bookmark,
  BugReport,
  DesignGraph,
  DesignKind,
  DesignQuestion,
  DesignResult,
  DesignRule,
  DesignSpec,
  MultipleChoiceOption,
  MultipleChoiceQuestion,
  Question,
  QuestionComment,
  QuestionMode,
  QuestionNote,
  QuestionStats,
  QuestionsPage,
  QuestionType,
  SubmitAnswerResult,
  TestSubMode,
  TrueFalseQuestion,
  UserQuestionStat,
} from './types';
