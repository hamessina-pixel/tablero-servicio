"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/apiClient";
import { InputBusqueda } from "@/components/ui/InputBusqueda";

interface GrupoBusqueda {
  codigo: string | null;
  nombre: string | null;
  usos: { marca: string; modelo: string; kmIntervalo: number }[];
}
interface ResultadoBusqueda {
  query: string;
  totalCoincidencias?: number;
  totalCodigos?: number;
  grupos: GrupoBusqueda[];
}

export function BuscarTab() {
  const [q, setQ] = useState("");
  const [resultado, setResultado] = useState<ResultadoBusqueda | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!q.trim()) { setResultado(null); return; }
    timer.current = setTimeout(() => {
      api.planes.buscarRepuesto(q).then((r) => setResultado(r as ResultadoBusqueda));
    }, 250);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [q]);

  return (
    <div className="flex flex-col gap-4">
      <InputBusqueda
        placeholder="Buscar por código o nombre de repuesto…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onLimpiar={() => setQ("")}
        className="w-full max-w-md"
      />
      {resultado && (
        <>
          {resultado.totalCoincidencias !== undefined && (
            <p className="text-[12px] text-[var(--text-muted)]">
              {resultado.totalCoincidencias} coincidencias en {resultado.totalCodigos} código(s)
            </p>
          )}
          <div className="flex flex-col gap-2">
            {resultado.grupos.map((g, i) => (
              <div key={i} className="rounded-[var(--radius-md)] border border-[var(--border)] p-3 text-[13px]">
                <p className="font-semibold">
                  {g.codigo && <span className="font-mono text-[var(--brand)]">{g.codigo}</span>} {g.nombre}
                </p>
                <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                  Usado en {g.usos.length} service{g.usos.length > 1 ? "s" : ""}:{" "}
                  {g.usos.slice(0, 6).map((u, j) => (
                    <span key={j}>{j > 0 && ", "}{u.marca} {u.modelo} ({Math.round(u.kmIntervalo / 1000)}k)</span>
                  ))}
                  {g.usos.length > 6 && "…"}
                </p>
              </div>
            ))}
            {resultado.grupos.length === 0 && <p className="text-[13px] text-[var(--text-muted)]">Sin coincidencias.</p>}
          </div>
        </>
      )}
    </div>
  );
}
