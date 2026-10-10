import { describe, expect, it } from 'vitest';

import { canSubmit, isAnswerCorrect, normalizeOutput } from '../grading';
import type { AnswerValue, Question } from '../types';

const base = { id: 'x', prompt: 'p', tags: [], explanation: 'e' };
const multi: Question = {
  ...base,
  type: 'multi-select',
  options: [],
  correctOptionIds: ['A', 'C'],
};
const order: Question = { ...base, type: 'ordering', options: [], correctOrder: ['C', 'A', 'B'] };
const output: Question = {
  ...base,
  type: 'output',
  code: 'x',
  codeLanguage: 'js',
  expectedOutput: 'A\nB\npromise\ntimeout',
};

// Same cases as the Go grader (internal/store/grading_test.go).
const cases: [string, Question, AnswerValue | undefined, boolean][] = [
  ['multi any order', multi, ['C', 'A'], true],
  ['multi missing one', multi, ['A'], false],
  ['multi extra', multi, ['A', 'B', 'C'], false],
  ['multi duplicate', multi, ['A', 'A'], false],
  ['ordering exact', order, ['C', 'A', 'B'], true],
  ['ordering swapped', order, ['A', 'C', 'B'], false],
  ['output exact', output, 'A\nB\npromise\ntimeout', true],
  ['output crlf + trailing space', output, 'A  \r\nB\r\npromise\r\ntimeout\r\n\r\n', true],
  ['output order matters', output, 'A\nB\ntimeout\npromise', false],
  ['output case matters', output, 'a\nb\npromise\ntimeout', false],
  ['unanswered', output, undefined, false],
];

describe('isAnswerCorrect', () => {
  it.each(cases)('%s', (_name, q, given, want) => {
    expect(isAnswerCorrect(q, given)).toBe(want);
  });
});

describe('canSubmit / normalizeOutput', () => {
  it('requires a pick or some text', () => {
    expect(canSubmit(multi, [])).toBe(false);
    expect(canSubmit(multi, ['A'])).toBe(true);
    expect(canSubmit(output, '  ')).toBe(false);
  });
  it('keeps inner whitespace', () => {
    expect(normalizeOutput('a  b \n')).toBe('a  b');
  });
});
