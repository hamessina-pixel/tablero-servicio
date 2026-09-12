"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { useMarcas } from "@/components/MarcasProvider";
import { Select } from "@/components/ui/Input";
import { useModelosDeMarca, usePlanesDeModelo } from "@/components/cotizador/hooks";
import { money } from "@/lib/format";
import type { PlanMantenimiento } from "@/domain/types";

function SelectorAB({
  marcaId, modeloId, onMarca, onModelo, label,
}: {
  marcaId?: number; modeloId?: number; onMarca: (v?: number) => void; onModelo: (v?: number) => void; label: string;
}) {
  const { marcasCotizables } = useMarcas();
  const modelos = useModelosDeMarca(marcaId);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12px] font-bold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <Select value={marcaId ?? ""} onChange={(e) => onMarca(Number(e.target.value) || undefined)}>
        <option value="">Marca</option>
        {marcasCotizables().map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
      </Select>
      <Select value={modeloId ?? ""} disabled={!marcaId} onChange={(e) => onModelo(Number(e.target.value) || undefined)}>
        <option value="">Modelo</option>
        {modelos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
      </Select>
    </div>
  );
}

export function VersusTab({ adj }: { adj: (v: number | null | undefined) => number }) {
  const [aMarca, setAMarca] = useState<number>(); const [aModelo, setAModelo] = useState<number>();
  const [bMarca, setBMarca] = useState<number>(); const [bModelo, setBModelo] = useState<number>();
  const planesA = usePlanesDeModelo(aModelo);
  const planesB = usePlanesDeModelo(bModelo);
  const [resumen, setResumen] = useState<Awaited<ReturnType<typeof api.planes.resumen>>>([]);

  useEffect(() => { api.planes.resumen().then(setResumen); }, []);

  if (!aModelo || !bModelo) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <SelectorAB marcaId={aMarca} modeloId={aModelo} onMarca={setAMarca} onModelo={setAModelo} label="Modelo A" />
        <SelectorAB marcaId={bMarca} modeloId={bModelo} onMarca={setBMarca} onModelo={setBModelo} label="Modelo B" />
      </div>
    );
  }

  const rA = resumen.find((r) => r.modeloId === aModelo);
  const rB = resumen.find((r) => r.modeloId === bModelo);
  const totalA = adj(rA?.costoTotal ?? 0);
  const totalB = adj(rB?.costoTotal ?? 0);
  const diff = totalA - totalB;

  const kms = [...new Set([...planesA.map((p) => p.kmIntervalo), ...planesB.map((p) => p.kmIntervalo)])].sort((a, b) => a - b);
  const porKm = (planes: PlanMantenimiento[], km: number) => planes.find((p) => p.kmIntervalo === km);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <SelectorAB marcaId={aMarca} modeloId={aModelo} onMarca={setAMarca} onModelo={setAModelo} label="Modelo A" />
        <SelectorAB marcaId={bMarca} modeloId={bModelo} onMarca={setBMarca} onModelo={setBModelo} label="Modelo B" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-4 text-center">
          <p className="text-[12px] text-[var(--text-muted)]">{rA?.marca} {rA?.modelo}</p>
          <p className="text-2xl font-extrabold">{money(totalA)}</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-4 text-center">
          <p className="text-[12px] text-[var(--text-muted)]">{rB?.marca} {rB?.modelo}</p>
          <p className="text-2xl font-extrabold">{money(totalB)}</p>
        </div>
      </div>
      <p className="text-center text-[13px] font-semibold" style={{ color: diff > 0 ? "var(--status-critical)" : "var(--status-good)" }}>
        {rA?.modelo} es {money(Math.abs(diff))} {diff > 0 ? "más caro" : "más económico"} que {rB?.modelo}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
              <th className="py-2 pr-2 font-semibold">Km</th>
              <th className="py-2 pr-2 text-right font-semibold">A</th>
              <th className="py-2 pr-2 text-right font-semibold">B</th>
              <th className="py-2 text-right font-semibold">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {kms.map((km) => {
              const pa = porKm(planesA, km); const pb = porKm(planesB, km);
              const va = pa ? adj(pa.costoTotal ?? pa.precioSugerido ?? 0) : null;
              const vb = pb ? adj(pb.costoTotal ?? pb.precioSugerido ?? 0) : null;
              return (
                <tr key={km} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2 pr-2">{Math.round(km / 1000)}.000</td>
                  <td className="py-2 pr-2 text-right">{va != null ? money(va) : "—"}</td>
                  <td className="py-2 pr-2 text-right">{vb != null ? money(vb) : "—"}</td>
                  <td className="py-2 text-right">{va != null && vb != null ? money(va - vb) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
