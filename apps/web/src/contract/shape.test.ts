import { describe, expect, it } from 'vitest';

import { diffShapes, shapeOf } from './shape';

const diff = (mock: unknown, api: unknown, maps?: string[]) =>
  diffShapes(shapeOf(mock, maps), shapeOf(api, maps));

describe('contract shapes', () => {
  it('ignores values, only compares types', () => {
    expect(diff({ id: 'q1', n: 1 }, { id: 'uuid', n: 7 })).toEqual([]);
    expect(diff({ n: 1 }, { n: '1' })).toEqual(['$.n: mock number, api string']);
  });

  it('reports fields only one side has', () => {
    expect(diff({ a: 1, b: 2 }, { a: 1 })).toEqual(['$.b: only in mock (number)']);
    expect(diff([{ a: 1 }], [{ a: 1, c: true }])).toEqual(['$[].c: only in api (boolean)']);
  });

  it('treats null and missing alike, and empty arrays as anything', () => {
    expect(diff({ a: null }, {})).toEqual([]);
    expect(diff({ a: null }, { a: 'x' })).toEqual([]);
    expect(diff({ list: [] }, { list: [{ x: 1 }] })).toEqual([]);
  });

  it('allows a field that only some array elements have to be missing', () => {
    expect(diff([{ a: 1 }, { a: 2, b: 'x' }], [{ a: 3 }])).toEqual([]);
  });

  it('does not compare different variants of a union', () => {
    expect(
      diff({ type: 'true-false', correctAnswer: true }, { type: 'multiple-choice', options: [] }),
    ).toEqual([]);
    expect(diff({ type: 'true-false', correctAnswer: true }, { type: 'true-false' })).toEqual([
      '$.correctAnswer: only in mock (boolean)',
    ]);
  });

  it('compares data-keyed objects by their values', () => {
    expect(diff({ answers: { q1: 'A' } }, { answers: { 'u-9': 'B' } }, ['$.answers'])).toEqual([]);
    expect(diff({ answers: { q1: 'A' } }, { answers: { x: 3 } }, ['$.answers'])).toEqual([
      '$.answers{}: mock string, api number',
    ]);
  });
});
