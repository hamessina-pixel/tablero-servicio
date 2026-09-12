"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { useMarcas } from "@/components/MarcasProvider";
import { Card, CardTitle } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { BarChart } from "@/components/ui/BarChart";
import { Button } from "@/components/ui/Button";
import { money, compactNumber, number } from "@/lib/format";
import type { ResumenDashboard, ResumenPorModelo } from "@/domain/types";

const TONO = {
  azul: "var(--brand)",
  verde: "var(--status-good)",
  ambar: "var(--status-warning)",
  rojo: "var(--status-critical)",
  pizarra: "#34506e",
};

export default function InicioPage() {
  const router = useRouter();
  const { colorMarca, cargando: cargandoMarcas } = useMarcas();
  const [r, setR] = useState<ResumenDashboard | null>(null);
  const [planes, setPlanes] = useState<ResumenPorModelo[]>([]);

  useEffect(() => {
    api.dashboard.resumen().then(setR);
    api.planes.resumen().then(setPlanes);
  }, []);

  const costoKmPorMarca = (() => {
    const mapa = new Map<string, { suma: number; n: number }>();
    for (const p of planes) {
      const e = mapa.get(p.marca) ?? { suma: 0, n: 0 };
      e.suma += p.costoKm; e.n += 1;
      mapa.set(p.marca, e);
    }
    return [...mapa.entries()]
      .map(([marca, e]) => ({ marca, promedio: e.n ? e.suma / e.n : 0 }))
      .sort((a, b) => b.promedio - a.promedio);
  })();

  if (!r || cargandoMarcas) {
    return <div className="py-16 text-center text-[13px] text-[var(--text-muted)]">Cargando…</div>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-extrabold">Inicio</h1>
        <p className="text-[13px] text-[var(--text-secondary)]">Resumen general del negocio de servicio.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Repuestos en catálogo" value={compactNumber(r.repuestosTotal)} icon="⚙️" tono={TONO.azul} />
        <StatTile label="Stock gestionado" value={number(r.repuestosStockGestionado)} icon="📦" tono={TONO.verde} />
        <StatTile label="Valor de stock" value={money(r.valorStockGestionado)} icon="💰" tono={TONO.ambar} />
        <StatTile label="Códigos con stock bajo" value={number(r.repuestosStockBajo)} icon="⚠️" tono={TONO.rojo} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Marcas" value={number(r.marcas)} icon="🏆" tono={TONO.pizarra} />
        <StatTile label="Modelos" value={number(r.modelos)} icon="🚙" tono={TONO.azul} />
        <StatTile label="Planes de mantenimiento" value={number(r.planesMantenimiento)} icon="📋" tono={TONO.verde} />
        <StatTile label="Sustituciones registradas" value={compactNumber(r.sustituciones)} icon="⇄" tono={TONO.pizarra} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Repuestos por marca</CardTitle>
          <p className="mb-3 text-[12px] text-[var(--text-muted)]">Códigos cargados en el catálogo de cada marca</p>
          <BarChart
            rows={r.repuestosPorMarca
              .slice()
              .sort((a, b) => b.repuestos - a.repuestos)
              .map((x) => ({ label: x.marca, value: x.repuestos, color: colorMarca(x.marca), valueLabel: number(x.repuestos) }))}
          />
        </Card>
        <Card>
          <CardTitle>Costo por km más alto</CardTitle>
          <p className="mb-3 text-[12px] text-[var(--text-muted)]">Top modelos según costo estimado de mantenimiento por km</p>
          <BarChart
            rows={r.costoPorKmTop.map((x) => ({
              label: `${x.marca} ${x.modelo}`, value: x.costoPorKm, color: colorMarca(x.marca), valueLabel: money(x.costoPorKm),
            }))}
          />
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <CardTitle>Comparador multimarca</CardTitle>
            <p className="text-[12px] text-[var(--text-muted)]">Costo promedio de mantenimiento por km, según los planes cargados de cada marca</p>
          </div>
          <Button tamano="sm" onClick={() => router.push("/cotizador?tab=comparador")}>Ver detalle completo</Button>
        </div>
        <BarChart
          rows={costoKmPorMarca.map((x) => ({ label: x.marca, value: x.promedio, color: colorMarca(x.marca), valueLabel: money(x.promedio) }))}
        />
      </Card>

      <Card>
        <CardTitle>Modelos por marca</CardTitle>
        <p className="mb-3 text-[12px] text-[var(--text-muted)]">Cuántos modelos tiene cargados cada marca</p>
        <BarChart
          rows={r.modelosPorMarca
            .slice()
            .sort((a, b) => b.modelos - a.modelos)
            .map((x) => ({ label: x.marca, value: x.modelos, color: colorMarca(x.marca), valueLabel: number(x.modelos) }))}
        />
      </Card>

      <Card>
        <CardTitle>Accesos rápidos</CardTitle>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => router.push("/repuestos?stockBajo=1")}>Ver códigos con stock bajo</Button>
          <Button onClick={() => router.push("/cotizador")}>Ir al cotizador</Button>
          <Button onClick={() => router.push("/sustituciones")}>Ver sustituciones</Button>
        </div>
      </Card>
    </div>
  );
}
