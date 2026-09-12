"use client";

export interface SegmentoDonut {
  label: string;
  value: number;
  color: string;
  etiqueta?: string;
}

const R = 60;
const GROSOR = 22;
const CIRC = 2 * Math.PI * R;

export function Donut({
  segmentos,
  formatMoneda,
}: {
  segmentos: SegmentoDonut[];
  formatMoneda: (v: number) => string;
}) {
  const total = segmentos.reduce((a, s) => a + (s.value > 0 ? s.value : 0), 0);

  if (total <= 0) {
    return (
      <div className="flex items-center justify-center py-8 text-[13px] text-[var(--text-muted)]">
        Sin datos para mostrar.
      </div>
    );
  }

  let acumulado = 0;
  const arcos = segmentos
    .filter((s) => s.value > 0)
    .map((s) => {
      const frac = s.value / total;
      const largo = Math.max(frac * CIRC, 2);
      const offset = -acumulado * CIRC;
      acumulado += frac;
      return { ...s, largo, offset };
    });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0">
        <circle cx="80" cy="80" r={R} fill="none" stroke="var(--surface-2)" strokeWidth={GROSOR} />
        {arcos.map((a, i) => (
          <circle
            key={i}
            cx="80" cy="80" r={R} fill="none"
            stroke={a.color}
            strokeWidth={GROSOR}
            strokeDasharray={`${a.largo} ${CIRC - a.largo}`}
            strokeDashoffset={a.offset}
            transform="rotate(-90 80 80)"
            strokeLinecap="butt"
          />
        ))}
        <text x="80" y="75" textAnchor="middle" className="fill-[var(--text-muted)] text-[10px]">Total</text>
        <text x="80" y="93" textAnchor="middle" className="fill-[var(--text-primary)] text-[15px] font-extrabold">
          {formatMoneda(total)}
        </text>
      </svg>
      <div className="flex flex-1 flex-col gap-2">
        {segmentos.map((s, i) => {
          const pct = total ? Math.round((s.value / total) * 100) : 0;
          return (
            <div key={i} className="flex items-center gap-2 text-[12.5px]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="flex-1 text-[var(--text-secondary)]">{s.etiqueta ?? s.label}</span>
              <span className="text-[var(--text-muted)]">{pct}%</span>
              <span className="w-24 text-right font-semibold text-[var(--text-primary)]">{formatMoneda(s.value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
