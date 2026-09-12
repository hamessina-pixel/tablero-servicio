"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { money } from "@/lib/format";
import type { Fluido } from "@/domain/types";

export default function FluidosPage() {
  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState("");
  const [items, setItems] = useState<Fluido[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);

  useEffect(() => {
    api.fluidos.listar({ q: q || undefined, categoria: categoria || undefined }).then((r) => {
      setItems(r.items);
      setCategorias((prev) => (prev.length ? prev : r.categorias));
    });
  }, [q, categoria]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-extrabold">Fluidos</h1>
        <p className="text-[13px] text-[var(--text-secondary)]">Catálogo de fluidos y lubricantes, con precios de referencia.</p>
      </div>

      <Card>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Buscar por código o descripción…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="max-w-[220px]">
            <option value="">Todas las categorías</option>
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
      </Card>

      <Card className="!p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-4 py-3 font-semibold">Código marca</th>
                <th className="px-2 py-3 font-semibold">Código PUMA</th>
                <th className="px-2 py-3 font-semibold">Descripción</th>
                <th className="px-2 py-3 font-semibold">Categoría</th>
                <th className="px-2 py-3 font-semibold">Uso / Aplicación</th>
                <th className="px-2 py-3 font-semibold">Presentación</th>
                <th className="px-2 py-3 text-right font-semibold">Precio concesionario</th>
                <th className="px-2 py-3 text-right font-semibold">Precio público</th>
                <th className="px-4 py-3 text-right font-semibold">$ / litro</th>
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]">
                  <td className="px-4 py-2.5 font-mono">{f.codigoMarca}</td>
                  <td className="px-2 py-2.5 font-mono text-[var(--text-muted)]">{f.codigoPuma}</td>
                  <td className="px-2 py-2.5">{f.nombre}</td>
                  <td className="px-2 py-2.5 text-[var(--text-muted)]">{f.categoria}</td>
                  <td className="px-2 py-2.5">{f.usoAplicacion}</td>
                  <td className="px-2 py-2.5">{f.presentacion}</td>
                  <td className="px-2 py-2.5 text-right">{money(f.precioConcesionario)}</td>
                  <td className="px-2 py-2.5 text-right">{money(f.precioPublico)}</td>
                  <td className="px-4 py-2.5 text-right">{money(f.precioLitro)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-[var(--text-muted)]">Sin resultados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
