"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { useMarcas } from "@/components/MarcasProvider";
import { Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useModelosDeMarca, usePlanesDeModelo } from "@/components/cotizador/hooks";
import type { PlanConDetalle } from "@/domain/types";

export function ChecklistTab() {
  const { marcasCotizables } = useMarcas();
  const [marcaId, setMarcaId] = useState<number>();
  const [modeloId, setModeloId] = useState<number>();
  const [planId, setPlanId] = useState<number>();
  const modelos = useModelosDeMarca(marcaId);
  const planes = usePlanesDeModelo(modeloId);
  const [plan, setPlan] = useState<PlanConDetalle | null>(null);

  useEffect(() => {
    if (!planId) { setPlan(null); return; }
    api.planes.obtener(planId).then(setPlan);
  }, [planId]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Select value={marcaId ?? ""} onChange={(e) => { setMarcaId(Number(e.target.value) || undefined); setModeloId(undefined); setPlanId(undefined); }}>
          <option value="">Marca</option>
          {marcasCotizables().map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </Select>
        <Select value={modeloId ?? ""} disabled={!marcaId} onChange={(e) => { setModeloId(Number(e.target.value) || undefined); setPlanId(undefined); }}>
          <option value="">Modelo</option>
          {modelos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </Select>
        <Select value={planId ?? ""} disabled={!modeloId} onChange={(e) => setPlanId(Number(e.target.value) || undefined)}>
          <option value="">Kilometraje</option>
          {planes.map((p) => <option key={p.id} value={p.id}>{Math.round(p.kmIntervalo / 1000)}.000 km</option>)}
        </Select>
      </div>

      {plan && (
        <>
          <p className="text-[12px] text-[var(--text-muted)]">X = Reemplazar &nbsp; O = Revisar / Controlar</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                  <th className="py-2 pr-2 font-semibold">Ítem</th>
                  <th className="py-2 pr-2 font-semibold">Acción</th>
                  <th className="py-2 font-semibold">Realizado</th>
                </tr>
              </thead>
              <tbody>
                {plan.checklist.map((c, i) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2 pr-2">{c.item}</td>
                    <td className="py-2 pr-2"><Badge tono={c.accion === "X" ? "critical" : "accent"}>{c.accion === "X" ? "Reemplazar" : "Revisar"}</Badge></td>
                    <td className="py-2 text-lg">☐</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button className="no-print self-start" onClick={() => window.print()}>Imprimir checklist</Button>
        </>
      )}
    </div>
  );
}
