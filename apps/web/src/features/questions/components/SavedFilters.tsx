import { Bookmark, ListChecks, Plus, X } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { ApiError } from '@/shared/api/client';
import { isSignInCancelled } from '@/stores/useAuthPrompt';
import { useSignedIn } from '@/stores/useAuthStore';

import { emptyFilters, hasActiveFilters, type FilterState } from './QuestionFilters';
import { filtersQuery, sameFilters } from '../filterUrl';
import { useDeleteFilter, useSaveFilter, useSavedFilters } from '../hooks/useSavedFilters';

/**
 * The user's named filters: click one to apply it, save the current filters
 * under a name, delete one, or (on Home) start a test from one. Saving while
 * signed out asks to log in first.
 */
export function SavedFilters({
  value,
  onApply,
  showBuildLinks,
}: {
  value: FilterState;
  onApply: (f: FilterState) => void;
  /** Offer "build a test from this filter" links (not on the builder itself). */
  showBuildLinks?: boolean;
}) {
  const { t } = useTranslation();
  const nameId = useId();
  const signedIn = useSignedIn();
  const { data: saved = [] } = useSavedFilters();
  const save = useSaveFilter();
  const remove = useDeleteFilter();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');

  const canSave = hasActiveFilters(value) && !saved.some((s) => sameFilters(s.filters, value));
  const saveError =
    save.isError && !isSignInCancelled(save.error)
      ? save.error instanceof ApiError && save.error.status < 500
        ? save.error.message
        : t('filters.saveFailed')
      : null;

  if (!signedIn && !hasActiveFilters(value)) return null;

  return (
    <section className="saved-filters" aria-labelledby={`${nameId}-title`}>
      <h3 id={`${nameId}-title`} className="filter-panel__heading">
        {t('filters.saved')}
      </h3>
      {saved.length > 0 && (
        <ul className="saved-filters__list">
          {saved.map((s) => {
            const active = sameFilters(s.filters, value);
            return (
              <li key={s.id} className="saved-filters__item">
                <button
                  type="button"
                  className="saved-filters__apply"
                  aria-pressed={active}
                  onClick={() =>
                    onApply(active ? { ...emptyFilters } : { ...emptyFilters, ...s.filters })
                  }
                >
                  <Bookmark size={13} aria-hidden />
                  <span>{s.name}</span>
                </button>
                {showBuildLinks && (
                  <Link
                    to={`/build?${filtersQuery({ ...emptyFilters, ...s.filters })}`}
                    className="btn btn--icon btn--small"
                    aria-label={t('filters.buildTest', { name: s.name })}
                    title={t('filters.buildTest', { name: s.name })}
                  >
                    <ListChecks size={14} aria-hidden />
                  </Link>
                )}
                <button
                  type="button"
                  className="btn btn--icon btn--small"
                  aria-label={t('filters.delete', { name: s.name })}
                  title={t('filters.delete', { name: s.name })}
                  onClick={() => remove.mutate(s.id)}
                >
                  <X size={14} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {naming ? (
        <form
          className="saved-filters__form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            save.mutate(
              { name: name.trim(), filters: value },
              {
                onSuccess: () => {
                  setNaming(false);
                  setName('');
                },
              },
            );
          }}
        >
          <label htmlFor={nameId} className="sr-only">
            {t('filters.nameLabel')}
          </label>
          <input
            id={nameId}
            className="input"
            value={name}
            maxLength={60}
            autoFocus
            placeholder={t('filters.namePlaceholder')}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="hstack" style={{ gap: 6 }}>
            <button
              type="submit"
              className="btn btn--primary btn--small"
              disabled={!name.trim() || save.isPending}
            >
              {t('filters.saveButton')}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => {
                setNaming(false);
                save.reset();
              }}
            >
              {t('common.cancel')}
            </button>
          </div>
          {saveError && (
            <span className="field-error-text" role="alert">
              {saveError}
            </span>
          )}
        </form>
      ) : (
        canSave && (
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() => setNaming(true)}
          >
            <Plus size={14} aria-hidden /> {t('filters.save')}
          </button>
        )
      )}
      {saved.length === 0 && !canSave && !naming && (
        <p className="muted saved-filters__empty">{t('filters.none')}</p>
      )}
    </section>
  );
}
