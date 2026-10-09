/** Platform-wide admin stats (GET /api/admin/stats). */
export interface AdminStats {
  totals: {
    questions: number;
    materials: number;
    users: number;
    tests: number;
    testAttempts: number;
    answersSubmitted: number;
    bookmarks: number;
    comments: number;
    bugReports: number;
  };
  questionsByType: { type: string; count: number }[];
  questionsByDifficulty: { difficulty: string; count: number }[];
  materialsByType: { type: string; count: number }[];
  /** Top tags by number of answers submitted on their questions. */
  answersByTag: { tag: string; count: number }[];
  /** Overall correct vs incorrect across all recorded answers. */
  correctness: { correct: number; incorrect: number };
}
