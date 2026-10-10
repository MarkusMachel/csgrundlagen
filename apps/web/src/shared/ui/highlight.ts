// Loaded on demand by CodeBlock (dynamic import), so highlight.js stays out
// of the main bundle.
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

// Only the languages the question banks use, to keep the chunk small.
const LANGUAGES = { bash, csharp, go, javascript, json, python, sql, typescript, xml, yaml };
Object.entries(LANGUAGES).forEach(([name, def]) => hljs.registerLanguage(name, def));

/**
 * Highlighted HTML for code in a known language. highlight.js escapes the
 * source before adding its <span> markup, so the result is safe to inject.
 */
export function highlight(code: string, language: string): string {
  return hljs.highlight(code, { language, ignoreIllegals: true }).value;
}
