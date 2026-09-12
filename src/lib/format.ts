/** Traducción 1:1 de dashboard/frontend/js/components/format.js. */

export function money(v: number | null | undefined): string {
  if (v === null || v === undefined || (typeof v === "number" && Number.isNaN(v))) return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return "$" + Math.round(n).toLocaleString("es-AR");
}

export function compactNumber(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function number(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("es-AR");
}

/** Horas decimales (1.5, 2.25...) a tiempo en base 60: "1h 30min", "45 min", "2h". */
export function horasATiempo(horasDecimal: number | null | undefined): string {
  const totalMin = Math.round((Number(horasDecimal) || 0) * 60);
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (h === 0) return `${min} min`;
  if (min === 0) return `${h}h`;
  return `${h}h ${min}min`;
}
