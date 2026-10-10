import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import csharp from 'highlight.js/lib/languages/csharp';
import go from 'highlight.js/lib/languages/go';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Only the languages the question banks use, to keep the bundle small.
// Each definition brings its own aliases (cs/c#, ts, js, sh/shell, yml, html…).
const LANGUAGES = { bash, csharp, go, javascript, json, python, sql, typescript, xml, yaml };
Object.entries(LANGUAGES).forEach(([name, def]) => hljs.registerLanguage(name, def));

const DISPLAY_NAMES: Record<string, string> = {
  bash: 'Bash',
  csharp: 'C#',
  go: 'Go',
  javascript: 'JavaScript',
  json: 'JSON',
  python: 'Python',
  sql: 'SQL',
  typescript: 'TypeScript',
  xml: 'HTML/XML',
  yaml: 'YAML',
};

/** Canonical language name for a fence tag like "cs" or "ts", or undefined if unknown. */
function resolveLanguage(lang: string): string | undefined {
  const def = lang ? hljs.getLanguage(lang) : undefined;
  if (!def) return undefined;
  return Object.keys(LANGUAGES).find((name) => hljs.getLanguage(name) === def);
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

  // highlight.js escapes the source before adding its <span> markup, so the
  // result is safe to inject; unknown languages are escaped the same way.
  const html = language
    ? hljs.highlight(code, { language, ignoreIllegals: true }).value
    : escapeHtml(code);

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
          {language ? DISPLAY_NAMES[language] : lang || 'text'}
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
