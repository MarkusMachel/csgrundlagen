import { Book, BookOpen, FileText, Link2, Video, type LucideIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useMaterials, type MaterialType } from '@/features/materials';
import { useTags } from '@/features/questions';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui';

const typeIcons: Record<MaterialType, LucideIcon> = {
  book: Book,
  video: Video,
  article: FileText,
  link: Link2,
};

const materialTypes: MaterialType[] = ['book', 'video', 'article', 'link'];

export function CuratedMaterialPage() {
  const { t } = useTranslation();
  const ids = { type: useId(), tag: useId() };
  const [type, setType] = useState<MaterialType | ''>('');
  const [tag, setTag] = useState('');

  const { data: tags } = useTags();
  const { data: materials, isPending, isError, refetch } = useMaterials({
    type,
    tags: tag ? [tag] : [],
  });

  return (
    <div className="stack">
      <h1>
        <span className="tok-com">{'// '}</span>
        {t('materials.title')}
      </h1>

      <div className="toolbar">
        <div className="field">
          <label htmlFor={ids.type}>{t('materials.filterType')}</label>
          <select
            id={ids.type}
            className="select"
            value={type}
            onChange={(e) => setType(e.target.value as MaterialType | '')}
          >
            <option value="">{t('materials.allTypes')}</option>
            {materialTypes.map((mt) => (
              <option key={mt} value={mt}>
                {t(`materials.type.${mt}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={ids.tag}>{t('home.filterByTag')}</label>
          <select
            id={ids.tag}
            className="select"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          >
            <option value="">{t('home.allTags')}</option>
            {(tags ?? []).map((tg) => (
              <option key={tg} value={tg}>
                {tg}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isPending ? (
        <Spinner center />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : materials.length === 0 ? (
        <EmptyState title={t('materials.empty')} glyph={<BookOpen size={28} />} />
      ) : (
        <div className="materials-grid">
          {materials.map((m) => {
            const Icon = typeIcons[m.type];
            return (
            <a
              key={m.id}
              className="card"
              href={m.url}
              target="_blank"
              rel="noreferrer noopener"
              style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}
            >
              <div className="hstack" style={{ marginBottom: 8 }}>
                <span className="tok-kw" aria-hidden>
                  <Icon size={16} />
                </span>
                <span className="chip">{t(`materials.type.${m.type}`)}</span>
              </div>
              <h2 style={{ fontSize: '1rem' }}>{m.title}</h2>
              {m.author && (
                <p className="muted" style={{ margin: 0 }}>
                  {t('materials.by', { author: m.author })}
                </p>
              )}
              {m.description && <p style={{ margin: '8px 0 0' }}>{m.description}</p>}
              <div className="chip-row" style={{ marginTop: 10 }}>
                {m.tags.map((tg) => (
                  <span key={tg} className="chip">
                    {tg}
                  </span>
                ))}
              </div>
            </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
