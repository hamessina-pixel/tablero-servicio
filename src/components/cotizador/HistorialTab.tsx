"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { money } from "@/lib/format";
import { HISTORIAL_KEY, type SeleccionCotizador } from "@/components/cotizador/CotizadorTab";

interface EntradaHistorial {
  marcaId: number; modeloId: number; planId: number;
  marca: string; modelo: string; km: number; fecha: string; total: number; pvp: number | null;
}

export function HistorialTab({ onCargar }: { onCargar: (s: SeleccionCotizador) => void }) {
  const [historial, setHistorial] = useState<EntradaHistorial[]>([]);

  useEffect(() => {
    try { setHistorial(JSON.parse(localStorage.getItem(HISTORIAL_KEY) || "[]")); } catch { setHistorial([]); }
  }, []);

  function vaciar() {
    if (!confirm("¿Vaciar todo el historial? No se puede deshacer.")) return;
    localStorage.removeItem(HISTORIAL_KEY);
    setHistorial([]);
  }

  if (!historial.length) {
    return <p className="text-[13px] text-[var(--text-muted)]">Todavía no guardaste ninguna cotización en el historial.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {historial.map((h, i) => (
        <div key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] p-3 text-[13px]">
          <div>
            <p className="font-semibold">{h.marca} {h.modelo} · {Math.round(h.km / 1000)}.000 km</p>
            <p className="text-[12px] text-[var(--text-muted)]">{h.fecha} · Total {money(h.total)}{h.pvp != null && ` · PVP ${money(h.pvp)}`}</p>
          </div>
          <Button onClick={() => onCargar({ marcaId: h.marcaId, modeloId: h.modeloId, planId: h.planId })}>Cargar</Button>
        </div>
      ))}
      <Button variante="danger" className="self-start" onClick={vaciar}>Vaciar historial</Button>
    </div>
  );
}
