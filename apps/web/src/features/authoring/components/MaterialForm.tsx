import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { MaterialItem, MaterialType } from '@/features/materials';
import { useQuestions, useTags } from '@/features/questions';

import { LinkPicker } from './LinkPicker';
import { TagInput } from './TagInput';
import { useCreateMaterial, useUpdateMaterial } from '../hooks/useAuthoring';

const MATERIAL_TYPES: MaterialType[] = ['book', 'video', 'article', 'link'];

const schema = z.object({
  type: z.enum(['book', 'video', 'article', 'link']),
  title: z.string().trim().min(1),
  url: z.string().trim().url(),
  author: z.string().trim().optional(),
  description: z.string().trim().optional(),
  tags: z.array(z.string()).min(1),
  relatedQuestionIds: z.array(z.string()),
});

type FormValues = z.infer<typeof schema>;

interface MaterialFormProps {
  /** Edit this material instead of creating a new one. */
  material?: MaterialItem;
  onSaved?: (id: string) => void;
  /** Shows a Cancel button (edit mode). */
  onCancel?: () => void;
}

export function MaterialForm({ material, onSaved, onCancel }: MaterialFormProps) {
  const { t } = useTranslation();
  const successId = useId();
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const save = material ? updateMaterial : createMaterial;
  const { data: tags } = useTags();
  const { data: questionsData } = useQuestions({ page: 1, pageSize: 50 });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: material?.type ?? 'article',
      title: material?.title ?? '',
      url: material?.url ?? '',
      author: material?.author ?? '',
      description: material?.description ?? '',
      tags: material?.tags ?? [],
      relatedQuestionIds: material?.relatedQuestionIds ?? [],
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const input = {
      type: values.type,
      title: values.title,
      url: values.url,
      author: values.author || undefined,
      description: values.description || undefined,
      tags: values.tags,
      relatedQuestionIds: values.relatedQuestionIds,
    };
    try {
      if (material) {
        const updated = await updateMaterial.mutateAsync({ id: material.id, input });
        onSaved?.(updated.id);
      } else {
        const created = await createMaterial.mutateAsync(input);
        form.reset();
        onSaved?.(created.id);
      }
    } catch {
      // rendered from save.isError
    }
  });

  const err = form.formState.errors;

  return (
    <form onSubmit={onSubmit} className="stack" style={{ gap: 14 }}>
      <div className="field">
        <label htmlFor="m-type">{t('materials.filterType')}</label>
        <select id="m-type" className="select" {...form.register('type')}>
          {MATERIAL_TYPES.map((mt) => (
            <option key={mt} value={mt}>
              {t(`materials.type.${mt}`)}
            </option>
          ))}
        </select>
      </div>

      <div className={err.title ? 'field field--error' : 'field'}>
        <label htmlFor="m-title">{t('authoring.materialTitle')}</label>
        <input id="m-title" className="input" {...form.register('title')} />
        {err.title && <span className="field-error-text">{t('authoring.required')}</span>}
      </div>

      <div className={err.url ? 'field field--error' : 'field'}>
        <label htmlFor="m-url">{t('authoring.url')}</label>
        <input id="m-url" className="input" placeholder="https://…" {...form.register('url')} />
        {err.url && <span className="field-error-text">{t('authoring.urlInvalid')}</span>}
      </div>

      <div className="field">
        <label htmlFor="m-author">{t('authoring.authorOptional')}</label>
        <input id="m-author" className="input" {...form.register('author')} />
      </div>

      <div className="field">
        <label htmlFor="m-desc">{t('authoring.descriptionOptional')}</label>
        <textarea id="m-desc" className="textarea" rows={2} {...form.register('description')} />
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
        name="relatedQuestionIds"
        render={({ field }) => (
          <LinkPicker
            label={t('authoring.linkQuestions')}
            hint={t('authoring.linkQuestionsHint')}
            options={(questionsData?.items ?? []).map((q) => ({
              id: q.id,
              label: q.prompt,
              sublabel: q.tags.join(', '),
            }))}
            value={field.value}
            onChange={field.onChange}
            emptyText={t('authoring.noQuestionsYet')}
          />
        )}
      />

      {save.isError && (
        <div className="alert alert--error" role="alert">
          {t('authoring.saveError')}
        </div>
      )}
      {save.isSuccess && (
        <div className="alert alert--success" id={successId} role="status">
          {material ? t('authoring.materialUpdated') : t('authoring.materialCreated')}
        </div>
      )}

      <div className="hstack" style={{ gap: 10 }}>
        <button type="submit" className="btn btn--primary" disabled={save.isPending}>
          <span className="prompt-char" aria-hidden>
            $
          </span>
          {material ? t('authoring.saveChanges') : t('authoring.createMaterial')}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            {t('common.cancel')}
          </button>
        )}
      </div>
    </form>
  );
}
