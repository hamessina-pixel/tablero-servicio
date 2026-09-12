"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { useMarcas } from "@/components/MarcasProvider";
import { Select } from "@/components/ui/Input";
import { useModelosDeMarca } from "@/components/cotizador/hooks";
import { money } from "@/lib/format";
import type { SeleccionCotizador } from "@/components/cotizador/CotizadorTab";

interface PlanConPreview {
  id: number;
  kmIntervalo: number;
  costoTotal: number | null;
  precioSugerido: number | null;
  esFlatRate: boolean;
  itemsPreview?: string;
  itemsCount?: number;
}

export function PlanServiciosTab({
  adj, onVerPlan,
}: {
  adj: (v: number | null | undefined) => number;
  onVerPlan: (s: SeleccionCotizador) => void;
}) {
  const { marcasCotizables } = useMarcas();
  const [marcaId, setMarcaId] = useState<number>();
  const [modeloId, setModeloId] = useState<number>();
  const modelos = useModelosDeMarca(marcaId);
  const [planes, setPlanes] = useState<PlanConPreview[]>([]);

  useEffect(() => {
    if (!modeloId) { setPlanes([]); return; }
    api.planes.listar({ modeloId, incluirPreview: true }).then((data) => {
      setPlanes((data as PlanConPreview[]).slice().sort((a, b) => a.kmIntervalo - b.kmIntervalo));
    });
  }, [modeloId]);

  const total = planes.reduce((acc, p) => acc + adj(p.costoTotal ?? p.precioSugerido ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select value={marcaId ?? ""} onChange={(e) => { setMarcaId(Number(e.target.value) || undefined); setModeloId(undefined); }}>
          <option value="">Marca</option>
          {marcasCotizables().map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </Select>
        <Select value={modeloId ?? ""} disabled={!marcaId} onChange={(e) => setModeloId(Number(e.target.value) || undefined)}>
          <option value="">Modelo</option>
          {modelos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </Select>
      </div>

      {planes.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {planes.map((p) => (
              <button
                key={p.id}
                onClick={() => onVerPlan({ marcaId, modeloId, planId: p.id })}
                className="flex flex-col items-start gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)]
                           p-3 text-left transition-shadow hover:shadow-[var(--shadow-hover)]"
              >
                <span className="text-[13px] font-bold">{Math.round(p.kmIntervalo / 1000)}.000 km</span>
                <span className="rounded-[var(--radius-pill)] px-2 py-0.5 text-[12px] font-semibold"
                      style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                  {money(adj(p.costoTotal ?? p.precioSugerido ?? 0))}
                </span>
                <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {p.esFlatRate ? "Precio" : "PVP"}
                </span>
                <span className="text-[11.5px] text-[var(--text-muted)]">{p.itemsPreview || "Solo mano de obra"}</span>
              </button>
            ))}
          </div>
          <p className="text-right text-[13px] font-semibold">
            Costo total 0-100.000 km: <span className="text-[15px] font-extrabold">{money(total)}</span>
          </p>
        </>
      )}
    </div>
  );
}
