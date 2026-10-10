import { describe, expect, it } from 'vitest';

import { categorize, slugify } from './categorize';
import type { MaterialItem } from './types';

const m = (id: string, title: string, tags: string[]): MaterialItem => ({
  id,
  type: 'article',
  title,
  url: `https://example.com/${id}`,
  tags,
});

describe('categorize', () => {
  it('files each material once, under its most specific tag', () => {
    const cats = categorize([
      m('1', 'B post', ['Go', 'Async & Concurrency']),
      m('2', 'A post', ['Go']),
      m('3', 'C post', ['Async & Concurrency', 'Go', 'ezCater prep']),
      m('4', 'D post', ['Go']),
    ]);
    // "Go" is on all four, so the topic wins wherever a material has one
    expect(cats.map((c) => [c.name, c.items.map((i) => i.title)])).toEqual([
      ['Async & Concurrency', ['B post', 'C post']],
      ['Go', ['A post', 'D post']],
    ]);
  });

  it('never uses a collection tag as a category, and puts untagged last', () => {
    const cats = categorize([m('1', 'Prep only', ['ezCater prep']), m('2', 'Topic', ['SQL'])]);
    expect(cats.map((c) => [c.name, c.slug])).toEqual([
      ['SQL', 'sql'],
      ['', 'other'],
    ]);
  });

  it('breaks ties alphabetically so the result is stable', () => {
    const cats = categorize([m('1', 'x', ['Zeta', 'Alpha'])]);
    expect(cats[0].name).toBe('Alpha');
  });
});

describe('slugify', () => {
  it('makes URL-safe fragments', () => {
    expect(slugify('Async & Concurrency')).toBe('async-concurrency');
    expect(slugify('Algorithms (Go)')).toBe('algorithms-go');
  });
});
