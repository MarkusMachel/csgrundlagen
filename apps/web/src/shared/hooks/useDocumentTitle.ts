import { useEffect } from 'react';

const SITE = 'CS Fundamentals Trainer';

/**
 * Sets the browser tab title while a page is shown ("<title> · CS
 * Fundamentals Trainer"), the same format the server renders for search
 * engines (apps/api/internal/httpapi/seo.go).
 */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : SITE;
    return () => {
      document.title = SITE;
    };
  }, [title]);
}

/** A prompt as a one-line title: code blocks and backticks out, at most 60 characters. */
export function promptTitle(prompt: string): string {
  const prose = prompt
    .split('```')
    .filter((_, i) => i % 2 === 0)
    .join(' ');
  const text = (prose.trim() ? prose : prompt).replace(/`/g, '').replace(/\s+/g, ' ').trim();
  if (text.length <= 60) return text;
  const cut = text.slice(0, 59);
  const space = cut.lastIndexOf(' ');
  return `${space > 30 ? cut.slice(0, space) : cut}…`;
}
