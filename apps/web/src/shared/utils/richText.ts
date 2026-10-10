/**
 * The "rich text" format used for question prompts, options and explanations:
 * plain text (line breaks kept) plus Markdown-style code —
 *
 *   ```go
 *   func main() {}
 *   ```
 *
 * for blocks and `inline code` within a line. Nothing else is interpreted.
 */

export type RichSegment =
  { kind: 'text'; text: string } | { kind: 'code'; lang: string; code: string };

export type InlinePart = { kind: 'text'; text: string } | { kind: 'code'; code: string };

// ```lang (optional) … ``` with the fences on their own lines.
const FENCE = /^```[ \t]*([\w#+.-]*)[^\n]*\n([\s\S]*?)\n?^```[ \t]*$/gm;
const INLINE = /`([^`\n]+)`/g;

/** Splits text into prose and fenced code blocks; an unclosed fence stays prose. */
export function parseRichText(text: string): RichSegment[] {
  const segments: RichSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(FENCE)) {
    const start = match.index ?? 0;
    pushText(segments, text.slice(last, start));
    segments.push({ kind: 'code', lang: match[1].toLowerCase(), code: match[2] });
    last = start + match[0].length;
  }
  pushText(segments, text.slice(last));
  return segments;
}

function pushText(segments: RichSegment[], raw: string) {
  // Drop the blank lines that separate prose from a fence; keep inner breaks.
  const text = raw.replace(/^\n+|\n+$/g, '');
  if (text.trim()) segments.push({ kind: 'text', text });
}

/** Splits one stretch of prose into text and `inline code` parts. */
export function parseInline(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const start = match.index ?? 0;
    if (start > last) parts.push({ kind: 'text', text: text.slice(last, start) });
    parts.push({ kind: 'code', code: match[1] });
    last = start + match[0].length;
  }
  if (last < text.length) parts.push({ kind: 'text', text: text.slice(last) });
  return parts;
}

/** True when the text contains anything that renders differently from plain text. */
export function hasCode(text: string): boolean {
  return text.includes('`');
}

/** The text with fences and backticks removed, for accessible names and previews. */
export function toPlainText(text: string): string {
  return parseRichText(text)
    .map((s) =>
      s.kind === 'code'
        ? s.code
        : parseInline(s.text)
            .map((p) => (p.kind === 'code' ? p.code : p.text))
            .join(''),
    )
    .join('\n');
}
