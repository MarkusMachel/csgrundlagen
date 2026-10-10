import { Shuffle, X } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { Select } from '@/shared/ui';

import type { Difficulty, QuestionSort, QuestionStatus } from '../hooks/useQuestions';

export interface FilterState {
  search: string;
  tags: string[];
  difficulties: Difficulty[];
  status: QuestionStatus | '';
  sort: QuestionSort;
  seed: string;
}

export const emptyFilters: FilterState = {
  search: '',
  tags: [],
  difficulties: [],
  status: '',
  sort: 'oldest',
  seed: '',
};

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const STATUSES: QuestionStatus[] = ['unanswered', 'answered', 'wrong', 'bookmarked'];
const SORTS: QuestionSort[] = ['oldest', 'newest', 'random'];

const newSeed = () => Math.random().toString(36).slice(2, 10);

/** True when anything narrows the list (sort order alone doesn't count). */
export function hasActiveFilters(f: FilterState) {
  return f.search !== '' || f.tags.length > 0 || f.difficulties.length > 0 || f.status !== '';
}

interface QuestionFiltersProps {
  value: FilterState;
  onChange: (next: FilterState) => void;
  allTags: string[];
  /** Matching question count, once known. */
  total?: number;
}

export function QuestionFilters({ value, onChange, allTags, total }: QuestionFiltersProps) {
  const { t } = useTranslation();
  const ids = { status: useId(), sort: useId(), tag: useId() };
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });

  const toggleDifficulty = (d: Difficulty) =>
    set({
      difficulties: value.difficulties.includes(d)
        ? value.difficulties.filter((x) => x !== d)
        : [...value.difficulties, d],
    });

  return (
    <div className="filters">
      <div className="toolbar">
        <div className="field field--grow">
          <input
            type="search"
            className="input"
            value={value.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder={t('home.searchPlaceholder')}
            aria-label={t('home.searchPlaceholder')}
          />
        </div>
        <div className="field">
          <label id={ids.status}>{t('home.filterStatus')}</label>
          <Select
            labelledBy={ids.status}
            value={value.status}
            onChange={(status) => set({ status })}
            options={[
              { value: '', label: t('home.status.all') },
              ...STATUSES.map((s) => ({ value: s, label: t(`home.status.${s}`) })),
            ]}
          />
        </div>
        <div className="field">
          <label id={ids.sort}>{t('home.sort')}</label>
          <div className="filters__sort">
            <Select
              labelledBy={ids.sort}
              value={value.sort}
              onChange={(sort) => set({ sort, seed: sort === 'random' ? newSeed() : '' })}
              options={SORTS.map((s) => ({ value: s, label: t(`home.sortBy.${s}`) }))}
            />
            {value.sort === 'random' && (
              <button
                type="button"
                className="btn btn--icon"
                aria-label={t('home.reshuffle')}
                title={t('home.reshuffle')}
                onClick={() => set({ seed: newSeed() })}
              >
                <Shuffle size={16} aria-hidden />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="filters__row">
        <div className="filters__group" role="group" aria-label={t('question.difficultyLabel')}>
          <span className="filters__label">{t('question.difficultyLabel')}</span>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              className="toggle-chip"
              aria-pressed={value.difficulties.includes(d)}
              onClick={() => toggleDifficulty(d)}
            >
              {t(`question.difficulty.${d}`)}
            </button>
          ))}
        </div>

        <div className="filters__group">
          <span className="filters__label" id={ids.tag}>
            {t('home.tags')}
          </span>
          {value.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="toggle-chip"
              aria-pressed
              aria-label={t('home.removeTag', { tag })}
              onClick={() => set({ tags: value.tags.filter((x) => x !== tag) })}
            >
              {tag}
              <X size={12} aria-hidden />
            </button>
          ))}
          <Select
            compact
            searchable
            labelledBy={ids.tag}
            value=""
            placeholder={t('home.addTag')}
            searchPlaceholder={t('home.searchTags')}
            onChange={(tag) => set({ tags: [...value.tags, tag] })}
            options={allTags
              .filter((tag) => !value.tags.includes(tag))
              .map((tag) => ({ value: tag, label: tag }))}
          />
        </div>
      </div>

      {(total !== undefined || hasActiveFilters(value)) && (
        <div className="filters__summary">
          {total !== undefined && <span>{t('home.resultCount', { count: total })}</span>}
          {hasActiveFilters(value) && (
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => onChange({ ...emptyFilters, sort: value.sort, seed: value.seed })}
            >
              <X size={14} aria-hidden />
              {t('home.clearFilters')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
