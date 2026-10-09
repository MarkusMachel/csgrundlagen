// Public API of the authoring feature (§4.1).
// Content creation is admin-gated: useIsAdmin() drives the UI, and the mock
// API returns 403 for non-admins — the gate a real backend will enforce.
export { AdminStatsTab } from './components/AdminStatsTab';
export { MaterialForm } from './components/MaterialForm';
export { QuestionForm } from './components/QuestionForm';
export {
  useAdminStats,
  useCreateMaterial,
  useCreateQuestion,
  useIsAdmin,
} from './hooks/useAuthoring';
export type { AdminStats } from './statsTypes';
export type { CreateMaterialInput, CreateQuestionInput } from './types';
