"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/components/AuthProvider";
import { useMarcas } from "@/components/MarcasProvider";
import { BarChart } from "@/components/ui/BarChart";
import { Button } from "@/components/ui/Button";
import { money } from "@/lib/format";
import type { ResumenPorModelo } from "@/domain/types";

export function ComparadorTab({ adj }: { adj: (v: number | null | undefined) => number }) {
  const { colorMarca } = useMarcas();
  const { requirePermiso } = useAuth();
  const [resumen, setResumen] = useState<ResumenPorModelo[]>([]);
  const [marcaFiltro, setMarcaFiltro] = useState<string | null>(null);

  useEffect(() => { api.planes.resumen().then(setResumen); }, []);

  const porMarca = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const r of resumen) mapa.set(r.marca, (mapa.get(r.marca) || 0) + 1);
    return mapa;
  }, [resumen]);

  const filtrados = useMemo(
    () => (marcaFiltro ? resumen.filter((r) => r.marca === marcaFiltro) : resumen).slice().sort((a, b) => b.costoTotal - a.costoTotal),
    [resumen, marcaFiltro],
  );

  async function exportarExcel() {
    if (!(await requirePermiso("exportar:excel"))) return;
    import("xlsx").then((XLSX) => {
      const filas = resumen.map((r) => ({
        Marca: r.marca, Modelo: r.modelo,
        "Costo total 0-100.000km": adj(r.costoTotal), Repuestos: adj(r.repTotal), Fluidos: adj(r.fluTotal),
        "Mano de obra": adj(r.moTotal), "$ por km": adj(r.costoKm), "Máx. service": adj(r.maxServicio),
      }));
      const ws = XLSX.utils.json_to_sheet(filas);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Comparador");
      XLSX.writeFile(wb, "Comparador_mantenimiento.xlsx");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        <Chip activo={marcaFiltro === null} onClick={() => setMarcaFiltro(null)}>Todos ({resumen.length})</Chip>
        {[...porMarca.entries()].map(([m, n]) => (
          <Chip key={m} activo={marcaFiltro === m} onClick={() => setMarcaFiltro(m)}>{m} ({n})</Chip>
        ))}
      </div>

      <div>
        <p className="mb-2 text-[13px] font-bold">Costo total mantenimiento 0–100.000 km</p>
        <BarChart
          rows={filtrados.map((r) => ({
            label: `${r.marca} ${r.modelo}`, value: adj(r.costoTotal), color: colorMarca(r.marca), valueLabel: money(adj(r.costoTotal)),
          }))}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
              <th className="py-2 pr-2 font-semibold">Modelo</th>
              <th className="py-2 pr-2 text-right font-semibold">Repuestos</th>
              <th className="py-2 pr-2 text-right font-semibold">Fluidos</th>
              <th className="py-2 pr-2 text-right font-semibold">M.O.</th>
              <th className="py-2 pr-2 text-right font-semibold">$ por km</th>
              <th className="py-2 text-right font-semibold">Máx.</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((r) => (
              <tr key={r.modeloId} className="border-b border-[var(--border)] last:border-0">
                <td className="py-2 pr-2">{r.marca} {r.modelo}</td>
                <td className="py-2 pr-2 text-right">{money(adj(r.repTotal))}</td>
                <td className="py-2 pr-2 text-right">{money(adj(r.fluTotal))}</td>
                <td className="py-2 pr-2 text-right">{money(adj(r.moTotal))}</td>
                <td className="py-2 pr-2 text-right">{money(adj(r.costoKm))}</td>
                <td className="py-2 text-right">{money(adj(r.maxServicio))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button onClick={exportarExcel} className="self-start">Exportar a Excel</Button>
    </div>
  );
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-[var(--radius-pill)] border px-3 py-1 text-[12px] font-semibold transition-colors
                  ${activo ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                           : "border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"}`}
    >
      {children}
    </button>
  );
}
