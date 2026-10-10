import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';
import { useEffect, useId } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { useMaterials } from '@/features/materials';
import { useTags } from '@/features/questions';

import { useCreateQuestion } from '../hooks/useAuthoring';
import type { CreateQuestionInput } from '../types';
import { LinkPicker } from './LinkPicker';
import { TagInput } from './TagInput';

const OPTION_IDS = ['A', 'B', 'C', 'D', 'E'] as const;

const schema = z
  .object({
    type: z.enum(['multiple-choice', 'true-false']),
    prompt: z.string().trim().min(1),
    tags: z.array(z.string()).min(1),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    explanation: z.string().trim().min(1),
    options: z.array(z.object({ label: z.string() })),
    correctOptionId: z.string(),
    correctAnswer: z.boolean(),
    relatedMaterialIds: z.array(z.string()),
  })
  .superRefine((v, ctx) => {
    if (v.type === 'multiple-choice') {
      const filled = v.options.filter((o) => o.label.trim().length > 0);
      if (filled.length < 2) {
        ctx.addIssue({ code: 'custom', path: ['options'], message: 'min2' });
      }
      const correctIndex = OPTION_IDS.indexOf(v.correctOptionId as (typeof OPTION_IDS)[number]);
      if (correctIndex < 0 || !v.options[correctIndex]?.label.trim()) {
        ctx.addIssue({ code: 'custom', path: ['correctOptionId'], message: 'pickCorrect' });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

export function QuestionForm({ onCreated }: { onCreated?: (id: string) => void }) {
  const { t } = useTranslation();
  const successId = useId();
  const createQuestion = useCreateQuestion();
  const { data: tags } = useTags();
  const { data: materialsData } = useMaterials();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'multiple-choice',
      prompt: '',
      tags: [],
      difficulty: 'medium',
      explanation: '',
      options: [{ label: '' }, { label: '' }, { label: '' }, { label: '' }],
      correctOptionId: 'A',
      correctAnswer: true,
      relatedMaterialIds: [],
    },
  });
  const type = form.watch('type');
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'options' });

  // keep correctOptionId valid if the chosen option is removed
  useEffect(() => {
    if (type !== 'multiple-choice') return;
    const idx = OPTION_IDS.indexOf(
      form.getValues('correctOptionId') as (typeof OPTION_IDS)[number],
    );
    if (idx >= fields.length) form.setValue('correctOptionId', 'A');
  }, [fields.length, type, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const input: CreateQuestionInput = {
      type: values.type,
      prompt: values.prompt,
      tags: values.tags,
      difficulty: values.difficulty,
      explanation: values.explanation,
      relatedMaterialIds: values.relatedMaterialIds,
    };
    if (values.type === 'multiple-choice') {
      const opts = values.options
        .map((o, i) => ({ id: OPTION_IDS[i], label: o.label.trim() }))
        .filter((o) => o.label.length > 0);
      input.options = opts;
      input.correctOptionId = values.correctOptionId;
    } else {
      input.correctAnswer = values.correctAnswer;
    }
    const created = await createQuestion.mutateAsync(input);
    form.reset();
    onCreated?.(created.id);
  });

  const err = form.formState.errors;

  return (
    <form onSubmit={onSubmit} className="stack" style={{ gap: 14 }}>
      <div className="field">
        <label>{t('authoring.questionType')}</label>
        <div className="hstack" style={{ gap: 16 }}>
          {(['multiple-choice', 'true-false'] as const).map((v) => (
            <label key={v} className="checkbox-row">
              <input type="radio" value={v} checked={type === v} {...form.register('type')} />
              {t(`authoring.type.${v}`)}
            </label>
          ))}
        </div>
      </div>

      <div className={err.prompt ? 'field field--error' : 'field'}>
        <label htmlFor="q-prompt">{t('authoring.prompt')}</label>
        <textarea id="q-prompt" className="textarea" rows={3} {...form.register('prompt')} />
        {err.prompt && <span className="field-error-text">{t('authoring.required')}</span>}
      </div>

      {type === 'multiple-choice' ? (
        <div className={err.options || err.correctOptionId ? 'field field--error' : 'field'}>
          <label>{t('authoring.options')}</label>
          <span className="tok-com" style={{ fontSize: 12 }}>
            {'// '}
            {t('authoring.optionsHint')}
          </span>
          {fields.map((f, i) => (
            <div key={f.id} className="hstack" style={{ gap: 8 }}>
              <label className="checkbox-row" aria-label={t('authoring.markCorrect')}>
                <input
                  type="radio"
                  value={OPTION_IDS[i]}
                  checked={form.watch('correctOptionId') === OPTION_IDS[i]}
                  {...form.register('correctOptionId')}
                />
                <span>
                  <span className="tok-kw">var</span>{' '}
                  <span className="tok-idx">{OPTION_IDS[i]}</span>
                </span>
              </label>
              <input
                className="input"
                placeholder={`"${t('authoring.optionPlaceholder')}"`}
                {...form.register(`options.${i}.label` as const)}
              />
              {fields.length > 2 && (
                <button
                  type="button"
                  className="btn btn--icon btn--danger"
                  aria-label={t('authoring.removeOption', { n: i })}
                  onClick={() => remove(i)}
                >
                  <X size={15} aria-hidden />
                </button>
              )}
            </div>
          ))}
          {fields.length < 5 && (
            <button
              type="button"
              className="btn"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => append({ label: '' })}
            >
              <Plus size={15} aria-hidden />
              {t('authoring.addOption')}
            </button>
          )}
          {err.options && <span className="field-error-text">{t('authoring.optionsMin')}</span>}
          {err.correctOptionId && (
            <span className="field-error-text">{t('authoring.pickCorrect')}</span>
          )}
        </div>
      ) : (
        <div className="field">
          <label>{t('authoring.correctAnswer')}</label>
          <div className="hstack" style={{ gap: 16 }}>
            {[
              { v: true, label: t('question.true') },
              { v: false, label: t('question.false') },
            ].map(({ v, label }) => (
              <label key={String(v)} className="checkbox-row">
                <input
                  type="radio"
                  checked={form.watch('correctAnswer') === v}
                  onChange={() => form.setValue('correctAnswer', v)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className={err.explanation ? 'field field--error' : 'field'}>
        <label htmlFor="q-expl">{t('authoring.explanation')}</label>
        <textarea id="q-expl" className="textarea" rows={3} {...form.register('explanation')} />
        {err.explanation && <span className="field-error-text">{t('authoring.required')}</span>}
      </div>

      <div className="field">
        <label htmlFor="q-diff">{t('question.difficultyLabel')}</label>
        <select id="q-diff" className="select" {...form.register('difficulty')}>
          <option value="easy">{t('question.difficulty.easy')}</option>
          <option value="medium">{t('question.difficulty.medium')}</option>
          <option value="hard">{t('question.difficulty.hard')}</option>
        </select>
      </div>

      <Controller
        control={form.control}
        name="tags"
        render={({ field }) => (
          <TagInput
            value={field.value}
            onChange={field.onChange}
            suggestions={tags ?? []}
            error={err.tags ? t('authoring.tagsRequired') : undefined}
          />
        )}
      />

      <Controller
        control={form.control}
        name="relatedMaterialIds"
        render={({ field }) => (
          <LinkPicker
            label={t('authoring.linkMaterials')}
            hint={t('authoring.linkMaterialsHint')}
            options={(materialsData ?? []).map((m) => ({
              id: m.id,
              label: m.title,
              sublabel: t(`materials.type.${m.type}`),
            }))}
            value={field.value}
            onChange={field.onChange}
            emptyText={t('authoring.noMaterialsYet')}
          />
        )}
      />

      {createQuestion.isError && (
        <div className="alert alert--error" role="alert">
          {t('authoring.saveError')}
        </div>
      )}
      {createQuestion.isSuccess && (
        <div className="alert alert--success" id={successId} role="status">
          {t('authoring.questionCreated')}
        </div>
      )}

      <button
        type="submit"
        className="btn btn--primary"
        disabled={createQuestion.isPending}
        style={{ alignSelf: 'flex-start' }}
      >
        <span className="prompt-char" aria-hidden>
          $
        </span>
        {t('authoring.createQuestion')}
      </button>
    </form>
  );
}
