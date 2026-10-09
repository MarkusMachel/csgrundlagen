const SERIES_VARS = ['--series-1', '--series-2', '--series-3', '--series-4'] as const;

export interface CategoricalDatum {
  label: string;
  count: number;
}

interface CategoricalBarChartProps {
  title: string;
  data: CategoricalDatum[];
  emptyText: string;
}

/**
 * Magnitude-by-category bar list. Fixed hue order (--series-1…4, validated —
 * see src/styles/global.css), never cycled/reassigned by sort order. Two of
 * the four slots carry a contrast WARN against the light surface, so identity
 * is never color-alone: every row keeps a visible text label and count.
 */
export function CategoricalBarChart({ title, data, emptyText }: CategoricalBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="chart-card">
      <h3>{title}</h3>
      {data.length === 0 ? (
        <p className="tok-com" style={{ margin: 0 }}>
          {'// '}
          {emptyText}
        </p>
      ) : (
        <>
          <div className="bar-chart" style={{ maxWidth: 'none' }}>
            {data.map((d, i) => (
              <div key={d.label} className="bar-row" title={`${d.label}: ${d.count}`}>
                <span className="bar-row__label">{d.label}</span>
                <span className="bar-row__track">
                  <span
                    className="bar-row__fill"
                    style={{
                      width: `${(d.count / max) * 100}%`,
                      background: `var(${SERIES_VARS[i % SERIES_VARS.length]})`,
                    }}
                  />
                </span>
                <span className="bar-row__value">{d.count}</span>
              </div>
            ))}
          </div>
          {data.length > 1 && (
            <div className="chart-legend">
              {data.map((d, i) => (
                <span key={d.label}>
                  <span
                    className="chart-legend__swatch"
                    style={{ background: `var(${SERIES_VARS[i % SERIES_VARS.length]})` }}
                    aria-hidden
                  />
                  {d.label}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
