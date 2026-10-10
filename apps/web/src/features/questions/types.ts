export type QuestionType =
  | 'multiple-choice'
  | 'true-false'
  | 'multi-select'
  | 'ordering'
  | 'output'
  | 'flashcard'
  | 'design';

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

/**
 * A flashcard (e.g. imported from Anki): the prompt is the front, the
 * explanation the back, and the learner grades themselves (true = knew it).
 */
export interface FlashcardQuestion extends BaseQuestion {
  type: 'flashcard';
}

/** A component a design is built from (see DESIGN_KINDS in design.ts). */
export type DesignKind =
  | 'client'
  | 'dns'
  | 'cdn'
  | 'load-balancer'
  | 'api-gateway'
  | 'service'
  | 'worker'
  | 'cache'
  | 'sql'
  | 'nosql'
  | 'replica'
  | 'queue'
  | 'object-storage'
  | 'search'
  | 'rate-limiter'
  | 'auth'
  | 'websocket'
  | 'scheduler';

/** A drawn system: components and arrows in the direction requests and data flow. */
export interface DesignGraph {
  /** `product` is a real product (e.g. redis) shown on the board; grading uses `kind`. */
  nodes: { id: string; kind: DesignKind; label?: string; product?: string }[];
  edges: { from: string; to: string }[];
}

/**
 * One check on a design (mirrors store.DesignRule):
 * has      at least `min` (default 1) components of a kind in `of`
 * edge     a `from` component connects directly to a `to` one
 * path     `from` reaches `to` following the arrows, through a `via` kind if set
 * no-edge  no `from` component connects directly to a `to` one
 * Optional rules are good practice: shown in the result, not needed to pass.
 */
export interface DesignRule {
  id: string;
  requirement?: string;
  kind: 'has' | 'edge' | 'path' | 'no-edge';
  of?: DesignKind[];
  min?: number;
  from?: DesignKind[];
  to?: DesignKind[];
  via?: DesignKind[];
  optional?: boolean;
  text: string;
  explanation: string;
  materialId?: string;
}

export interface DesignSpec {
  requirements: { id: string; text: string }[];
  rules: DesignRule[];
  /** A model answer that passes every rule, shown after submitting. */
  reference: DesignGraph;
}

/** Design the system in the prompt on a drawing board; checked against rules. */
export interface DesignQuestion extends BaseQuestion {
  type: 'design';
  design: DesignSpec;
}

export interface DesignResult {
  /** Required rules passed, out of `total` required rules. */
  score: number;
  total: number;
  rules: { id: string; passed: boolean }[];
}

export type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | MultiSelectQuestion
  | OrderingQuestion
  | OutputQuestion
  | FlashcardQuestion
  | DesignQuestion;

/**
 * An answer: an option id (multiple choice), a boolean (true/false), option
 * ids (multi-select: the picked set; ordering: the order), text (output) or a
 * drawn system (design).
 */
export type AnswerValue = string | boolean | string[] | DesignGraph;

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
  /** Graded on the device while offline; sent to the server later. */
  offline?: boolean;
  /** Rule by rule, for design questions. */
  design?: DesignResult;
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

/** A named filter the user saved (GET /api/me/filters). */
export interface SavedFilter {
  id: string;
  name: string;
  filters: {
    search: string;
    tags: string[];
    difficulties: ('easy' | 'medium' | 'hard')[];
    status: '' | 'unanswered' | 'answered' | 'wrong' | 'bookmarked';
    sort: 'oldest' | 'newest' | 'random';
    seed: string;
  };
  createdAt: string;
}
