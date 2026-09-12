"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { useMarcas } from "@/components/MarcasProvider";
import { useToast } from "@/components/Toast";
import { Select } from "@/components/ui/Input";
import { PlanDetalle } from "@/components/cotizador/PlanDetalle";
import { useModelosDeMarca, usePlanesDeModelo } from "@/components/cotizador/hooks";
import type { PlanConDetalle } from "@/domain/types";

export const HISTORIAL_KEY = "cotizador_historial";

export interface SeleccionCotizador {
  marcaId?: number;
  modeloId?: number;
  planId?: number;
}

export function CotizadorTab({
  seleccion,
  setSeleccion,
  adj,
}: {
  seleccion: SeleccionCotizador;
  setSeleccion: (s: SeleccionCotizador) => void;
  adj: (v: number | null | undefined) => number;
}) {
  const { marcasCotizables, marcasSinPlanes } = useMarcas();
  const toast = useToast();
  const modelos = useModelosDeMarca(seleccion.marcaId);
  const planes = usePlanesDeModelo(seleccion.modeloId);
  const [plan, setPlan] = useState<PlanConDetalle | null>(null);
  const [lub, setLub] = useState<Awaited<ReturnType<typeof api.lubricacion.deModelo>> | null>(null);
  const [cargando, setCargando] = useState(false);

  const cotizables = marcasCotizables();
  const sinPlanes = marcasSinPlanes();

  useEffect(() => {
    if (!seleccion.planId) { setPlan(null); return; }
    let vivo = true;
    setCargando(true);
    api.planes.obtener(seleccion.planId).then((p) => { if (vivo) setPlan(p); }).finally(() => vivo && setCargando(false));
    return () => { vivo = false; };
  }, [seleccion.planId]);

  useEffect(() => {
    if (!seleccion.modeloId || !plan || plan.marcaNombre === "FIAT") { setLub(null); return; }
    let vivo = true;
    api.lubricacion.deModelo(seleccion.modeloId).then((l) => { if (vivo) setLub(l); });
    return () => { vivo = false; };
  }, [seleccion.modeloId, plan]);

  function guardarHistorial() {
    if (!plan || !seleccion.marcaId || !seleccion.modeloId) return;
    try {
      const historial = JSON.parse(localStorage.getItem(HISTORIAL_KEY) || "[]");
      historial.unshift({
        // Se guardan los IDs (no solo nombre+km) para que "Cargar" sea directo
        // y no dependa de volver a resolver un nombre que pudo cambiar.
        marcaId: seleccion.marcaId, modeloId: seleccion.modeloId, planId: plan.id,
        marca: plan.marcaNombre, modelo: plan.modeloNombre, km: plan.kmIntervalo,
        fecha: new Date().toLocaleDateString("es-AR"),
        total: adj(plan.costoTotal ?? plan.precioSugerido ?? 0),
        pvp: plan.precioSugerido != null ? adj(plan.precioSugerido) : null,
      });
      localStorage.setItem(HISTORIAL_KEY, JSON.stringify(historial.slice(0, 50)));
      toast("Guardado en el historial", "success");
    } catch {
      toast("No se pudo guardar en el historial", "error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="text-[12.5px] font-semibold text-[var(--text-secondary)]">
          Marca
          <Select
            className="mt-1"
            value={seleccion.marcaId ?? ""}
            onChange={(e) => setSeleccion({ marcaId: Number(e.target.value) || undefined })}
          >
            <option value="">Elegí una marca</option>
            {cotizables.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            {sinPlanes.map((m) => <option key={m.id} value={m.id} disabled>{m.nombre} — sin planes cargados</option>)}
          </Select>
        </label>
        <label className="text-[12.5px] font-semibold text-[var(--text-secondary)]">
          Modelo
          <Select
            className="mt-1"
            value={seleccion.modeloId ?? ""}
            disabled={!seleccion.marcaId}
            onChange={(e) => setSeleccion({ marcaId: seleccion.marcaId, modeloId: Number(e.target.value) || undefined })}
          >
            <option value="">Elegí un modelo</option>
            {modelos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </Select>
        </label>
        <label className="text-[12.5px] font-semibold text-[var(--text-secondary)]">
          Kilometraje
          <Select
            className="mt-1"
            value={seleccion.planId ?? ""}
            disabled={!seleccion.modeloId}
            onChange={(e) => setSeleccion({ ...seleccion, planId: Number(e.target.value) || undefined })}
          >
            <option value="">Elegí un intervalo</option>
            {planes.map((p) => <option key={p.id} value={p.id}>{Math.round(p.kmIntervalo / 1000)}.000 km</option>)}
          </Select>
        </label>
      </div>

      {planes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {planes.map((p) => (
            <button
              key={p.id}
              onClick={() => setSeleccion({ ...seleccion, planId: p.id })}
              className={`rounded-[var(--radius-pill)] border px-3 py-1 text-[12px] font-semibold transition-colors
                          ${p.id === seleccion.planId
                            ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                            : "border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"}`}
            >
              {Math.round(p.kmIntervalo / 1000)}k
            </button>
          ))}
        </div>
      )}

      {cargando && <p className="text-[13px] text-[var(--text-muted)]">Cargando…</p>}

      {plan && !cargando && (
        <>
          <p className="text-[13px] text-[var(--text-secondary)]">
            {plan.marcaNombre} {plan.modeloNombre} · {Math.round(plan.kmIntervalo / 1000)}.000 km
          </p>
          <PlanDetalle plan={plan} marcaNombre={plan.marcaNombre} lub={lub} adj={adj} onGuardarHistorial={guardarHistorial} />
        </>
      )}

      {!plan && !cargando && seleccion.modeloId && !seleccion.planId && (
        <p className="text-[13px] text-[var(--text-muted)]">Elegí un kilometraje para ver la cotización.</p>
      )}
    </div>
  );
}
