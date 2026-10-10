/** GET /me/progress: one user's learning overview. */
export interface Progress {
  totals: {
    questions: number;
    seen: number;
    answers: number;
    correct: number;
    dueNow: number;
    streakDays: number;
  };
  byTag: TagProgress[];
  /** The last 30 days, oldest first (dates in the user's time zone). */
  activity: { date: string; answers: number; correct: number }[];
  /** Reviews due on each of the next 7 days; overdue ones count as today. */
  upcoming: { date: string; count: number }[];
}

export interface TagProgress {
  tag: string;
  questions: number;
  seen: number;
  answers: number;
  correct: number;
}
