import { describe, expect, it } from 'vitest';

import { seededShuffle } from './shuffle';

describe('seededShuffle', () => {
  const input = ['a', 'b', 'c', 'd', 'e'];

  it('is deterministic for a fixed seed', () => {
    expect(seededShuffle(input, 42)).toEqual(seededShuffle(input, 42));
    expect(seededShuffle(input, 7)).toEqual(seededShuffle(input, 7));
  });

  it('produces different orders for different seeds', () => {
    const orders = new Set(
      [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => seededShuffle(input, seed).join('')),
    );
    expect(orders.size).toBeGreaterThan(1);
  });

  it('returns a permutation without mutating the input', () => {
    const copy = [...input];
    const result = seededShuffle(input, 99);
    expect(input).toEqual(copy);
    expect([...result].sort()).toEqual([...input].sort());
  });
});
