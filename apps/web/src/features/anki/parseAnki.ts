/**
 * Reads Anki's "Notes in Plain Text" export (File → Export → Notes in Plain
 * Text): header lines starting with "#" (#separator, #html, #tags column…),
 * then one note per line, fields separated by tabs (or the declared
 * separator). Fields containing the separator, quotes or newlines are
 * wrapped in double quotes with "" for a quote, as in CSV.
 */
export interface AnkiCard {
  front: string;
  back: string;
  tags: string[];
}

export interface ParsedDeck {
  cards: AnkiCard[];
  /** Lines that had fewer than two fields. */
  skipped: number;
}

const SEPARATORS: Record<string, string> = {
  tab: '\t',
  comma: ',',
  semicolon: ';',
  pipe: '|',
  space: ' ',
  colon: ':',
};

export function parseAnki(text: string): ParsedDeck {
  let sep = '\t';
  let html = true;
  let tagsColumn: number | null = null;
  const lines = text.replace(/^\uFEFF/, '').split('\n');
  let start = 0;
  for (; start < lines.length && lines[start].startsWith('#'); start++) {
    const m = lines[start].match(/^#([a-z ]+):(.*)$/i);
    if (!m) continue;
    const [key, value] = [m[1].trim().toLowerCase(), m[2].trim()];
    if (key === 'separator') sep = SEPARATORS[value.toLowerCase()] ?? value;
    if (key === 'html') html = value === 'true';
    if (key === 'tags column') tagsColumn = Number(value) - 1;
  }
  const rows = splitRows(lines.slice(start).join('\n'), sep);
  const cards: AnkiCard[] = [];
  let skipped = 0;
  for (const row of rows) {
    if (row.length === 1 && row[0].trim() === '') continue;
    if (row.length < 2) {
      skipped++;
      continue;
    }
    const field = (i: number) => (html ? htmlToRichText(row[i] ?? '') : (row[i] ?? '').trim());
    const tags =
      tagsColumn !== null && row[tagsColumn]
        ? row[tagsColumn].trim().split(/\s+/).filter(Boolean)
        : [];
    cards.push({ front: field(0), back: field(1), tags });
  }
  return { cards, skipped };
}

/** CSV-style splitting with quotes, so fields may hold separators and newlines. */
function splitRows(text: string, sep: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field === '') quoted = true;
    else if (c === sep) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field !== '' || row.length) rows.push([...row, field]);
  return rows;
}

/**
 * Anki fields are HTML; the app uses plain text with ```fences and `inline
 * code`. Keeps line breaks and code, drops other markup and media.
 */
export function htmlToRichText(fieldHtml: string): string {
  if (!/[<&]/.test(fieldHtml)) return fieldHtml.trim();
  const doc = new DOMParser().parseFromString(`<body>${fieldHtml}</body>`, 'text/html');
  const out: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out.push(node.textContent ?? '');
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    const tag = node.tagName.toLowerCase();
    if (tag === 'br') return void out.push('\n');
    if (tag === 'img' || tag === 'audio' || tag === 'video' || tag === 'script' || tag === 'style')
      return;
    if (tag === 'pre') {
      const code = node.querySelector('code');
      const lang = code?.className.match(/language-([\w#+-]+)/)?.[1] ?? '';
      const text = (code ?? node).innerHTML.replace(/<br\s*\/?>/gi, '\n');
      const plain = new DOMParser().parseFromString(text, 'text/html').body.textContent ?? '';
      return void out.push(`\n\`\`\`${lang}\n${plain.replace(/\n$/, '')}\n\`\`\`\n`);
    }
    if (tag === 'code') return void out.push('`' + (node.textContent ?? '') + '`');
    const block = ['div', 'p', 'li', 'ul', 'ol', 'hr', 'h1', 'h2', 'h3', 'h4', 'tr'].includes(tag);
    if (block) out.push('\n');
    if (tag === 'li') out.push('- ');
    node.childNodes.forEach(walk);
    if (block) out.push('\n');
  };
  doc.body.childNodes.forEach(walk);
  return out
    .join('')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Anki tags to the app's topics: "cs::Networking" → "Networking",
 * "APIs_&_HTTP" → "APIs & HTTP"; difficulty tags are dropped.
 */
export function ankiTagToTopic(tag: string): string | null {
  const parts = tag.split('::');
  if (parts.includes('difficulty')) return null;
  const last = parts[parts.length - 1].replace(/_/g, ' ').trim();
  return last || null;
}
