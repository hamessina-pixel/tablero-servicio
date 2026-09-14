export interface FilaDotChart {
  label: string;
  value: number;
  valueLabel: string;
  /** Color del punto. Sin esto todas las filas usan el color de marca del
   *  sistema: en una comparación de una sola medida el largo ya dice el valor,
   *  y pintar cada fila de un color distinto no agrega información. */
  color?: string;
}

/**
 * Compara una misma medida entre pocas categorías. Cada fila es una línea fina
 * que termina en un punto, en vez de una barra maciza: ocupa menos tinta y deja
 * leer el orden de un vistazo.
 */
export function DotChart({ rows }: { rows: FilaDotChart[] }) {
  if (!rows.length) {
    return <p className="py-6 text-center text-[13px] text-[var(--text-muted)]">Sin datos para mostrar.</p>;
  }
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className="flex flex-col gap-3">
      {rows.map((r, i) => {
        // Nunca cae del todo a cero: un valor chico igual tiene que verse.
        const pct = Math.min(Math.max((r.value / max) * 100, 3), 100);
        return (
          <div key={i} className="grid grid-cols-[minmax(0,110px)_1fr_auto] items-center gap-3 text-[12.5px]">
            <span className="truncate text-[var(--text-secondary)]" title={r.label}>{r.label}</span>
            <div className="relative h-3">
              {/* Riel de fondo: da la escala sin pesar en la lectura. */}
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--border)]" />
              <div
                className="absolute top-1/2 h-[2px] -translate-y-1/2 rounded-full transition-[width] duration-500 ease-[var(--ease)]"
                style={{ width: `${pct}%`, background: r.color ?? "var(--brand)" }}
              />
              <span
                className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full
                           ring-2 ring-[var(--surface-raised)] transition-[left] duration-500 ease-[var(--ease)]"
                style={{ left: `${pct}%`, background: r.color ?? "var(--brand)" }}
              />
            </div>
            <span className="font-semibold tabular-nums text-[var(--text-primary)]">{r.valueLabel}</span>
          </div>
        );
      })}
    </div>
  );
}
