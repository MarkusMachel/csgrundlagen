import type { QuestionComment } from '@/features/questions/types';

export const seedComments: QuestionComment[] = [
  {
    id: 'c1',
    questionId: 'q1',
    userId: 'u2',
    userName: 'Ada Lovelace',
    body: 'Mnemonic for the layers: "Please Do Not Throw Sausage Pizza Away" (bottom-up).',
    createdAt: '2026-08-20T10:15:00.000Z',
  },
  {
    id: 'c2',
    questionId: 'q1',
    userId: 'u3',
    userName: 'Grace Hopper',
    body: 'Careful: reliability is TCP, not the transport layer per se — UDP is also layer 4.',
    createdAt: '2026-08-21T09:30:00.000Z',
  },
  {
    id: 'c3',
    questionId: 'q22',
    userId: 'u2',
    userName: 'Ada Lovelace',
    body: 'Think of a stack of plates: you always take the top one.',
    createdAt: '2026-08-25T14:00:00.000Z',
  },
  {
    id: 'c4',
    questionId: 'q26',
    userId: 'u3',
    userName: 'Grace Hopper',
    body: 'Median-of-three pivot selection makes the worst case very unlikely in practice.',
    createdAt: '2026-08-28T16:45:00.000Z',
  },
];
