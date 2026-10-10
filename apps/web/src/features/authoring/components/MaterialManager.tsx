import { ExternalLink, Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useMaterials, type MaterialItem } from '@/features/materials';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui';

import { ConfirmDeleteButton } from './ConfirmDeleteButton';
import { MaterialForm } from './MaterialForm';
import { useDeleteMaterial } from '../hooks/useAuthoring';

/** Admin list of every material with edit and delete. */
export function MaterialManager() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<MaterialItem | null>(null);
  const deleteMaterial = useDeleteMaterial();
  const { data, isPending, isError, refetch } = useMaterials();

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = [...(data ?? [])].sort((a, b) => a.title.localeCompare(b.title));
    return q
      ? all.filter((m) =>
          [m.title, m.url, m.author, ...m.tags].some((s) => s?.toLowerCase().includes(q)),
        )
      : all;
  }, [data, search]);

  if (editing) {
    return (
      <div className="stack" style={{ gap: 12 }}>
        <h2 style={{ margin: 0 }}>{t('authoring.editMaterial')}</h2>
        <MaterialForm
          key={editing.id}
          material={editing}
          onSaved={() => setEditing(null)}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      <input
        type="search"
        className="input"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('materials.searchPlaceholder')}
        aria-label={t('materials.searchPlaceholder')}
      />
      {isPending ? (
        <Spinner center />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState title={t('materials.empty')} />
      ) : (
        <ul className="admin-list">
          {visible.map((m) => (
            <li key={m.id} className="admin-list__row">
              <div className="admin-list__main">
                <a
                  className="admin-list__title"
                  href={m.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {m.title} <ExternalLink size={12} aria-hidden />
                </a>
                <span className="admin-list__meta">
                  {t(`materials.type.${m.type}`)} · {m.tags.join(', ')}
                </span>
              </div>
              <div className="admin-list__actions">
                <button
                  type="button"
                  className="btn btn--small btn--ghost"
                  aria-label={t('authoring.editLabel', { label: m.title })}
                  onClick={() => setEditing(m)}
                >
                  <Pencil size={14} aria-hidden />
                  {t('authoring.edit')}
                </button>
                <ConfirmDeleteButton
                  label={m.title}
                  pending={deleteMaterial.isPending}
                  onConfirm={() => deleteMaterial.mutate(m.id)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
