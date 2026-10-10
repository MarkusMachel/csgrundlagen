import { useTranslation } from 'react-i18next';

import { DESIGN_KINDS, type DesignKind } from '@/features/questions';

import { KIND_ICON } from '../kinds';
import { DRAG_TYPE } from './DesignCanvas';

/**
 * The components to build with. Drag one onto the board, or click it (or
 * press Enter) to add it.
 */
export function Palette({
  onAdd,
  disabled,
}: {
  onAdd: (kind: DesignKind) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <section className="design-palette" aria-labelledby="design-palette-title">
      <h2 id="design-palette-title" className="design-panel__title">
        {t('design.palette.title')}
      </h2>
      <ul className="design-palette__list">
        {DESIGN_KINDS.map((kind) => {
          const Icon = KIND_ICON[kind];
          return (
            <li key={kind}>
              <button
                type="button"
                className="design-palette__item"
                draggable={!disabled}
                disabled={disabled}
                onDragStart={(e) => {
                  e.dataTransfer.setData(DRAG_TYPE, kind);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onClick={() => onAdd(kind)}
                aria-label={t('design.palette.add', { kind: t(`design.kinds.${kind}`) })}
              >
                <Icon size={16} aria-hidden />
                <span>{t(`design.kinds.${kind}`)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
