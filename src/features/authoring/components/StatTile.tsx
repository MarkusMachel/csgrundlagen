interface StatTileProps {
  label: string;
  value: number;
}

/** A single headline number — the "stat tile" form for a count that needs no chart. */
export function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="stat-tile">
      <span className="stat-tile__label">{label}</span>
      <span className="stat-tile__value">{value.toLocaleString()}</span>
    </div>
  );
}
