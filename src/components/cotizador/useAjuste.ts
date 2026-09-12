import { useCallback, useState } from "react";

/** "Ajuste de precios %": multiplicador de escenario que se aplica solo en
 *  pantalla (no toca la base) — mismo criterio que adj() en el cotizador viejo. */
export function useAjuste() {
  const [pct, setPct] = useState(0);
  const adj = useCallback((v: number | null | undefined) => (v ?? 0) * (1 + pct / 100), [pct]);
  return { pct, setPct, adj };
}
