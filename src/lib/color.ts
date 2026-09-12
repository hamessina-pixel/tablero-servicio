/** Blanco o negro según la luminancia relativa WCAG del color de fondo dado
 *  (hex) — traducción de `textoSobre()` en dashboard/frontend/js/marcas.js. */
export function textoSobre(hex: string): string {
  const limpio = (hex || "").replace("#", "");
  if (limpio.length !== 6) return "#ffffff";
  const r = parseInt(limpio.slice(0, 2), 16) / 255;
  const g = parseInt(limpio.slice(2, 4), 16) / 255;
  const b = parseInt(limpio.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const luminancia = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminancia > 0.4 ? "#0e1c2f" : "#ffffff";
}
