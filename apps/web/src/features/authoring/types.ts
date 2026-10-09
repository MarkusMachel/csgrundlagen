import type { MaterialType } from '@/features/materials';
import type { MultipleChoiceOption, QuestionType } from '@/features/questions';

export interface CreateQuestionInput {
  type: QuestionType;
  prompt: string;
  tags: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  explanation: string;
  /** multiple-choice only */
  options?: MultipleChoiceOption[];
  correctOptionId?: string;
  /** true-false only */
  correctAnswer?: boolean;
  /** Optional link: attach the new question to existing materials. */
  relatedMaterialIds?: string[];
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
