import { describe, expect, it } from 'vitest';

import { gradeDesign, offendingEdges } from '../design';
import { isAnswerCorrect } from '../grading';
import type { DesignGraph, DesignKind, DesignQuestion, DesignSpec } from '../types';

// The same cases as store/design_test.go, so both graders agree.
const spec: DesignSpec = {
  requirements: [{ id: 'r1', text: 'Fast reads' }],
  rules: [
    {
      id: 'lb',
      kind: 'path',
      from: ['client'],
      via: ['load-balancer'],
      to: ['service'],
      text: 't',
      explanation: 'e',
    },
    { id: 'cache', kind: 'edge', from: ['service'], to: ['cache'], text: 't', explanation: 'e' },
    { id: 'two', kind: 'has', of: ['service'], min: 2, text: 't', explanation: 'e' },
    {
      id: 'nodb',
      kind: 'no-edge',
      from: ['client'],
      to: ['sql', 'nosql'],
      text: 't',
      explanation: 'e',
    },
    { id: 'cdn', kind: 'has', of: ['cdn'], optional: true, text: 't', explanation: 'e' },
  ],
  reference: { nodes: [], edges: [] },
};

const g = (nodes: Record<string, DesignKind>, ...edges: [string, string][]): DesignGraph => ({
  nodes: Object.entries(nodes).map(([id, kind]) => ({ id, kind })),
  edges: edges.map(([from, to]) => ({ from, to })),
});
const passed = (graph: DesignGraph) =>
  Object.fromEntries(gradeDesign(spec, graph).rules.map((r) => [r.id, r.passed]));

describe('design grading', () => {
  it('passes a good design; optional rules do not count', () => {
    const good = g(
      { c: 'client', lb: 'load-balancer', s1: 'service', s2: 'service', k: 'cache', db: 'sql' },
      ['c', 'lb'],
      ['lb', 's1'],
      ['lb', 's2'],
      ['s1', 'k'],
      ['s1', 'db'],
    );
    const r = gradeDesign(spec, good);
    expect([r.score, r.total]).toEqual([4, 4]);
    expect(passed(good).cdn).toBe(false);
  });

  it('fails each rule a weak design breaks', () => {
    const bad = g(
      { c: 'client', lb: 'load-balancer', s: 'service', db: 'sql' },
      ['c', 's'],
      ['s', 'lb'],
      ['c', 'db'],
    );
    expect(passed(bad)).toEqual({ lb: false, cache: false, two: false, nodb: false, cdn: false });
    expect(offendingEdges(spec, bad, gradeDesign(spec, bad))).toEqual([{ from: 'c', to: 'db' }]);
  });

  it('a path has to go through the via component towards the target', () => {
    const backwards = g(
      { c: 'client', lb: 'load-balancer', s: 'service' },
      ['c', 'lb'],
      ['s', 'lb'],
    );
    expect(passed(backwards).lb).toBe(false);
  });

  it('ignores arrows to components that are not there', () => {
    // only "clients never talk to the database" holds, and nothing crashes
    expect(passed(g({ c: 'client' }, ['c', 'ghost']))).toMatchObject({ lb: false, nodb: true });
  });

  it('counts as correct only when every required rule passes', () => {
    const q: DesignQuestion = {
      id: 'd',
      type: 'design',
      prompt: 'p',
      tags: [],
      explanation: 'e',
      design: spec,
    };
    const good = g(
      { c: 'client', lb: 'load-balancer', s1: 'service', s2: 'service', k: 'cache' },
      ['c', 'lb'],
      ['lb', 's1'],
      ['lb', 's2'],
      ['s1', 'k'],
    );
    expect(isAnswerCorrect(q, good)).toBe(true);
    expect(isAnswerCorrect(q, g({ c: 'client' }))).toBe(false);
    expect(isAnswerCorrect(q, 'B')).toBe(false);
  });
});
