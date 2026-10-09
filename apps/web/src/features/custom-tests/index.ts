// Public API of the custom-tests feature (§4.1).
export { ResultsScreen } from './components/ResultsScreen';
export { TestBuilderTray } from './components/TestBuilderTray';
export { TestModePicker } from './components/TestModePicker';
export { TestTimer } from './components/TestTimer';
export { useTestAttemptStore } from './hooks/useTestAttempt';
export { useTestBuilderStore } from './hooks/useTestBuilder';
export { formatSeconds, useCountdown } from './hooks/useCountdown';
export {
  useCreateTest,
  useDeleteTest,
  useSubmitTest,
  useTest,
  useTestAttempts,
  useTests,
  type SubmitTestInput,
} from './hooks/useTests';
export {
  correctAnswerOf,
  incorrectQuestionIds,
  isAnswerCorrect,
  scoreAnswers,
} from './utils/scoring';
export type {
  CreateTestInput,
  CustomTest,
  TestAttempt,
  TestMode,
  TestSubmitResult,
  TestSubmitResultItem,
} from './types';
