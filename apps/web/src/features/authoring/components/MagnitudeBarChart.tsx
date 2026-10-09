export interface MagnitudeDatum {
  label: string;
  count: number;
}

interface MagnitudeBarChartProps {
  title: string;
  data: MagnitudeDatum[];
  emptyText: string;
}

/**
 * Ranked magnitude list (e.g. "top tags by answer volume") — one sequential
 * hue (--chart-bar, already validated on both surfaces), not the categorical
 * series. An open-ended set of rows must never cycle a fixed 4-slot palette.
 */
export function MagnitudeBarChart({ title, data, emptyText }: MagnitudeBarChartProps) {
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
        <div className="bar-chart" style={{ maxWidth: 'none' }}>
          {data.map((d) => (
            <div key={d.label} className="bar-row" title={`${d.label}: ${d.count}`}>
              <span className="bar-row__label">{d.label}</span>
              <span className="bar-row__track">
                <span className="bar-row__fill" style={{ width: `${(d.count / max) * 100}%` }} />
              </span>
              <span className="bar-row__value">{d.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
