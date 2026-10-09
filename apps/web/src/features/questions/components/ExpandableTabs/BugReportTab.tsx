import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { useReportBug } from '../../hooks/useQuestionExtras';

const bugSchema = z.object({ message: z.string().trim().min(1) });
type BugForm = z.infer<typeof bugSchema>;

export function BugReportTab({ questionId }: { questionId: string }) {
  const { t } = useTranslation();
  const reportBug = useReportBug(questionId);
  const form = useForm<BugForm>({ resolver: zodResolver(bugSchema), defaultValues: { message: '' } });

  const onSubmit = form.handleSubmit(async ({ message }) => {
    await reportBug.mutateAsync(message);
    form.reset();
  });

  return (
    <form onSubmit={onSubmit} className="stack" style={{ gap: 10 }}>
      {reportBug.isSuccess && <div className="alert alert--success">{t('question.bug.success')}</div>}
      <div className={form.formState.errors.message ? 'field field--error' : 'field'}>
        <textarea
          className="textarea"
          rows={2}
          placeholder={t('question.bug.placeholder')}
          {...form.register('message')}
        />
        {form.formState.errors.message && (
          <span className="field-error-text">{t('question.bug.required')}</span>
        )}
      </div>
      <button
        type="submit"
        className="btn"
        disabled={reportBug.isPending}
        style={{ alignSelf: 'flex-start' }}
      >
        {t('question.bug.submit')}
      </button>
    </form>
  );
}
