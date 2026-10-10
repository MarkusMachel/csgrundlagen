import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { gradeDesign } from '@/features/questions/design';

import { designSeedQuestions } from './design';
import copy from './systemDesign.json';

describe('system design seed', () => {
  it('is the same file the Go seed tool loads', () => {
    const api = JSON.parse(
      readFileSync(resolve(__dirname, '../../../../api/seeds/system-design.json'), 'utf8'),
    );
    expect(copy).toEqual(api);
  });

  it('every reference design passes all of its rules', () => {
    for (const { question } of designSeedQuestions) {
      if (question.type !== 'design') continue;
      const result = gradeDesign(question.design, question.design.reference);
      expect(
        result.rules.filter((r) => !r.passed),
        question.prompt,
      ).toEqual([]);
    }
  });
});
