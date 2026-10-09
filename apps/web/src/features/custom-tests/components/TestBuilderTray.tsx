import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Question } from '@/features/questions';

import { useTestBuilderStore } from '../hooks/useTestBuilder';
import { useCreateTest } from '../hooks/useTests';
import type { CustomTest } from '../types';

const builderSchema = z
  .object({
    name: z.string().trim().min(1),
    timed: z.boolean(),
    durationMinutes: z.coerce.number().int().min(1).optional(),
    shuffleQuestions: z.boolean(),
    shuffleOptions: z.boolean(),
  })
  .refine((v) => !v.timed || (v.durationMinutes !== undefined && v.durationMinutes >= 1), {
    path: ['durationMinutes'],
  });

type BuilderForm = z.infer<typeof builderSchema>;

interface TestBuilderTrayProps {
  /** Question objects for the current selection (page resolves ids → data). */
  selectedQuestions: Question[];
  onSaved: (test: CustomTest) => void;
}

export function TestBuilderTray({ selectedQuestions, onSaved }: TestBuilderTrayProps) {
  const { t } = useTranslation();
  const ids = { name: useId(), duration: useId() };
  const { selectedQuestionIds, removeQuestion, clear } = useTestBuilderStore();
  const createTest = useCreateTest();

  const form = useForm<BuilderForm>({
    resolver: zodResolver(builderSchema),
    defaultValues: {
      name: '',
      timed: false,
      durationMinutes: 15,
      shuffleQuestions: false,
      shuffleOptions: false,
    },
  });
  const timed = form.watch('timed');

  const onSubmit = form.handleSubmit(async (values) => {
    if (selectedQuestionIds.length === 0) return;
    const test = await createTest.mutateAsync({
      name: values.name,
      questionIds: selectedQuestionIds,
      timed: values.timed,
      durationMinutes: values.timed ? values.durationMinutes : undefined,
      shuffleQuestions: values.shuffleQuestions,
      shuffleOptions: values.shuffleOptions,
    });
    clear();
    form.reset();
    onSaved(test);
  });

  const promptOf = (id: string) => selectedQuestions.find((q) => q.id === id)?.prompt ?? id;

  return (
    <form
      onSubmit={onSubmit}
      className="card stack"
      style={{ gap: 12 }}
      data-testid="test-builder-tray"
    >
      <h2 style={{ margin: 0 }}>
        {t('builder.selected')} ({selectedQuestionIds.length})
      </h2>

      {selectedQuestionIds.length === 0 ? (
        <p className="tok-com" style={{ margin: 0 }}>
          {'// '}
          {t('builder.emptyTray')}
        </p>
      ) : (
        <ul className="tray-list">
          {selectedQuestionIds.map((id) => (
            <li key={id}>
              <span className="tray-prompt">{promptOf(id)}</span>
              <button
                type="button"
                className="btn btn--icon btn--danger"
                aria-label={t('builder.remove')}
                onClick={() => removeQuestion(id)}
              >
                <X size={15} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <hr className="divider" />

      <div className={form.formState.errors.name ? 'field field--error' : 'field'}>
        <label htmlFor={ids.name}>{t('builder.testName')}</label>
        <input id={ids.name} className="input" {...form.register('name')} />
        {form.formState.errors.name && (
          <span className="field-error-text">{t('builder.nameRequired')}</span>
        )}
      </div>

      <Controller
        control={form.control}
        name="timed"
        render={({ field }) => (
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
            {t('builder.timed')}
          </label>
        )}
      />
      {timed && (
        <div className={form.formState.errors.durationMinutes ? 'field field--error' : 'field'}>
          <label htmlFor={ids.duration}>{t('builder.durationMinutes')}</label>
          <input
            id={ids.duration}
            type="number"
            min={1}
            className="input"
            {...form.register('durationMinutes')}
          />
          {form.formState.errors.durationMinutes && (
            <span className="field-error-text">{t('builder.durationInvalid')}</span>
          )}
        </div>
      )}

      <Controller
        control={form.control}
        name="shuffleQuestions"
        render={({ field }) => (
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
            {t('builder.shuffleQuestions')}
          </label>
        )}
      />
      <Controller
        control={form.control}
        name="shuffleOptions"
        render={({ field }) => (
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
            {t('builder.shuffleOptions')}
          </label>
        )}
      />

      {selectedQuestionIds.length === 0 && form.formState.isSubmitted && (
        <div className="alert alert--error">{t('builder.needQuestions')}</div>
      )}

      <button
        type="submit"
        className="btn btn--primary"
        disabled={createTest.isPending || selectedQuestionIds.length === 0}
        style={{ alignSelf: 'flex-start' }}
      >
        <span className="prompt-char" aria-hidden>
          $
        </span>
        {t('builder.saveTest')}
      </button>
    </form>
  );
}
