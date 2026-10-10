// Public API of the authoring feature (§4.1).
// Content creation is admin-gated: useIsAdmin() drives the UI, and the mock
// API returns 403 for non-admins — the gate a real backend will enforce.
export { AdminStatsTab } from './components/AdminStatsTab';
export { BugReportQueue } from './components/BugReportQueue';
export { CommentModeration } from './components/CommentModeration';
export { QualityReportTab } from './components/QualityReportTab';
export { useModerationQueue } from './hooks/useModeration';
export { MaterialManager } from './components/MaterialManager';
export { QuestionManager } from './components/QuestionManager';
export { MaterialForm } from './components/MaterialForm';
export { QuestionForm } from './components/QuestionForm';
export { TagInput } from './components/TagInput';
export {
  useAdminStats,
  useBugReports,
  useCreateMaterial,
  useCreateQuestion,
  useDeleteMaterial,
  useDeleteQuestion,
  useIsAdmin,
  useSetBugReportStatus,
  useUpdateMaterial,
  useUpdateQuestion,
} from './hooks/useAuthoring';
export type { AdminStats } from './statsTypes';
export type { AdminBugReport, BugStatus, CreateMaterialInput, CreateQuestionInput } from './types';
