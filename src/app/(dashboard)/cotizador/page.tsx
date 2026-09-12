"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMarcas } from "@/components/MarcasProvider";
import { BrandTag } from "@/components/ui/BrandTag";
import { Input } from "@/components/ui/Input";
import { useAjuste } from "@/components/cotizador/useAjuste";
import { CotizadorTab, type SeleccionCotizador } from "@/components/cotizador/CotizadorTab";
import { ComparadorTab } from "@/components/cotizador/ComparadorTab";
import { VersusTab } from "@/components/cotizador/VersusTab";
import { PlanServiciosTab } from "@/components/cotizador/PlanServiciosTab";
import { ChecklistTab } from "@/components/cotizador/ChecklistTab";
import { BuscarTab } from "@/components/cotizador/BuscarTab";
import { HistorialTab } from "@/components/cotizador/HistorialTab";

const TABS = [
  { id: "cotizador", label: "Cotizador" },
  { id: "comparador", label: "Comparador" },
  { id: "versus", label: "Comparar 2" },
  { id: "plan", label: "Plan servicios" },
  { id: "checklist", label: "Checklist" },
  { id: "buscar", label: "Buscar repuesto" },
  { id: "historial", label: "Historial" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function CotizadorPage() {
  return (
    <Suspense>
      <CotizadorPageInner />
    </Suspense>
  );
}

function CotizadorPageInner() {
  const searchParams = useSearchParams();
  const { marcas } = useMarcas();
  const tabInicial = TABS.find((t) => t.id === searchParams.get("tab"))?.id ?? "cotizador";
  const [tab, setTab] = useState<TabId>(tabInicial);
  const { pct, setPct, adj } = useAjuste();
  const [seleccion, setSeleccion] = useState<SeleccionCotizador>({});

  const irACotizador = (s: SeleccionCotizador) => { setSeleccion(s); setTab("cotizador"); };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {marcas.filter((m) => m.esVehiculos).map((m) => (
            <BrandTag
              key={m.id}
              nombre={m.nombre}
              color={m.color || "var(--text-muted)"}
              grande
              onClick={() => irACotizador({ marcaId: m.id })}
            />
          ))}
        </div>
        <label className="flex items-center gap-2 text-[12.5px] font-semibold text-[var(--text-secondary)]">
          Ajuste de precios
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step={1}
              value={pct}
              onChange={(e) => setPct(Number(e.target.value) || 0)}
              className="w-20"
            />
            <span>%</span>
          </div>
        </label>
      </div>

      <div>
        <h1 className="text-xl font-extrabold">Cotizador</h1>
        <p className="text-[13px] text-[var(--text-secondary)]">
          Cotizador, comparador y plan de mantenimiento — {marcas.filter((m) => m.esVehiculos).map((m) => m.nombre).join(" / ")}
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-[var(--border)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative px-3.5 py-2.5 text-[13px] font-semibold transition-colors
                        ${tab === t.id ? "text-[var(--brand)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full" style={{ background: "var(--brand)" }} />
            )}
          </button>
        ))}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        {tab === "cotizador" && <CotizadorTab seleccion={seleccion} setSeleccion={setSeleccion} adj={adj} />}
        {tab === "comparador" && <ComparadorTab adj={adj} />}
        {tab === "versus" && <VersusTab adj={adj} />}
        {tab === "plan" && <PlanServiciosTab adj={adj} onVerPlan={irACotizador} />}
        {tab === "checklist" && <ChecklistTab />}
        {tab === "buscar" && <BuscarTab />}
        {tab === "historial" && <HistorialTab onCargar={irACotizador} />}
      </div>
    </div>
  );
}
