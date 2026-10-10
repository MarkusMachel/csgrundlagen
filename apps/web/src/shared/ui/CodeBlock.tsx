import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Highlighter = typeof import('./highlight');

// highlight.js is fetched the first time a code block appears; until then
// (a moment, once) code shows as plain text.
let highlighter: Highlighter | null = null;
let loading: Promise<Highlighter> | null = null;
function loadHighlighter() {
  loading ??= import('./highlight').then((m) => (highlighter = m));
  return loading;
}

/** Fence tags we recognise, by canonical language (aliases as highlight.js knows them). */
const LANGUAGES: Record<string, { label: string; aliases: string[] }> = {
  bash: { label: 'Bash', aliases: ['sh', 'shell', 'zsh'] },
  csharp: { label: 'C#', aliases: ['cs', 'c#'] },
  go: { label: 'Go', aliases: ['golang'] },
  javascript: { label: 'JavaScript', aliases: ['js', 'jsx', 'mjs', 'cjs'] },
  json: { label: 'JSON', aliases: ['jsonc'] },
  python: { label: 'Python', aliases: ['py', 'gyp', 'ipython'] },
  sql: { label: 'SQL', aliases: [] },
  typescript: { label: 'TypeScript', aliases: ['ts', 'tsx', 'mts', 'cts'] },
  xml: {
    label: 'HTML/XML',
    aliases: ['html', 'xhtml', 'rss', 'atom', 'xjb', 'xsd', 'xsl', 'plist', 'svg'],
  },
  yaml: { label: 'YAML', aliases: ['yml'] },
};

/** Canonical language name for a fence tag like "cs" or "ts", or undefined if unknown. */
function resolveLanguage(lang: string): string | undefined {
  const tag = lang.trim().toLowerCase();
  if (!tag) return undefined;
  return Object.keys(LANGUAGES).find(
    (name) => name === tag || LANGUAGES[name].aliases.includes(tag),
  );
}

interface CodeBlockProps {
  code: string;
  /** Fence tag, e.g. "go", "sql", "cs". Unknown or empty renders as plain text. */
  lang?: string;
}

export function CodeBlock({ code, lang = '' }: CodeBlockProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const language = resolveLanguage(lang);
  const [hl, setHl] = useState(highlighter);

  useEffect(() => {
    if (!language || hl) return;
    let live = true;
    void loadHighlighter().then((m) => live && setHl(m));
    return () => {
      live = false;
    };
  }, [language, hl]);

  // Unknown languages, and code before the highlighter loads, are escaped.
  const html = language && hl ? hl.highlight(code, language) : escapeHtml(code);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked (e.g. insecure origin); nothing useful to show
    }
  };

  return (
    <figure className="code-block">
      <figcaption className="code-block__bar">
        <span className="code-block__lang">
          {language ? LANGUAGES[language].label : lang || 'text'}
        </span>
        <button
          type="button"
          className="code-block__copy"
          onClick={() => void copy()}
          aria-label={copied ? t('code.copied') : t('code.copy')}
          title={copied ? t('code.copied') : t('code.copy')}
        >
          {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
        </button>
      </figcaption>
      <pre className="code-block__pre scroll-thin">
        <code
          className={language ? `hljs language-${language}` : 'hljs'}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
    </figure>
  );
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
