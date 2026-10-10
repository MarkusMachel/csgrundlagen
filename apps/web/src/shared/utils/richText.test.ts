import { describe, expect, it } from 'vitest';

import { hasCode, parseInline, parseRichText, toPlainText } from './richText';

describe('parseRichText', () => {
  it('returns plain text as a single segment', () => {
    expect(parseRichText('Just prose.\nSecond line.')).toEqual([
      { kind: 'text', text: 'Just prose.\nSecond line.' },
    ]);
  });

  it('splits prose and fenced blocks, keeping indentation inside the code', () => {
    const text = 'Use a map.\n\n```go\nfunc f() {\n\treturn\n}\n```\n\nThen done.';
    expect(parseRichText(text)).toEqual([
      { kind: 'text', text: 'Use a map.' },
      { kind: 'code', lang: 'go', code: 'func f() {\n\treturn\n}' },
      { kind: 'text', text: 'Then done.' },
    ]);
  });

  it('handles several blocks, a missing language and backticks inside code', () => {
    const text = '```\nplain\n```\n```SQL\nSELECT `x`;\n```';
    expect(parseRichText(text)).toEqual([
      { kind: 'code', lang: '', code: 'plain' },
      { kind: 'code', lang: 'sql', code: 'SELECT `x`;' },
    ]);
  });

  it('leaves an unclosed fence as prose', () => {
    expect(parseRichText('```go\nfunc f()')).toEqual([{ kind: 'text', text: '```go\nfunc f()' }]);
  });
});

describe('parseInline', () => {
  it('finds inline code spans', () => {
    expect(parseInline('Call `ctx.Done()` before `close`.')).toEqual([
      { kind: 'text', text: 'Call ' },
      { kind: 'code', code: 'ctx.Done()' },
      { kind: 'text', text: ' before ' },
      { kind: 'code', code: 'close' },
      { kind: 'text', text: '.' },
    ]);
  });
});

describe('toPlainText / hasCode', () => {
  it('strips the markup', () => {
    expect(toPlainText('Use `sync.Once`:\n\n```go\nonce.Do(f)\n```')).toBe(
      'Use sync.Once:\nonce.Do(f)',
    );
    expect(hasCode('no code here')).toBe(false);
    expect(hasCode('a `b`')).toBe(true);
  });
});
