"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/apiClient";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import type { Sustitucion } from "@/domain/types";

const CLASES: Record<string, string> = { S: "Sustitución", A: "Alternativa" };

export default function SustitucionesPage() {
  return (
    <Suspense>
      <SustitucionesPageInner />
    </Suspense>
  );
}

function SustitucionesPageInner() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [marcaId, setMarcaId] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<(Sustitucion & { marcaNombre: string | null })[]>([]);
  const [total, setTotal] = useState(0);
  const [porMarca, setPorMarca] = useState<{ marcaId: number | null; nombre: string; total: number }[]>([]);
  const pageSize = 30;

  useEffect(() => { api.sustituciones.marcas().then(setPorMarca); }, []);
  useEffect(() => {
    api.sustituciones.listar({ q: q || undefined, marcaId, page, pageSize }).then((r) => {
      setItems(r.items); setTotal(r.total);
    });
  }, [q, marcaId, page]);
  useEffect(() => setPage(1), [q, marcaId]);

  const totalPaginas = Math.max(Math.ceil(total / pageSize), 1);
  const totalGeneral = porMarca.reduce((a, m) => a + m.total, 0);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-extrabold">Sustituciones</h1>
        <p className="text-[13px] text-[var(--text-secondary)]">
          {totalGeneral.toLocaleString("es-AR")} equivalencias — {porMarca.map((m) => `${m.nombre}: ${m.total.toLocaleString("es-AR")}`).join(" · ")}
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Buscar código anterior o nuevo…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Select value={marcaId ?? ""} onChange={(e) => setMarcaId(Number(e.target.value) || undefined)} className="max-w-[220px]">
            <option value="">Todas las marcas</option>
            {porMarca.map((m) => <option key={m.marcaId ?? "sin"} value={m.marcaId ?? ""}>{m.nombre} ({m.total})</option>)}
          </Select>
        </div>
      </Card>

      <Card className="!p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-4 py-3 font-semibold">Marca</th>
                <th className="px-2 py-3 font-semibold">Código anterior</th>
                <th className="px-2 py-3 font-semibold">Código nuevo</th>
                <th className="px-2 py-3 font-semibold">Clase</th>
                <th className="px-2 py-3 text-right font-semibold">Cant. mínima</th>
                <th className="px-4 py-3 font-semibold">Vigencia</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]">
                  <td className="px-4 py-2.5">{s.marcaNombre}</td>
                  <td className="px-2 py-2.5 font-mono">{s.codigoAnterior}</td>
                  <td className="px-2 py-2.5 font-mono">{s.codigoNuevo}</td>
                  <td className="px-2 py-2.5">
                    {s.clase ? <Badge tono="accent">{CLASES[s.clase] ?? s.clase}</Badge> : <span className="text-[var(--text-muted)]">—</span>}
                  </td>
                  <td className="px-2 py-2.5 text-right">{s.cantidadMinima ?? "—"}</td>
                  <td className="px-4 py-2.5 text-[var(--text-muted)]">{s.fechaVigencia}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">Sin resultados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3 text-[12.5px] text-[var(--text-muted)]">
          <span>{total.toLocaleString("es-AR")} resultados</span>
          <div className="flex items-center gap-2">
            <Button tamano="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <span>Página {page} de {totalPaginas}</span>
            <Button tamano="sm" disabled={page >= totalPaginas} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
