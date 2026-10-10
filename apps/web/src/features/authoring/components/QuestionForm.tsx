import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';
import { useEffect, useId } from 'react';
import { Controller, useFieldArray, useForm, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { useMaterials, type MaterialItem } from '@/features/materials';
import { useQuestionMaterials, useTags, type Question } from '@/features/questions';
import { RichText, Select } from '@/shared/ui';
import { hasCode } from '@/shared/utils/richText';

import { OutputFields } from './OutputFields';
import { useCreateQuestion, useUpdateQuestion } from '../hooks/useAuthoring';
import { useQuestionAuthoring } from '../hooks/useQuestionAdmin';
import type { CreateQuestionInput } from '../types';
import { LinkPicker } from './LinkPicker';
import { TagInput } from './TagInput';

const OPTION_IDS = ['A', 'B', 'C', 'D', 'E'] as const;
const QUESTION_TYPES = [
  'multiple-choice',
  'multi-select',
  'true-false',
  'ordering',
  'output',
] as const;
const hasOptions = (type: string) =>
  type === 'multiple-choice' || type === 'multi-select' || type === 'ordering';

const schema = z
  .object({
    type: z.enum(QUESTION_TYPES),
    prompt: z.string().trim().min(1),
    tags: z.array(z.string()).min(1),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    explanation: z.string().trim().min(1),
    options: z.array(
      z.object({
        label: z.string(),
        // why this option is wrong, and what to read; shown to whoever picks it
        feedback: z.string().max(2000).optional(),
        materialId: z.string().optional(),
      }),
    ),
    correctOptionId: z.string(),
    correctOptionIds: z.array(z.string()),
    correctAnswer: z.boolean(),
    code: z.string(),
    codeLanguage: z.string(),
    expectedOutput: z.string(),
    relatedMaterialIds: z.array(z.string()),
  })
  .superRefine((v, ctx) => {
    const filledAt = (id: string) =>
      !!v.options[OPTION_IDS.indexOf(id as (typeof OPTION_IDS)[number])]?.label.trim();
    if (hasOptions(v.type) && v.options.filter((o) => o.label.trim()).length < 2) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'min2' });
    }
    if (v.type === 'multiple-choice' && !filledAt(v.correctOptionId)) {
      ctx.addIssue({ code: 'custom', path: ['correctOptionId'], message: 'pickCorrect' });
    }
    if (v.type === 'multi-select' && !v.correctOptionIds.some(filledAt)) {
      ctx.addIssue({ code: 'custom', path: ['correctOptionIds'], message: 'pickCorrect' });
    }
    if (v.type === 'output' && !v.code.trim()) {
      ctx.addIssue({ code: 'custom', path: ['code'], message: 'required' });
    }
  });

export type QuestionFormValues = z.infer<typeof schema>;
type FormValues = QuestionFormValues;

interface QuestionFormProps {
  /** Edit this question instead of creating a new one. */
  question?: Question;
  onSaved?: (id: string) => void;
  /** Shows a Cancel button (edit mode). */
  onCancel?: () => void;
}

const EMPTY: FormValues = {
  type: 'multiple-choice',
  prompt: '',
  tags: [],
  difficulty: 'medium',
  explanation: '',
  options: [{ label: '' }, { label: '' }, { label: '' }, { label: '' }],
  correctOptionId: 'A',
  correctOptionIds: [],
  correctAnswer: true,
  code: '',
  codeLanguage: 'js',
  expectedOutput: '',
  relatedMaterialIds: [],
};

function valuesFrom(q: Question): FormValues {
  return {
    ...EMPTY,
    type: q.type,
    prompt: q.prompt,
    tags: q.tags,
    difficulty: q.difficulty ?? 'medium',
    explanation: q.explanation,
    ...answerValuesFrom(q),
  };
}

function answerValuesFrom(q: Question): Partial<FormValues> {
  const labels = (ids: string[], options: { id: string; label: string }[]) =>
    ids.map((id) => ({ label: options.find((o) => o.id === id)?.label ?? '' }));
  switch (q.type) {
    case 'multiple-choice':
      return {
        options: q.options.map((o) => ({ label: o.label })),
        correctOptionId: q.correctOptionId,
      };
    case 'multi-select':
      return {
        options: q.options.map((o) => ({ label: o.label })),
        correctOptionIds: q.correctOptionIds,
      };
    case 'ordering': // the form lists items in the correct order
      return { options: labels(q.correctOrder, q.options) };
    case 'output':
      return { code: q.code, codeLanguage: q.codeLanguage, expectedOutput: q.expectedOutput };
    case 'true-false':
      return { correctAnswer: q.correctAnswer };
  }
}

