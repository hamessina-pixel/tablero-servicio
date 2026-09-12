export interface FilaBarChart {
  label: string;
  value: number;
  color: string;
  valueLabel: string;
}

export function BarChart({ rows }: { rows: FilaBarChart[] }) {
  if (!rows.length) {
    return <p className="py-6 text-center text-[13px] text-[var(--text-muted)]">Sin datos para mostrar.</p>;
  }
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r, i) => {
        const pct = Math.max((r.value / max) * 100, 2);
        return (
          <div key={i} className="grid grid-cols-[minmax(0,120px)_1fr_auto] items-center gap-3 text-[12.5px]">
            <span className="truncate text-[var(--text-secondary)]" title={r.label}>{r.label}</span>
            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-[var(--ease)]"
                style={{ width: `${pct}%`, background: r.color }}
              />
            </div>
            <span className="font-semibold tabular-nums text-[var(--text-primary)]">{r.valueLabel}</span>
          </div>
        );
      })}
    </div>
  );
}
