import {
  Book,
  BookOpen,
  ExternalLink,
  FileText,
  Link2,
  Video,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  categorize,
  slugify,
  useMaterials,
  type MaterialItem,
  type MaterialType,
} from '@/features/materials';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui';

const typeIcons: Record<MaterialType, LucideIcon> = {
  book: Book,
  video: Video,
  article: FileText,
  link: Link2,
};

const materialTypes: MaterialType[] = ['book', 'video', 'article', 'link'];

/** Matches the CSS breakpoint where the contents become a sticky sidebar. */
const isWideScreen = () => window.matchMedia?.('(min-width: 860px)').matches ?? true;

/** Below the sticky title bar: a section counts as "being read" once its heading passes this. */
const READING_LINE = 90;

/**
 * The slug of the section currently being read, for highlighting it in the
 * contents (like a wiki's table of contents). `slugs` is space-separated so
 * the effect only re-subscribes when the set of sections changes.
 */
function useActiveSection(slugs: string) {
  const [active, setActive] = useState('');
  useEffect(() => {
    const ids = slugs.split(' ').filter(Boolean);
    const update = () => {
      let current = ids[0] ?? '';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= READING_LINE) current = id;
      }
      setActive(current);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [slugs]);
  return active;
}

/**
 * Wiki-style index of every curated resource: a contents sidebar on the left
 * edge (the page opts out of the centred column, see `.app-main:has(.wiki)`),
 * then one section per category with plain links. Everything is fetched once and
 * filtered client-side, so categories stay stable while you search.
 */
export function CuratedMaterialPage() {
  const { t } = useTranslation();
  const [types, setTypes] = useState<MaterialType[]>([]);
  const [search, setSearch] = useState('');
  const query = useDebounce(search, 150).trim().toLowerCase();

  const { data: materials, isPending, isError, refetch } = useMaterials();

  // Categories come from the full list, so filtering never moves an entry.
  const categories = useMemo(() => categorize(materials ?? []), [materials]);
  const categoryNames = useMemo(
    () => new Set(categories.map((c) => c.name).filter(Boolean)),
    [categories],
  );

  const visible = useMemo(() => {
    const matches = (m: MaterialItem) =>
      (types.length === 0 || types.includes(m.type)) &&
      (!query ||
        [m.title, m.author, m.description, ...m.tags].some((s) =>
          s?.toLowerCase().includes(query),
        ));
    return categories
      .map((c) => ({ ...c, items: c.items.filter(matches) }))
      .filter((c) => c.items.length > 0);
  }, [categories, types, query]);

  const activeSlug = useActiveSection(visible.map((c) => c.slug).join(' '));
  const tocRef = useRef<HTMLDetailsElement>(null);

  const shown = visible.reduce((n, c) => n + c.items.length, 0);
  const filtering = types.length > 0 || query !== '';
  const label = (name: string) => name || t('materials.other');

  const toggleType = (type: MaterialType) =>
    setTypes((ts) => (ts.includes(type) ? ts.filter((x) => x !== type) : [...ts, type]));

  if (isPending) return <Spinner center />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  const contents = (
    <ol className="wiki-toc__list">
      {visible.map((c) => (
        <li key={c.slug}>
          <a
            href={`#${c.slug}`}
            aria-current={c.slug === activeSlug ? 'location' : undefined}
            onClick={() => {
              // on mobile the contents sit above the sections; fold them away after a jump
              if (!isWideScreen() && tocRef.current) tocRef.current.open = false;
            }}
          >
            {label(c.name)}
          </a>
          <span className="wiki-toc__count">{c.items.length}</span>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="wiki">
      <header className="wiki__header">
        <h1>
          <span className="tok-com">{'// '}</span>
          {t('materials.title')}
        </h1>
        <p className="muted wiki__summary">
          {filtering
            ? t('materials.summaryFiltered', { count: shown, total: materials.length })
            : t('materials.summary', { count: materials.length, categories: categories.length })}
        </p>
        <div className="wiki__filters">
          <input
            type="search"
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('materials.searchPlaceholder')}
            aria-label={t('materials.searchPlaceholder')}
          />
          <div className="filters__group" role="group" aria-label={t('materials.filterType')}>
            {materialTypes.map((type) => {
              const Icon = typeIcons[type];
              return (
                <button
                  key={type}
                  type="button"
                  className="toggle-chip"
                  aria-pressed={types.includes(type)}
                  onClick={() => toggleType(type)}
                >
                  <Icon size={13} aria-hidden />
                  {t(`materials.type.${type}`)}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {visible.length === 0 ? (
        <div className="wiki__content">
          <EmptyState title={t('materials.empty')} glyph={<BookOpen size={28} />} />
        </div>
      ) : (
        <>
          <nav className="wiki-toc" aria-label={t('materials.contents')}>
            {/* Starts open in the desktop sidebar, collapsed above the sections on mobile. */}
            <details ref={tocRef} className="wiki-toc__details scroll-thin" open={isWideScreen()}>
              <summary className="wiki-toc__title">{t('materials.contents')}</summary>
              {contents}
            </details>
          </nav>

          <div className="wiki__content">
            {visible.map((c) => (
              <section
                key={c.slug}
                id={c.slug}
                className="wiki-section"
                aria-labelledby={`${c.slug}-h`}
              >
                <h2 id={`${c.slug}-h`} className="wiki-section__title">
                  {label(c.name)}
                  <a
                    className="wiki-section__anchor"
                    href={`#${c.slug}`}
                    aria-label={t('materials.linkToSection', { name: label(c.name) })}
                  >
                    #
                  </a>
                </h2>
                <ul className="wiki-list">
                  {c.items.map((m) => {
                    const Icon = typeIcons[m.type];
                    const seeAlso = m.tags.filter(
                      (tag) => tag !== c.name && categoryNames.has(tag),
                    );
                    return (
                      <li key={m.id} className="wiki-entry">
                        <span className="wiki-entry__icon" title={t(`materials.type.${m.type}`)}>
                          <Icon size={14} aria-label={t(`materials.type.${m.type}`)} />
                        </span>
                        <div className="wiki-entry__body">
                          <a
                            className="wiki-entry__link"
                            href={m.url}
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            {m.title}
                            <ExternalLink size={12} aria-hidden />
                          </a>
                          {m.author && <span className="muted"> — {m.author}</span>}
                          {m.description && <p className="wiki-entry__desc">{m.description}</p>}
                          {seeAlso.length > 0 && (
                            <p className="wiki-entry__see-also">
                              {t('materials.seeAlso')}{' '}
                              {seeAlso.map((tag, i) => (
                                <span key={tag}>
                                  {i > 0 && ', '}
                                  <a href={`#${slugify(tag)}`}>{tag}</a>
                                </span>
                              ))}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
