import { Book, BookOpen, FileText, Link2, Video, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { MaterialType } from '@/features/materials';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui';

import { useQuestionMaterials } from '../../hooks/useQuestionExtras';

const typeIcons: Record<MaterialType, LucideIcon> = {
  book: Book,
  video: Video,
  article: FileText,
  link: Link2,
};

export function MaterialTab({ questionId }: { questionId: string }) {
  const { t } = useTranslation();
  const { data: materials, isPending, isError, refetch } = useQuestionMaterials(questionId);

  if (isPending) return <Spinner />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (materials.length === 0) {
    return <EmptyState title={t('question.material.empty')} glyph={<BookOpen size={28} />} />;
  }

  return (
    <div>
      {materials.map((m) => {
        const Icon = typeIcons[m.type];
        return (
          <a
            key={m.id}
            className="material-item"
            href={m.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            <span className="material-item__glyph" aria-hidden>
              <Icon size={16} />
            </span>
            <span style={{ minWidth: 0 }}>
              <span className="material-item__title">{m.title}</span>
              <span className="material-item__sub">
                {m.author ? t('materials.by', { author: m.author }) : m.description}
              </span>
            </span>
          </a>
        );
      })}
    </div>
  );
}
