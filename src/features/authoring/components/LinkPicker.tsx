import { Check, Search } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useDebounce } from '@/shared/hooks/useDebounce';

export interface LinkOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface LinkPickerProps {
  label: string;
  hint?: string;
  options: LinkOption[];
  /** Currently linked ids. */
  value: string[];
  onChange: (ids: string[]) => void;
  emptyText: string;
}

/**
 * A searchable multi-select for cross-linking content (questions ⇄ materials).
 * Linking is optional — an empty selection just means "not linked to anything".
 */
export function LinkPicker({ label, hint, options, value, onChange, emptyText }: LinkPickerProps) {
  const { t } = useTranslation();
  const searchId = useId();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 200).trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!debounced) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(debounced) ||
        o.sublabel?.toLowerCase().includes(debounced),
    );
  }, [options, debounced]);

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  const selectedLabels = options.filter((o) => value.includes(o.id));

  return (
    <div className="field">
      <label htmlFor={searchId}>{label}</label>
      {hint && (
        <span className="tok-com" style={{ fontSize: 12 }}>
          {'// '}
          {hint}
        </span>
      )}

      {selectedLabels.length > 0 && (
        <div className="chip-row" style={{ margin: '4px 0' }}>
          {selectedLabels.map((o) => (
            <button
              key={o.id}
              type="button"
              className="chip"
              style={{ cursor: 'pointer', gap: 4 }}
              onClick={() => toggle(o.id)}
              aria-label={t('authoring.unlink', { name: o.label })}
            >
              {o.label} ✕
            </button>
          ))}
        </div>
      )}

      <div className="search-wrap" style={{ maxWidth: 'none', margin: 0 }}>
        <span className="search-glyph" aria-hidden>
          <Search size={15} />
        </span>
        <input
          id={searchId}
          type="search"
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('authoring.linkSearchPlaceholder')}
        />
      </div>

      <div
        className="card"
        style={{ padding: 4, maxHeight: 200, overflowY: 'auto', marginTop: 6 }}
        role="listbox"
        aria-multiselectable
        aria-label={label}
      >
        {options.length === 0 ? (
          <p className="tok-com" style={{ margin: 0, padding: '8px 12px' }}>
            {'// '}
            {emptyText}
          </p>
        ) : filtered.length === 0 ? (
          <p className="tok-com" style={{ margin: 0, padding: '8px 12px' }}>
            {'// '}
            {t('authoring.noMatches')}
          </p>
        ) : (
          filtered.map((o) => {
            const checked = value.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                role="option"
                aria-selected={checked}
                className="search-result hstack"
                style={{ gap: 8 }}
                onClick={() => toggle(o.id)}
              >
                <span
                  aria-hidden
                  style={{
                    width: 16,
                    height: 16,
                    flexShrink: 0,
                    border: '1px solid var(--border-strong)',
                    borderRadius: 4,
                    background: checked ? 'var(--accent)' : 'transparent',
                    color: 'var(--accent-contrast)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {checked && <Check size={12} />}
                </span>
                <span style={{ minWidth: 0 }}>
                  {o.label}
                  {o.sublabel && <span className="search-result__sub">{o.sublabel}</span>}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
