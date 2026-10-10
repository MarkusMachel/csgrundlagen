import { Play } from 'lucide-react';
import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { runCode, runnableLanguage } from '@/shared/runner/runCode';
import { CodeBlock } from '@/shared/ui';

import type { QuestionFormValues } from './QuestionForm';

const CODE_LANGUAGES = ['js', 'go', 'ts', 'python', 'csharp', 'sql', 'bash'];

/**
 * Editor for "predict the output" questions: the snippet, its language and
 * the expected output, which "Run to fill" can take from an actual run.
 */
export function OutputFields({ form }: { form: UseFormReturn<QuestionFormValues> }) {
  const { t } = useTranslation();
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const code = form.watch('code');
  const language = form.watch('codeLanguage');
  const runnable = runnableLanguage(language);
  const err = form.formState.errors;

  const fill = async () => {
    if (!runnable) return;
    setRunning(true);
    setRunError(null);
    try {
      const res = await runCode(runnable, code);
      if (res.errors) setRunError(res.errors);
      form.setValue('expectedOutput', res.output, { shouldDirty: true });
    } catch (e) {
      setRunError(e instanceof Error ? e.message : t('runner.failed'));
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <div className={err.code ? 'field field--error' : 'field'}>
        <label htmlFor="q-code">{t('authoring.code')}</label>
        <textarea
          id="q-code"
          className="textarea textarea--autogrow"
          rows={5}
          spellCheck={false}
          {...form.register('code')}
        />
        {code.trim() && <CodeBlock code={code} lang={language} />}
        {err.code && <span className="field-error-text">{t('authoring.required')}</span>}
      </div>
      <div className="field">
        <label htmlFor="q-lang">{t('authoring.codeLanguage')}</label>
        <select id="q-lang" className="select" {...form.register('codeLanguage')}>
          {CODE_LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <span className="tok-com" style={{ fontSize: 12 }}>
          {'// '}
          {runnable ? t('authoring.runnableHint') : t('authoring.notRunnableHint')}
        </span>
      </div>
      <div className="field">
        <label htmlFor="q-expected">{t('authoring.expectedOutput')}</label>
        <textarea
          id="q-expected"
          className="textarea textarea--autogrow"
          rows={3}
          spellCheck={false}
          {...form.register('expectedOutput')}
        />
        {runnable && (
          <button
            type="button"
            className="btn btn--small"
            style={{ alignSelf: 'flex-start' }}
            disabled={running || !code.trim()}
            onClick={() => void fill()}
          >
            <Play size={13} aria-hidden />
            {running ? t('runner.running') : t('authoring.runToFill')}
          </button>
        )}
        {runError && (
          <span className="field-error-text" role="alert">
            {runError}
          </span>
        )}
      </div>
    </>
  );
}
