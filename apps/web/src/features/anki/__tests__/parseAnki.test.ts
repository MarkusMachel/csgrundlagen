import { describe, expect, it } from 'vitest';

import { ankiTagToTopic, htmlToRichText, parseAnki } from '../parseAnki';

describe('parseAnki', () => {
  it('reads the headers, tab-separated notes and the tags column', () => {
    const deck = parseAnki(
      '#separator:tab\n#html:true\n#tags column:3\nWhat is <b>TCP</b>?\tA reliable protocol.<br>It retransmits.\tcs::Networking cs::difficulty::easy\nlonely line\n',
    );
    expect(deck.cards).toEqual([
      {
        front: 'What is TCP?',
        back: 'A reliable protocol.\nIt retransmits.',
        tags: ['cs::Networking', 'cs::difficulty::easy'],
      },
    ]);
    expect(deck.skipped).toBe(1);
  });

  it('handles quoted fields with tabs, quotes and newlines', () => {
    const deck = parseAnki(
      '#separator:tab\n#html:false\n"front\twith tab"\t"line one\nline ""two"""\n',
    );
    expect(deck.cards[0]).toEqual({
      front: 'front\twith tab',
      back: 'line one\nline "two"',
      tags: [],
    });
  });

  it('understands named separators', () => {
    expect(parseAnki('#separator:semicolon\n#html:false\nfront;back\n').cards[0]).toMatchObject({
      front: 'front',
      back: 'back',
    });
  });

  it("turns code markup into the app's code fences and inline code", () => {
    expect(
      htmlToRichText(
        'Use <code>defer</code>:<pre><code class="language-go">defer f()<br>return</code></pre>',
      ),
    ).toBe('Use `defer`:\n```go\ndefer f()\nreturn\n```');
    expect(htmlToRichText('a &amp; b<img src="x.png"><div>next</div>')).toBe('a & b\nnext');
  });

  it('maps tags to topics', () => {
    expect(ankiTagToTopic('cs::APIs_&_HTTP')).toBe('APIs & HTTP');
    expect(ankiTagToTopic('golang')).toBe('golang');
    expect(ankiTagToTopic('cs::difficulty::easy')).toBeNull();
  });
});
