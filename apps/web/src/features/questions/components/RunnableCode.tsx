import { Lock, Play, RotateCcw, TerminalSquare } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ApiError } from '@/shared/api/client';
import { runCode, runnableLanguage, type RunResult } from '@/shared/runner/runCode';
import { CodeBlock } from '@/shared/ui';

interface RunnableCodeProps {
  code: string;
  language: string;
  /** Predict first: running is only offered once the answer is in. */
  canRun: boolean;
}

/** A code block with a Run button and a terminal-style output panel. */
export function RunnableCode({ code, language, canRun }: RunnableCodeProps) {
  const { t } = useTranslation();
  const runnable = runnableLanguage(language);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!runnable) return;
    setRunning(true);
    setError(null);
    try {
      setResult(await runCode(runnable, code));
    } catch (e) {
      setResult(null);
      setError(e instanceof ApiError ? e.message : t('runner.failed'));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="runnable">
      <CodeBlock code={code} lang={language} />
      {runnable && (
        <div className="runnable__bar">
          {canRun ? (
            <button
              type="button"
              className="btn btn--small"
              onClick={() => void run()}
              disabled={running}
            >
              {result ? <RotateCcw size={13} aria-hidden /> : <Play size={13} aria-hidden />}
              {running ? t('runner.running') : result ? t('runner.runAgain') : t('runner.run')}
            </button>
          ) : (
            <span className="runnable__locked">
              <Lock size={12} aria-hidden /> {t('runner.predictFirst')}
            </span>
          )}
          {runnable === 'go' && <span className="runnable__note">{t('runner.goNote')}</span>}
        </div>
      )}
      {(result || error) && (
        <figure className="terminal" aria-live="polite">
          <figcaption className="terminal__bar">
            <TerminalSquare size={13} aria-hidden /> {t('runner.output')}
          </figcaption>
          {error ? (
            <pre className="terminal__body terminal__body--error">{error}</pre>
          ) : (
            result && (
              <pre className="terminal__body">
                {result.output ||
                  (!result.errors && <span className="muted">{t('runner.noOutput')}</span>)}
                {result.errors && <span className="terminal__error">{result.errors}</span>}
              </pre>
            )
          )}
        </figure>
      )}
    </div>
  );
}
