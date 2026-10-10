/**
 * The app's mark, {✓}: code braces around a check (src/assets/brand/mark.svg).
 * Fixed brand colours, so it looks the same in both themes, like the app icon.
 */
export function BrandMark({ size = 32, title }: { size?: number; title?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className="brand-mark"
    >
      <rect width="512" height="512" rx="112" fill="#0e0e10" />
      <rect
        x="8"
        y="8"
        width="496"
        height="496"
        rx="104"
        fill="none"
        stroke="#ffffff"
        strokeOpacity=".1"
        strokeWidth="6"
      />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path
          stroke="#6ea8fe"
          strokeWidth="36"
          d="M178 124c-40 0-52 18-52 52v36c0 28-12 44-40 44 28 0 40 16 40 44v36c0 34 12 52 52 52"
        />
        <path
          stroke="#6ea8fe"
          strokeWidth="36"
          d="M334 124c40 0 52 18 52 52v36c0 28 12 44 40 44-28 0-40 16-40 44v36c0 34-12 52-52 52"
        />
        <path stroke="#57ab5a" strokeWidth="40" d="M200 262l40 40 76-88" />
      </g>
    </svg>
  );
}
