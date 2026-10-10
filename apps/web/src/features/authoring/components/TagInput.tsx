import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  /** Existing tags for autocomplete suggestions. */
  suggestions?: string[];
  error?: string;
}

/** Comma/Enter-separated tag entry with an existing-tag datalist. */
export function TagInput({ value, onChange, suggestions = [], error }: TagInputProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const listId = useId();
  const [draft, setDraft] = useState('');

  const commit = (raw: string) => {
    const tag = raw.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft('');
  };

  return (
    <div className={error ? 'field field--error' : 'field'}>
      <label htmlFor={inputId}>{t('authoring.tags')}</label>
      {value.length > 0 && (
        <div className="chip-row" style={{ margin: '4px 0' }}>
          {value.map((tag) => (
            <button
              key={tag}
              type="button"
              className="chip"
              style={{ cursor: 'pointer', gap: 4 }}
              onClick={() => onChange(value.filter((x) => x !== tag))}
              aria-label={t('authoring.removeTag', { tag })}
            >
              {tag} ✕
            </button>
          ))}
        </div>
      )}
      <input
        id={inputId}
        className="input"
        list={listId}
        value={draft}
        placeholder={t('authoring.tagsPlaceholder')}
        onChange={(e) => {
          const v = e.target.value;
          if (v.endsWith(',')) commit(v.slice(0, -1));
          else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit(draft);
          } else if (e.key === 'Backspace' && !draft && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => draft && commit(draft)}
      />
      <datalist id={listId}>
        {suggestions
          .filter((s) => !value.includes(s))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
      {error && <span className="field-error-text">{error}</span>}
    </div>
  );
}
