import { describe, expect, it } from 'vitest';

import { pageWindow } from './pageWindow';

describe('pageWindow', () => {
  it('shows every page when there are 7 or fewer', () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('collapses the tail near the start', () => {
    expect(pageWindow(1, 24)).toEqual([1, 2, 3, 4, 5, 'gap', 24]);
    expect(pageWindow(4, 24)).toEqual([1, 2, 3, 4, 5, 'gap', 24]);
  });

  it('collapses both sides in the middle', () => {
    expect(pageWindow(5, 24)).toEqual([1, 'gap', 4, 5, 6, 'gap', 24]);
    expect(pageWindow(12, 24)).toEqual([1, 'gap', 11, 12, 13, 'gap', 24]);
  });

  it('collapses the head near the end', () => {
    expect(pageWindow(21, 24)).toEqual([1, 'gap', 20, 21, 22, 23, 24]);
    expect(pageWindow(24, 24)).toEqual([1, 'gap', 20, 21, 22, 23, 24]);
  });

  it('always has 7 slots once there are more than 7 pages', () => {
    for (let page = 1; page <= 24; page++) expect(pageWindow(page, 24)).toHaveLength(7);
  });
});
