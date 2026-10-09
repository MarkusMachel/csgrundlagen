import type { Meta, StoryObj } from '@storybook/react';

import type { Question } from '../types';
import { QuestionCard } from './QuestionCard';

const mcq: Question = {
  id: 'q1',
  type: 'multiple-choice',
  prompt: 'Which OSI layer is responsible for end-to-end reliable delivery of data?',
  tags: ['Networking', 'OSI Model'],
  difficulty: 'easy',
  explanation:
    'The transport layer (layer 4) provides end-to-end delivery. TCP adds reliability with acknowledgements and retransmission.',
  options: [
    { id: 'A', label: 'Network layer' },
    { id: 'B', label: 'Transport layer' },
    { id: 'C', label: 'Session layer' },
    { id: 'D', label: 'Data link layer' },
  ],
  correctOptionId: 'B',
};

const tfq: Question = {
  id: 'q2',
  type: 'true-false',
  prompt: 'UDP guarantees that datagrams arrive in the order they were sent.',
  tags: ['Networking'],
  difficulty: 'easy',
  explanation: 'UDP is connectionless and provides no ordering guarantees.',
  correctAnswer: false,
};

const meta: Meta<typeof QuestionCard> = {
  title: 'Questions/QuestionCard',
  component: QuestionCard,
};
export default meta;

type Story = StoryObj<typeof QuestionCard>;

/** Home feed: per-question submit, bookmark, scissors, all tabs. */
export const Feed: Story = {
  args: { question: mcq, mode: 'feed' },
};

export const FeedTrueFalse: Story = {
  args: { question: tfq, mode: 'feed' },
};

/** Build-a-Test picker: checkbox instead of submit. */
export const Pick: Story = {
  args: { question: mcq, mode: 'pick', selected: true },
};

/** Take-Test, Practice: no submit button, aids stay available. */
export const TestPractice: Story = {
  args: { question: mcq, mode: 'test', testMode: 'practice', heading: 'Question 1 of 5' },
};

/** Take-Test, Exam: scissors hidden, revealing tabs hidden until submit. */
export const TestExam: Story = {
  args: { question: mcq, mode: 'test', testMode: 'exam', heading: 'Question 1 of 5' },
};

/** Results/review: read-only, correctness revealed. */
export const Review: Story = {
  args: { question: mcq, mode: 'review', reviewGivenAnswer: 'A' },
};
