import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  glyph?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, glyph = '∅', actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="state-block" role="status">
      <div className="state-block__glyph" aria-hidden>
        {glyph}
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {actionLabel && onAction && (
        <button type="button" className="btn" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
