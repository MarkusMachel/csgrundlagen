import { ChevronDown, Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DESIGN_KINDS } from '@/features/questions';

import type { PaletteItem } from '../board';
import { DESIGN_PRODUCTS, PRODUCT_GROUPS, type ProductGroup } from '../products';
import { DRAG_TYPE } from './DesignCanvas';
import { NodeIcon } from './NodeIcon';

/**
 * The components to build with: generic building blocks, and real products
 * by vendor (each counts as its generic kind). Drag one onto the board, or
 * click it (or press Enter) to add it. The search covers both.
 */
export function Palette({
  onAdd,
  disabled,
}: {
  onAdd: (item: PaletteItem) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const kindName = (kind: string) => t(`design.kinds.${kind}`);
  const generic = DESIGN_KINDS.filter((k) => !q || kindName(k).toLowerCase().includes(q)).map(
    (kind) => ({
      key: kind,
      item: { kind } as PaletteItem,
      name: kindName(kind),
    }),
  );
  const products = (group: ProductGroup) =>
    DESIGN_PRODUCTS.filter((p) => p.group === group)
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          // "cache" finds Redis, ElastiCache, Memorystore, …
          kindName(p.kind).toLowerCase().includes(q),
      )
      .map((p) => ({
        key: p.id,
        item: { kind: p.kind, product: p.id } as PaletteItem,
        name: p.name,
      }));

  const sections = [
    { key: 'generic', title: t('design.palette.generic'), items: generic },
    ...PRODUCT_GROUPS.map((g) => ({
      key: g,
      title: t(`design.palette.groups.${g}`),
      items: products(g),
    })),
  ].filter((s) => s.items.length > 0);

  return (
    <section className="design-palette" aria-labelledby="design-palette-title">
      <h2 id="design-palette-title" className="design-panel__title">
        {t('design.palette.title')}
      </h2>
      <label className="design-palette__search">
        <Search size={14} aria-hidden />
        <input
          type="search"
          className="input input--small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('design.palette.search')}
          aria-label={t('design.palette.search')}
        />
      </label>
      {sections.length === 0 && (
        <p className="muted design-palette__none">{t('design.palette.none')}</p>
      )}
      {sections.map((s) => (
        // searching opens every group with a match; otherwise only Generic starts open
        <details key={s.key} className="design-palette__group" open={s.key === 'generic' || !!q}>
          <summary className="design-palette__group-title">
            {s.title}
            <span className="design-palette__count">{s.items.length}</span>
            <ChevronDown size={14} aria-hidden className="design-palette__chevron" />
          </summary>
          <ul className="design-palette__list">
            {s.items.map(({ key, item, name }) => (
              <li key={key}>
                <button
                  type="button"
                  className="design-palette__item"
                  draggable={!disabled}
                  disabled={disabled}
                  title={
                    item.product ? t('design.countsAs', { kind: kindName(item.kind) }) : undefined
                  }
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(item));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onClick={() => onAdd(item)}
                  aria-label={t('design.palette.add', { kind: name })}
                >
                  <NodeIcon kind={item.kind} product={item.product} size={14} />
                  <span>{name}</span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </section>
  );
}
