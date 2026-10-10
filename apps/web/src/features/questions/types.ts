export type QuestionType =
  'multiple-choice' | 'true-false' | 'multi-select' | 'ordering' | 'output';

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  tags: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  explanation: string;
}

export interface MultipleChoiceOption {
  id: string; // 'A' | 'B' | 'C' | 'D' | 'E'
  label: string;
  /** Authoring only: why this option is wrong, shown to whoever picks it. */
  feedback?: string;
  /** Authoring only: material that clears up the misconception. */
  materialId?: string;
}

/** Feedback for a wrong option someone picked (from the answer result). */
export interface OptionFeedback {
  optionId: string;
  text?: string;
  material?: { id: string; type: string; title: string; url: string; author?: string };
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: MultipleChoiceOption[]; // 2–5 options, labeled A–E
  correctOptionId: string;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false';
  correctAnswer: boolean;
}

/** Pick all that apply: one or more options are correct. */
export interface MultiSelectQuestion extends BaseQuestion {
  type: 'multi-select';
  options: MultipleChoiceOption[];
  correctOptionIds: string[];
}

/** Put the options in order; they are shown shuffled. */
export interface OrderingQuestion extends BaseQuestion {
  type: 'ordering';
  options: MultipleChoiceOption[];
  /** Option ids in the correct order. */
  correctOrder: string[];
}

/** Predict what a snippet prints (and then run it, for js and go). */
export interface OutputQuestion extends BaseQuestion {
  type: 'output';
  code: string;
  /** Fence tag, e.g. js or go. */
  codeLanguage: string;
  expectedOutput: string;
}

export type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | MultiSelectQuestion
  | OrderingQuestion
  | OutputQuestion;

/**
 * An answer: an option id (multiple choice), a boolean (true/false), option
 * ids (multi-select: the picked set; ordering: the order) or text (output).
 */
export type AnswerValue = string | boolean | string[];

export interface QuestionComment {
  id: string;
  questionId: string;
  userId: string;
  userName: string;
  body: string;
  createdAt: string;
  /** Only admins ever receive hidden comments. */
  hidden?: boolean;
  reportedByMe?: boolean;
}

export type CommentReportReason = 'spam' | 'offensive' | 'misleading' | 'other';

export interface AnswerStat {
  optionId: string; // option id, or 'true' / 'false'
  label: string;
  count: number;
  percentage: number;
}

export interface QuestionStats {
  questionId: string;
  totalResponses: number;
  distribution: AnswerStat[];
}

export interface BugReport {
  id: string;
  questionId: string;
  userId: string;
  message: string;
  createdAt: string;
  status: 'open' | 'reviewed' | 'closed';
}

export interface Bookmark {
  id: string;
  userId: string;
  questionId: string;
  createdAt: string;
}

export interface QuestionNote {
  id: string;
  userId: string;
  questionId: string;
  body: string;
  updatedAt: string;
}

export interface UserQuestionStat {
  userId: string;
  questionId: string;
  timesAnswered: number;
  timesCorrect: number;
  lastAnsweredAt: string;
  lastAnswerCorrect: boolean;
}

export interface SubmitAnswerResult {
  questionId: string;
  correct: boolean;
  correctAnswer: AnswerValue; // correctOptionId or boolean
  /** When spaced repetition brings the question back (ISO time). */
  nextReviewAt?: string;
  /** Why the picked wrong options are wrong, where the author explained it. */
  feedback?: OptionFeedback[];
}

export interface QuestionsPage {
  items: Question[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type QuestionMode = 'feed' | 'pick' | 'test' | 'review';
export type TestSubMode = 'practice' | 'exam';
