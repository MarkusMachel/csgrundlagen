import { Check, ChevronDown, Search } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

import { useClickOutside } from '@/shared/hooks/useClickOutside';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  value: T | '';
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  /** id of the visible <label>; the trigger is announced as "<label> <value>". */
  labelledBy?: string;
  /** Used when there's no visible label. */
  'aria-label'?: string;
  /** Shown when no option matches `value`. */
  placeholder?: string;
  /** Adds a filter box at the top of the list, for long lists. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Smaller pill-shaped trigger for inline filter rows. */
  compact?: boolean;
}

const LIST_MAX_HEIGHT = 280;

/**
 * Styled replacement for <select> (the native list can't be themed). Follows
 * the ARIA listbox pattern: the trigger opens a listbox, arrow keys / Home /
 * End move the active option, Enter or Space picks it, Escape closes, and
 * typing a letter jumps to the next option starting with it.
 */
export function Select<T extends string>({
  value,
  options,
  onChange,
  labelledBy,
  'aria-label': ariaLabel,
  placeholder = '',
  searchable = false,
  searchPlaceholder,
  compact = false,
}: SelectProps<T>) {
  const id = useId();
  const valueId = `${id}-value`;
  const listId = `${id}-list`;
  const optionId = (i: number) => `${id}-opt-${i}`;

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);

  const selected = options.find((o) => o.value === value);
  const visible =
    searchable && query
      ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
      : options;

  const close = useCallback((refocus = true) => {
    setOpen(false);
    setQuery('');
    if (refocus) triggerRef.current?.focus();
  }, []);
  useClickOutside(rootRef, () => close(false), open);

  const openList = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect)
      setDropUp(
        window.innerHeight - rect.bottom < LIST_MAX_HEIGHT + 16 && rect.top > LIST_MAX_HEIGHT,
      );
    setActive(
      Math.max(
        0,
        options.findIndex((o) => o.value === value),
      ),
    );
    setOpen(true);
  };

  // Focus moves into the popup on open: the search box, or the listbox itself.
  useEffect(() => {
    if (!open) return;
    (searchable ? searchRef.current : listRef.current)?.focus();
  }, [open, searchable]);

  // Keep the active option scrolled into view (jsdom has no scrollIntoView).
  useEffect(() => {
    if (!open || active < 0) return;
    document.getElementById(`${id}-opt-${active}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [open, active, id]);

  const pick = (option: SelectOption<T> | undefined) => {
    if (!option) return;
    onChange(option.value);
    close();
  };

  const onListKeyDown = (e: KeyboardEvent) => {
    const last = visible.length - 1;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((i) => Math.min(last, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(last);
        break;
      case 'Enter':
        e.preventDefault();
        pick(visible[active]);
        break;
      case ' ':
        if (searchable) break; // a space is part of the search text
        e.preventDefault();
        pick(visible[active]);
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'Tab':
        close(false);
        break;
      default:
        if (!searchable && e.key.length === 1) {
          // type-ahead: next option (after the active one) starting with the letter
          const ch = e.key.toLowerCase();
          const order = [...visible.slice(active + 1), ...visible.slice(0, active + 1)];
          const hit = order.find((o) => o.label.toLowerCase().startsWith(ch));
          if (hit) setActive(visible.indexOf(hit));
        }
    }
  };

  return (
    <div className="dropdown" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={
          compact ? 'select select--compact dropdown__trigger' : 'select dropdown__trigger'
        }
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={labelledBy ? `${labelledBy} ${valueId}` : undefined}
        aria-label={labelledBy ? undefined : ariaLabel}
        onClick={() => (open ? close() : openList())}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            openList();
          }
        }}
      >
        <span
          id={valueId}
          className={selected ? 'dropdown__value' : 'dropdown__value dropdown__value--placeholder'}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={15}
          aria-hidden
          className="dropdown__chevron"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
        />
      </button>

      {open && (
        <div className={dropUp ? 'dropdown__popup dropdown__popup--up' : 'dropdown__popup'}>
          {searchable && (
            <div className="dropdown__search">
              <Search size={14} aria-hidden />
              <input
                ref={searchRef}
                type="text"
                role="combobox"
                aria-expanded
                aria-controls={listId}
                aria-activedescendant={
                  active >= 0 && visible[active] ? optionId(active) : undefined
                }
                aria-autocomplete="list"
                aria-label={searchPlaceholder}
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onListKeyDown}
              />
            </div>
          )}
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={searchable ? undefined : -1}
            aria-labelledby={labelledBy}
            aria-label={labelledBy ? undefined : ariaLabel}
            aria-activedescendant={!searchable && active >= 0 ? optionId(active) : undefined}
            className="dropdown__list scroll-thin"
            style={{ maxHeight: LIST_MAX_HEIGHT }}
            onKeyDown={searchable ? undefined : onListKeyDown}
          >
            {visible.length === 0 && <li className="dropdown__empty">—</li>}
            {visible.map((o, i) => {
              const isSelected = o.value === value;
              return (
                <li
                  key={o.value}
                  id={optionId(i)}
                  role="option"
                  aria-selected={isSelected}
                  className={
                    i === active ? 'dropdown__option dropdown__option--active' : 'dropdown__option'
                  }
                  onMouseMove={() => setActive(i)}
                  // mousedown keeps focus inside, so the click isn't lost to a blur
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(o)}
                >
                  <span>{o.label}</span>
                  {isSelected && <Check size={14} aria-hidden className="dropdown__check" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
