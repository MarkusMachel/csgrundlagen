import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { promptTitle, useDocumentTitle } from './useDocumentTitle';

describe('document titles', () => {
  it('sets the page title and restores the site name afterwards', () => {
    const { unmount } = renderHook(() => useDocumentTitle('Design a URL shortener'));
    expect(document.title).toBe('Design a URL shortener · CS Fundamentals Trainer');
    unmount();
    expect(document.title).toBe('CS Fundamentals Trainer');
  });

  it('makes a one-line title from a prompt, like the server does', () => {
    expect(promptTitle('What does `x` print?\n```js\nconsole.log(x)\n```')).toBe(
      'What does x print?',
    );
    expect(promptTitle('```go\nfmt.Println(1)\n```')).toBe('go fmt.Println(1)');
    const long = promptTitle(
      'Which description of the SOLID principles is accurate when applied to large systems?',
    );
    expect(long.length).toBeLessThanOrEqual(60);
    expect(long.endsWith('…')).toBe(true);
  });
});
