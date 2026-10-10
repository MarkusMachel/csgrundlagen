import type { DesignKind } from '@/features/questions';

import { KIND_ICON } from '../kinds';
import { BADGE_COLOR, BADGE_TEXT, productById } from '../products';

/** Relative luminance of a hex colour, 0 (black) to 1 (white). */
function luminance(hex: string) {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * The picture for a component: the product's logo in its brand colour on a
 * tile that keeps it visible in both themes, a vendor-coloured badge when
 * there's no logo to use, or the generic kind's icon.
 */
export function NodeIcon({
  kind,
  product,
  size = 18,
}: {
  kind: DesignKind;
  product?: string;
  size?: number;
}) {
  const p = productById(product);
  if (p?.logo) {
    // near-white brand colours go on a dark tile, everything else on white
    const dark = luminance(p.logo.hex) > 0.7;
    return (
      <span
        className={dark ? 'node-logo node-logo--dark' : 'node-logo'}
        style={{ width: size + 8, height: size + 8 }}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" width={size} height={size} fill={`#${p.logo.hex}`}>
          <path d={p.logo.path} />
        </svg>
      </span>
    );
  }
  if (p?.badge) {
    return (
      <span
        className="node-badge"
        style={{
          minWidth: size + 8,
          height: size + 8,
          background: BADGE_COLOR[p.group],
          color: BADGE_TEXT[p.group],
        }}
        aria-hidden
      >
        {p.badge}
      </span>
    );
  }
  const Icon = KIND_ICON[kind];
  return <Icon size={size} aria-hidden className="node-kind-icon" />;
}
