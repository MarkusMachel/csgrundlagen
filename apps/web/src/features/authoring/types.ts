import type { MaterialType } from '@/features/materials';
import type { MultipleChoiceOption, QuestionType } from '@/features/questions';

export interface CreateQuestionInput {
  type: QuestionType;
  prompt: string;
  tags: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  explanation: string;
  /** multiple-choice, multi-select and ordering (ordering: in the correct order) */
  options?: MultipleChoiceOption[];
  correctOptionId?: string;
  /** multi-select only: every correct option */
  correctOptionIds?: string[];
  /** true-false only */
  correctAnswer?: boolean;
  /** output only: the snippet, its language and what it prints */
  code?: string;
  codeLanguage?: string;
  expectedOutput?: string;
  /** Optional link: attach the new question to existing materials. */
  relatedMaterialIds?: string[];
}

export type BugStatus = 'open' | 'reviewed' | 'closed';

/** A bug report with what an admin needs to triage it (GET /admin/bug-reports). */
export interface AdminBugReport {
  id: string;
  questionId: string;
  questionPrompt: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
  status: BugStatus;
}

export interface CreateMaterialInput {
  type: MaterialType;
  title: string;
  url: string;
  author?: string;
  description?: string;
  tags: string[];
  /** Optional link: attach the new material to existing questions. */
  relatedQuestionIds?: string[];
}