export function QuestionForm({ question, onSaved, onCancel }: QuestionFormProps) {
  const { t } = useTranslation();
  const successId = useId();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const save = question ? updateQuestion : createQuestion;
  const { data: tags } = useTags();
  const { data: materialsData } = useMaterials();
  // In edit mode the current material links come from their own endpoint.
  const { data: linkedMaterials } = useQuestionMaterials(question?.id ?? '', !!question);
  // ...and so does the wrong-option feedback, which public questions leave out.
  const { data: authoring } = useQuestionAuthoring(question?.id ?? '', !!question);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: question ? valuesFrom(question) : EMPTY,
  });

  useEffect(() => {
    if (linkedMaterials && !form.formState.dirtyFields.relatedMaterialIds) {
      form.setValue(
        'relatedMaterialIds',
        linkedMaterials.map((m) => m.id),
      );
    }
  }, [linkedMaterials, form]);
  useEffect(() => {
    if (!authoring?.options || form.formState.dirtyFields.options) return;
    authoring.options.forEach((o) => {
      const i = OPTION_IDS.indexOf(o.id as (typeof OPTION_IDS)[number]);
      if (i < 0) return;
      if (o.feedback) form.setValue(`options.${i}.feedback`, o.feedback);
      if (o.materialId) form.setValue(`options.${i}.materialId`, o.materialId);
    });
  }, [authoring, form]);
  const type = form.watch('type');
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'options' });
  const correctIds =
    type === 'multi-select' ? form.watch('correctOptionIds') : [form.watch('correctOptionId')];

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
    if (hasOptions(values.type)) {
      const opts = values.options
        .map((o, i) => ({
          id: OPTION_IDS[i],
          label: o.label.trim(),
          feedback: o.feedback?.trim() || undefined,
          materialId: o.materialId || undefined,
        }))
        .filter((o) => o.label.length > 0);
      input.options = opts;
      if (values.type === 'multiple-choice') input.correctOptionId = values.correctOptionId;
      if (values.type === 'multi-select') {
        input.correctOptionIds = values.correctOptionIds.filter((id) =>
          opts.some((o) => o.id === id),
        );
      }
    } else if (values.type === 'output') {
      input.code = values.code;
      input.codeLanguage = values.codeLanguage;
      input.expectedOutput = values.expectedOutput;
    } else {
      input.correctAnswer = values.correctAnswer;
    }
    try {
      if (question) {
        const updated = await updateQuestion.mutateAsync({ id: question.id, input });
        onSaved?.(updated.id);
      } else {
        const created = await createQuestion.mutateAsync(input);
        form.reset();
        onSaved?.(created.id);
      }
    } catch {
      // rendered from save.isError
    }
  });

  const err = form.formState.errors;

  return (
    <form onSubmit={onSubmit} className="authoring-form">
      {/* two columns on wide screens: content left, metadata right */}
      <div className="authoring-form__main">
        <div className="field">
          <label>{t('authoring.questionType')}</label>
          <div className="hstack" style={{ gap: 16, flexWrap: 'wrap' }}>
            {QUESTION_TYPES.map((v) => (
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
          <CodeFormatHint />
          <RichPreview text={form.watch('prompt')} />
          {err.prompt && <span className="field-error-text">{t('authoring.required')}</span>}
        </div>

        {hasOptions(type) ? (
          <div
            className={
              err.options || err.correctOptionId || err.correctOptionIds
                ? 'field field--error'
                : 'field'
            }
          >
            <label>{type === 'ordering' ? t('authoring.items') : t('authoring.options')}</label>
            <span className="tok-com" style={{ fontSize: 12 }}>
              {'// '}
              {type === 'ordering'
                ? t('authoring.orderingHint')
                : type === 'multi-select'
                  ? t('authoring.multiSelectHint')
                  : t('authoring.optionsHint')}
            </span>
            {fields.map((f, i) => (
              <div key={f.id} className="hstack" style={{ gap: 8 }}>
                {type === 'ordering' ? (
                  <span className="tok-idx" style={{ minWidth: 64 }}>
                    steps[{i}]
                  </span>
                ) : (
                  <label className="checkbox-row" aria-label={t('authoring.markCorrect')}>
                    {type === 'multi-select' ? (
                      <input
                        type="checkbox"
                        checked={form.watch('correctOptionIds').includes(OPTION_IDS[i])}
                        onChange={(e) => {
                          const current = form.getValues('correctOptionIds');
                          form.setValue(
                            'correctOptionIds',
                            e.target.checked
                              ? [...current, OPTION_IDS[i]]
                              : current.filter((id) => id !== OPTION_IDS[i]),
                          );
                        }}
                      />
                    ) : (
                      <input
                        type="radio"
                        value={OPTION_IDS[i]}
                        checked={form.watch('correctOptionId') === OPTION_IDS[i]}
                        {...form.register('correctOptionId')}
                      />
                    )}
                    <span>
                      <span className="tok-kw">var</span>{' '}
                      <span className="tok-idx">{OPTION_IDS[i]}</span>
                    </span>
                  </label>
                )}
                <div
                  style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  {/* a textarea, so an answer can itself be a multi-line ``` code block */}
                  <textarea
                    className="textarea textarea--autogrow"
                    rows={1}
                    placeholder={`"${t('authoring.optionPlaceholder')}"`}
                    {...form.register(`options.${i}.label` as const)}
                  />
                  <RichPreview text={form.watch(`options.${i}.label`)} />
                  {type !== 'ordering' && !correctIds.includes(OPTION_IDS[i]) && (
                    <OptionFeedbackFields index={i} form={form} materials={materialsData ?? []} />
                  )}
                </div>
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
            {(err.correctOptionId || err.correctOptionIds) && (
              <span className="field-error-text">{t('authoring.pickCorrect')}</span>
            )}
          </div>
        ) : type === 'output' ? (
          <OutputFields form={form} />
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
          <CodeFormatHint />
          <RichPreview text={form.watch('explanation')} />
          {err.explanation && <span className="field-error-text">{t('authoring.required')}</span>}
        </div>
      </div>
      <div className="authoring-form__side">
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
      </div>
      <div className="authoring-form__footer">
        {save.isError && (
          <div className="alert alert--error" role="alert">
            {t('authoring.saveError')}
          </div>
        )}
        {save.isSuccess && (
          <div className="alert alert--success" id={successId} role="status">
            {question ? t('authoring.questionUpdated') : t('authoring.questionCreated')}
          </div>
        )}

        <div className="hstack" style={{ gap: 10 }}>
          <button type="submit" className="btn btn--primary" disabled={save.isPending}>
            <span className="prompt-char" aria-hidden>
              $
            </span>
            {question ? t('authoring.saveChanges') : t('authoring.createQuestion')}
          </button>
          {onCancel && (
            <button type="button" className="btn btn--ghost" onClick={onCancel}>
              {t('common.cancel')}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

/** Reminds authors how to write code: ```lang fences and `inline` spans. */
function CodeFormatHint() {
  const { t } = useTranslation();
  return (
    <span className="tok-com" style={{ fontSize: 12 }}>
      {'// '}
      {t('authoring.codeHint')}
    </span>
  );
}

/** Live preview, shown only once the text contains code, since plain text looks the same. */
function RichPreview({ text }: { text: string | undefined }) {
  const { t } = useTranslation();
  if (!text || !hasCode(text)) return null;
  return (
    <div className="rich-preview" aria-label={t('authoring.preview')}>
      <span className="rich-preview__label">{t('authoring.preview')}</span>
      <RichText text={text} />
    </div>
  );
}

/** "If someone picks this…": a short explanation and a reading, for wrong options. */
function OptionFeedbackFields({
  index,
  form,
  materials,
}: {
  index: number;
  form: UseFormReturn<FormValues>;
  materials: MaterialItem[];
}) {
  const { t } = useTranslation();
  const labelId = useId();
  const feedback = form.watch(`options.${index}.feedback`) ?? '';
  const materialId = form.watch(`options.${index}.materialId`) ?? '';
  const filled = feedback.trim().length > 0 || materialId !== '';
  return (
    <details className="option-feedback" open={filled || undefined}>
      <summary>
        {t('authoring.feedback.summary')}
        {filled && <span className="chip chip--accent">{t('authoring.feedback.added')}</span>}
      </summary>
      <textarea
        className="textarea textarea--autogrow"
        rows={2}
        maxLength={2000}
        aria-label={t('authoring.feedback.label', { option: OPTION_IDS[index] })}
        placeholder={t('authoring.feedback.placeholder')}
        {...form.register(`options.${index}.feedback` as const)}
      />
      <span id={labelId} className="sr-only">
        {t('authoring.feedback.materialLabel', { option: OPTION_IDS[index] })}
      </span>
      <Select
        searchable
        labelledBy={labelId}
        value={materialId}
        onChange={(v) => form.setValue(`options.${index}.materialId`, v, { shouldDirty: true })}
        searchPlaceholder={t('authoring.feedback.searchMaterials')}
        options={[
          { value: '', label: t('authoring.feedback.noMaterial') },
          ...materials.map((m) => ({ value: m.id, label: m.title })),
        ]}
      />
    </details>
  );
}
