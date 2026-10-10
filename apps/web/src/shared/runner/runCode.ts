import { api } from '@/shared/api/client';

import { JS_WORKER_SOURCE } from './jsWorkerSource';

export interface RunResult {
  /** Everything printed, stdout and stderr interleaved. */
  output: string;
  /** Compile errors (Go), or why the run stopped (time limit). */
  errors?: string;
  exitCode?: number;
}

export type RunnableLanguage = 'js' | 'go';

/** Which runner a fence tag maps to, if any. */
export function runnableLanguage(lang: string): RunnableLanguage | null {
  const l = lang.toLowerCase();
  if (l === 'js' || l === 'javascript' || l === 'node') return 'js';
  if (l === 'go' || l === 'golang') return 'go';
  return null;
}

export const JS_TIME_LIMIT_MS = 3000;

/** Runs JavaScript in a throwaway Web Worker, killed after the time limit. */
export function runJs(code: string, timeLimitMs = JS_TIME_LIMIT_MS): Promise<RunResult> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([JS_WORKER_SOURCE], { type: 'text/javascript' }));
    const worker = new Worker(url);
    const lines: string[] = [];
    const finish = (errors?: string) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ output: lines.length ? `${lines.join('\n')}\n` : '', errors });
    };
    const timer = setTimeout(
      () =>
        finish(`Stopped after ${timeLimitMs / 1000} s (infinite loop or a timer that never ends?)`),
      timeLimitMs,
    );
    worker.onmessage = (e: MessageEvent<{ type: 'out' | 'done'; text?: string }>) => {
      if (e.data.type === 'out') lines.push(e.data.text ?? '');
      else finish();
    };
    worker.onerror = (e) => {
      e.preventDefault();
      finish(e.message);
    };
    worker.postMessage(code);
  });
}

/** Runs Go on the server, which forwards it to the Go Playground sandbox. */
export function runGo(code: string): Promise<RunResult> {
  return api.post<RunResult>('/run', { language: 'go', code });
}

export function runCode(language: RunnableLanguage, code: string): Promise<RunResult> {
  return language === 'js' ? runJs(code) : runGo(code);
}
