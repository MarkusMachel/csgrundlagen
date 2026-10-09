import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useClickOutside } from '@/shared/hooks/useClickOutside';
import { useDebounce } from '@/shared/hooks/useDebounce';

import { useSearch } from '../hooks/useSearch';
import type { SearchResultItem } from '../types';

type GroupKey = 'questions' | 'materials' | 'tests';

/**
 * Command-palette-style search: an icon in the title bar opens a dropdown
 * panel with the input and grouped results. Ctrl/Cmd+K opens it too.
 */
export function GlobalSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useClickOutside(wrapRef, () => setOpen(false), open);

  const debounced = useDebounce(query, 250);
  const { data: results } = useSearch(debounced);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const goTo = (group: GroupKey, item: SearchResultItem) => {
    setOpen(false);
    setQuery('');
    if (group === 'questions') navigate(`/questions/${item.id}`);
    else if (group === 'materials') navigate('/materials');
    else navigate('/my-tests');
  };

  const groups: GroupKey[] = ['questions', 'materials', 'tests'];
  const hasResults = results && groups.some((g) => results[g].length > 0);
  const showPanel = open;
  const showResults = debounced.trim().length >= 2;

  return (
    <div className="menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="btn btn--icon"
        aria-label={t('search.open')}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Search size={17} aria-hidden />
      </button>
      {showPanel && (
        <div
          className="menu"
          style={{ width: 'min(480px, calc(100vw - 24px))', padding: 8 }}
        >
          <div className="search-wrap" style={{ maxWidth: 'none' }}>
            <span className="search-glyph" aria-hidden>
              <Search size={15} />
            </span>
            <input
              ref={inputRef}
              type="search"
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              aria-label={t('search.placeholder')}
            />
          </div>
          {showResults && (
            <div style={{ maxHeight: 380, overflowY: 'auto', marginTop: 6 }}>
              {hasResults ? (
                <div data-testid="search-results">
                  {groups.map((group) =>
                    results[group].length === 0 ? null : (
                      <div key={group}>
                        <div className="search-group-label">{t(`search.groups.${group}`)}</div>
                        {results[group].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="search-result"
                            onClick={() => goTo(group, item)}
                          >
                            {item.title}
                            {item.subtitle && (
                              <span className="search-result__sub">{item.subtitle}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="muted" style={{ padding: '10px 12px', margin: 0 }}>
                  {t('search.noResults', { query: debounced })}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
