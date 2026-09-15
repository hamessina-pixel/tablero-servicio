"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/apiClient";
import { useMarcas } from "@/components/MarcasProvider";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { Card } from "@/components/ui/Card";
import { Paginacion } from "@/components/ui/Paginacion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { InputBusqueda } from "@/components/ui/InputBusqueda";
import { money } from "@/lib/format";
import { RepuestoModal, CrearRepuestoModal } from "@/components/repuestos/RepuestoModal";
import { ImportarPreciosModal } from "@/components/repuestos/ImportarPreciosModal";
import { PreciosModal } from "@/components/repuestos/PreciosModal";
import type { Repuesto } from "@/domain/types";

const CATEGORIAS = [
  { value: "", label: "Todos" },
  { value: "stock", label: "Con control de stock" },
  { value: "plan", label: "Usados en planes" },
  { value: "catalogo", label: "Catálogo de precios" },
  { value: "multimarca", label: "Multimarca / línea ETMAN" },
  { value: "accesorio", label: "Accesorios" },
  { value: "manual", label: "Cargados a mano" },
];

function StockBadge({ r }: { r: Repuesto }) {
  if (!r.esStockGestionado) return <Badge tono="neutral">no gestionado</Badge>;
  if (r.stockFicticio) return <Badge tono="warning" title="Stock de prueba: no es el conteo real del depósito">{r.stockActual} · prueba</Badge>;
  const bajo = (r.stockActual ?? 0) < (r.stockMinimo ?? 0);
  return <Badge tono={bajo ? "critical" : "good"} dot>{r.stockActual} / {r.stockMinimo}</Badge>;
}

export default function RepuestosPage() {
  return (
    <Suspense>
      <RepuestosPageInner />
    </Suspense>
  );
}

function RepuestosPageInner() {
  const searchParams = useSearchParams();
  const { marcas } = useMarcas();
  const { requirePermiso } = useAuth();
  const toast = useToast();

  const [marcaId, setMarcaId] = useState<number | undefined>();
  const [categoria, setCategoria] = useState("");
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [stockBajo, setStockBajo] = useState(searchParams.get("stockBajo") === "1");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<(Repuesto & { marcaNombre: string | null })[]>([]);
  const [total, setTotal] = useState(0);
  const [conteos, setConteos] = useState<Record<string, number>>({});
  const [abiertoId, setAbiertoId] = useState<number | null>(null);
  const [crear, setCrear] = useState(false);
  const [importarPrecios, setImportarPrecios] = useState(false);
  const [preciosId, setPreciosId] = useState<number | null>(null);

  const pageSize = 25;

  function recargar() {
    api.repuestos.listar({ marcaId, categoria: categoria || undefined, q: q || undefined, stockBajo, page, pageSize })
      .then((r) => { setItems(r.items); setTotal(r.total); });
  }

  useEffect(recargar, [marcaId, categoria, q, stockBajo, page]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { api.repuestos.conteoCategorias(marcaId).then(setConteos); }, [marcaId]);
  useEffect(() => setPage(1), [marcaId, categoria, q, stockBajo]);

  async function abrirCrear() {
    if (!(await requirePermiso("repuestos:crear"))) return;
    setCrear(true);
  }

  async function abrirImportarPrecios() {
    if (!(await requirePermiso("precios:editar"))) return;
    setImportarPrecios(true);
  }

  const totalPaginas = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-extrabold">Repuestos & Stock</h1>
        <p className="text-[13px] text-[var(--text-secondary)]">Catálogo de todas las marcas y control de stock gestionado.</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <InputBusqueda
            placeholder="Buscar por código o nombre…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onLimpiar={() => setQ("")}
            className="w-full max-w-xs"
          />
          <Select value={marcaId ?? ""} onChange={(e) => setMarcaId(Number(e.target.value) || undefined)} className="max-w-[160px]">
            <option value="">Todas las marcas</option>
            {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </Select>
          <Select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="max-w-[220px]">
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>{c.label} ({conteos[c.value] ?? 0})</option>
            ))}
          </Select>
          <label className="flex items-center gap-1.5 text-[12.5px] text-[var(--text-secondary)]">
            <input type="checkbox" checked={stockBajo} onChange={(e) => setStockBajo(e.target.checked)} />
            Stock bajo
          </label>
          <Button variante="success" className="ml-auto" onClick={abrirImportarPrecios}>Importar precios</Button>
          <Button variante="primary" onClick={abrirCrear}>+ Agregar a stock</Button>
        </div>
      </Card>

      <Card className="!p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-2 py-3 font-semibold">Nombre</th>
                <th className="px-2 py-3 font-semibold">Marca</th>
                <th className="px-2 py-3 font-semibold">Categoría</th>
                <th className="px-2 py-3 text-right font-semibold">Precio público</th>
                <th className="px-2 py-3 text-right font-semibold">Costo</th>
                <th className="px-2 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]">
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => setPreciosId(r.id)}
                      title="Ver precios con y sin IVA"
                      className="font-mono font-semibold text-[var(--brand)] hover:underline"
                    >
                      {r.codigo}
                    </button>
                  </td>
                  <td className="px-2 py-2.5">{r.nombre}</td>
                  <td className="px-2 py-2.5">{r.marcaNombre}</td>
                  <td className="px-2 py-2.5 text-[var(--text-muted)]">{r.categoria}</td>
                  <td className="px-2 py-2.5 text-right">{money(r.precioPublico)}</td>
                  <td className="px-2 py-2.5 text-right">{money(r.precioCosto)}</td>
                  <td className="px-2 py-2.5"><StockBadge r={r} /></td>
                  <td className="px-4 py-2.5 text-right">
                    <Button tamano="sm" onClick={() => setAbiertoId(r.id)}>Ver / editar</Button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[var(--text-muted)]">
                  Ningún repuesto coincide con estos filtros.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--border)] px-4 py-3">
          <Paginacion page={page} totalPaginas={totalPaginas} onCambiar={setPage} totalItems={total} />
        </div>
      </Card>

      {abiertoId != null && (
        <RepuestoModal repuestoId={abiertoId} marcas={marcas} onCerrar={() => setAbiertoId(null)} onGuardado={recargar} />
      )}
      {crear && <CrearRepuestoModal marcas={marcas} onCerrar={() => setCrear(false)} onCreado={recargar} />}
      {importarPrecios && (
        <ImportarPreciosModal marcas={marcas} onCerrar={() => setImportarPrecios(false)} onImportado={recargar} />
      )}
      {preciosId != null && <PreciosModal repuestoId={preciosId} onCerrar={() => setPreciosId(null)} />}
    </div>
  );
}
