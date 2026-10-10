import { Check, ChevronDown, Search, Shuffle } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import {
  DIFFICULTIES,
  hasActiveFilters,
  newSeed,
  SORTS,
  STATUSES,
  emptyFilters,
  withStatus,
  type FilterState,
} from './QuestionFilters';
import type { Difficulty } from '../hooks/useQuestions';

interface QuestionFilterSidebarProps {
  value: FilterState;
  onChange: (next: FilterState) => void;
  allTags: string[];
  /** Matching question count, once known. */
  total?: number;
  /** Shown above the filters, e.g. the saved filters. */
  extra?: ReactNode;
}

/** True on the layout where the panel is a sticky sidebar (matches the CSS breakpoint). */
const isWideScreen = () => window.matchMedia?.('(min-width: 860px)').matches ?? true;

/**
 * The feed filters as a vertical panel for the left sidebar on Home: the
 * same FilterState as the inline bar, but status and sort are single-choice
 * lists and tags are a searchable list you can tick several of.
 */
export function QuestionFilterSidebar({
  value,
  onChange,
  allTags,
  total,
  extra,
}: QuestionFilterSidebarProps) {
  const { t } = useTranslation();
  const ids = { status: useId(), sort: useId(), difficulty: useId(), tags: useId() };
  const [tagQuery, setTagQuery] = useState('');
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });

  const toggle = <T,>(list: T[], item: T) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  // Ticked tags first, then the rest, both narrowed by the tag search.
  const q = tagQuery.trim().toLowerCase();
  const matching = (tag: string) => !q || tag.toLowerCase().includes(q);
  const tagRows = [
    ...value.tags.filter(matching),
    ...allTags.filter((tag) => !value.tags.includes(tag) && matching(tag)),
  ];

  const activeCount =
    (value.search ? 1 : 0) + (value.status ? 1 : 0) + value.difficulties.length + value.tags.length;

  return (
    <details className="filter-panel scroll-thin" open={isWideScreen()}>
      <summary className="filter-panel__title">
        {t('home.filters')}
        {activeCount > 0 && <span className="filter-panel__badge">{activeCount}</span>}
        <ChevronDown size={15} aria-hidden className="filter-panel__chevron" />
      </summary>

      <div className="filter-panel__body">
        <input
          type="search"
          className="input"
          value={value.search}
          onChange={(e) => set({ search: e.target.value })}
          placeholder={t('home.searchPlaceholder')}
          aria-label={t('home.searchPlaceholder')}
        />

        <div className="filter-panel__summary">
          {total !== undefined && <span>{t('home.resultCount', { count: total })}</span>}
          {hasActiveFilters(value) && (
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => onChange({ ...emptyFilters, sort: value.sort, seed: value.seed })}
            >
              {t('home.clearFilters')}
            </button>
          )}
        </div>

        {extra}

        <section className="filter-panel__section" aria-labelledby={ids.status}>
          <h3 id={ids.status} className="filter-panel__heading">
            {t('home.filterStatus')}
          </h3>
          <div role="radiogroup" aria-labelledby={ids.status} className="filter-panel__list">
            {(['', ...STATUSES] as const).map((s) => (
              <button
                key={s || 'all'}
                type="button"
                role="radio"
                aria-checked={value.status === s}
                className="filter-panel__item"
                onClick={() => withStatus(s, set)}
              >
                {t(`home.status.${s || 'all'}`)}
              </button>
            ))}
          </div>
        </section>

        <section className="filter-panel__section" aria-labelledby={ids.sort}>
          <h3 id={ids.sort} className="filter-panel__heading">
            {t('home.sort')}
            {value.sort === 'random' && (
              <button
                type="button"
                className="btn btn--icon filter-panel__heading-action"
                aria-label={t('home.reshuffle')}
                title={t('home.reshuffle')}
                onClick={() => set({ seed: newSeed() })}
              >
                <Shuffle size={14} aria-hidden />
              </button>
            )}
          </h3>
          <div role="radiogroup" aria-labelledby={ids.sort} className="filter-panel__list">
            {SORTS.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={value.sort === s}
                className="filter-panel__item"
                onClick={() => set({ sort: s, seed: s === 'random' ? newSeed() : '' })}
              >
                {t(`home.sortBy.${s}`)}
              </button>
            ))}
          </div>
        </section>

        <section className="filter-panel__section" aria-labelledby={ids.difficulty}>
          <h3 id={ids.difficulty} className="filter-panel__heading">
            {t('question.difficultyLabel')}
          </h3>
          <div className="filters__group" role="group" aria-labelledby={ids.difficulty}>
            {DIFFICULTIES.map((d: Difficulty) => (
              <button
                key={d}
                type="button"
                className="toggle-chip"
                aria-pressed={value.difficulties.includes(d)}
                onClick={() => set({ difficulties: toggle(value.difficulties, d) })}
              >
                {t(`question.difficulty.${d}`)}
              </button>
            ))}
          </div>
        </section>

        <section className="filter-panel__section" aria-labelledby={ids.tags}>
          <h3 id={ids.tags} className="filter-panel__heading">
            {t('home.tags')}
            {value.tags.length > 0 && (
              <span className="filter-panel__badge">{value.tags.length}</span>
            )}
          </h3>
          <label className="filter-panel__tag-search">
            <Search size={13} aria-hidden />
            <input
              type="text"
              value={tagQuery}
              onChange={(e) => setTagQuery(e.target.value)}
              placeholder={t('home.searchTags')}
              aria-label={t('home.searchTags')}
            />
          </label>
          <div role="group" aria-labelledby={ids.tags} className="filter-panel__list">
            {tagRows.map((tag) => {
              const on = value.tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={on}
                  className="filter-panel__item filter-panel__item--check"
                  onClick={() => set({ tags: toggle(value.tags, tag) })}
                >
                  <span className="filter-panel__box" aria-hidden>
                    {on && <Check size={11} strokeWidth={3} />}
                  </span>
                  {tag}
                </button>
              );
            })}
            {tagRows.length === 0 && <p className="filter-panel__empty">—</p>}
          </div>
        </section>
      </div>
    </details>
  );
}
