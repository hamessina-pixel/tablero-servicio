"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/apiClient";
import { useMarcas } from "@/components/MarcasProvider";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { InputBusqueda } from "@/components/ui/InputBusqueda";
import { money } from "@/lib/format";

interface StockBajoItem {
  id: number; codigo: string; nombre: string | null; marcaId: number | null; marcaNombre: string | null;
  stockActual: number | null; stockMinimo: number | null; precioPublico: number | null;
}
interface PedidoResumen { id: number; fecha: string; nota: string | null; nItems: number; valorTotal: number; }
interface PedidoItem {
  codigo: string | null; nombre: string | null; marcaNombre: string | null;
  stockActual: number | null; stockMinimo: number | null; cantidadAPedir: number | null;
  precioUnitario: number | null; totalEstimado: number | null;
}

export default function PedidosPage() {
  return (
    <Suspense>
      <PedidosPageInner />
    </Suspense>
  );
}

function PedidosPageInner() {
  const searchParams = useSearchParams();
  const { marcas } = useMarcas();
  const { requirePermiso } = useAuth();
  const toast = useToast();
  const [marcaId, setMarcaId] = useState<number | undefined>(() => {
    const v = Number(searchParams.get("marcaId"));
    return v > 0 ? v : undefined;
  });
  const [stockBajo, setStockBajo] = useState<StockBajoItem[]>([]);
  const [qStockBajo, setQStockBajo] = useState("");
  const [listaCompra, setListaCompra] = useState<StockBajoItem[]>([]);
  const [pedidos, setPedidos] = useState<PedidoResumen[]>([]);
  const [generando, setGenerando] = useState(false);

  // Sin sesión no se lista qué falta ni a qué costo reponerlo: la pantalla
  // queda vacía en vez de romperse.
  function recargarStockBajo() {
    api.pedidos.stockBajo(marcaId).then((d) => setStockBajo(d as StockBajoItem[])).catch(() => setStockBajo([]));
  }
  function recargarListaCompra() { api.pedidos.listaCompra(marcaId).then((d) => setListaCompra(d as StockBajoItem[])); }
  function recargarPedidos() { api.pedidos.listar().then((d) => setPedidos(d as PedidoResumen[])); }

  useEffect(recargarStockBajo, [marcaId]);
  useEffect(recargarListaCompra, [marcaId]);
  useEffect(recargarPedidos, []);

  const idsEnLista = useMemo(() => new Set(listaCompra.map((r) => r.id)), [listaCompra]);

  const stockBajoFiltrado = useMemo(() => {
    const texto = qStockBajo.trim().toLowerCase();
    if (!texto) return stockBajo;
    return stockBajo.filter((r) =>
      r.codigo?.toLowerCase().includes(texto) || r.nombre?.toLowerCase().includes(texto),
    );
  }, [stockBajo, qStockBajo]);

  async function agregar(repuestoId: number) {
    if (!(await requirePermiso("pedidos:crear"))) return;
    try {
      await api.pedidos.agregarAListaCompra(repuestoId);
      recargarListaCompra();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No se pudo agregar a la lista", "error");
    }
  }

  async function quitar(repuestoId: number) {
    try {
      await api.pedidos.quitarDeListaCompra(repuestoId);
      recargarListaCompra();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No se pudo quitar de la lista", "error");
    }
  }

  async function generarPedido() {
    if (!(await requirePermiso("pedidos:crear"))) return;
    setGenerando(true);
    try {
      const pedido = await api.pedidos.crear({ marcaId }) as { id: number; items: PedidoItem[] };
      toast(`Pedido generado con ${pedido.items.length} ítems`, "success");
      await exportarExcel(pedido.id);
      recargarListaCompra();
      recargarPedidos();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No se pudo generar el pedido", "error");
    } finally {
      setGenerando(false);
    }
  }

  async function exportarExcel(pedidoId: number) {
    if (!(await requirePermiso("exportar:excel"))) return;
    const pedido = await api.pedidos.obtener(pedidoId) as { id: number; fecha: string; nota: string | null; items: PedidoItem[] };
    const XLSX = await import("xlsx");
    const filas = pedido.items.map((i) => ({
      Marca: i.marcaNombre, Código: i.codigo, Repuesto: i.nombre,
      "Stock actual": i.stockActual, "Stock mínimo": i.stockMinimo, "Cantidad a pedir": i.cantidadAPedir,
      "Precio unitario": i.precioUnitario, "Total estimado": i.totalEstimado,
    }));
    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedido");
    XLSX.writeFile(wb, `Pedido_compra_${pedido.id}.xlsx`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-extrabold">Pedidos de compra</h1>
        <p className="text-[13px] text-[var(--text-secondary)]">
          Armá la lista de compra agregando repuestos con stock bajo, y generá el pedido cuando esté lista.
        </p>
      </div>

      <Card>
        <div className="mb-2 flex items-center gap-2">
          <CardTitle>Lista de compra</CardTitle>
        </div>
        <p className="mb-3 text-[12px] text-[var(--text-muted)]">
          Arranca vacía. Se llena con los repuestos que agregues desde &quot;Stock bajo&quot; más abajo.
        </p>
        <div className="mb-3 flex items-center gap-2">
          <Select value={marcaId ?? ""} onChange={(e) => setMarcaId(Number(e.target.value) || undefined)} className="max-w-[220px]">
            <option value="">Todas las marcas</option>
            {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </Select>
          <Button variante="primary" className="ml-auto" disabled={!listaCompra.length || generando} onClick={generarPedido}>
            Generar pedido de compra (Excel)
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                <th className="py-2 pr-2 font-semibold">Marca</th>
                <th className="py-2 pr-2 font-semibold">Código</th>
                <th className="py-2 pr-2 font-semibold">Repuesto</th>
                <th className="py-2 pr-2 font-semibold">Stock</th>
                <th className="py-2 pr-2 text-right font-semibold">Faltan</th>
                <th className="py-2 pr-2 text-right font-semibold">Precio público</th>
                <th className="py-2 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {listaCompra.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2 pr-2">{r.marcaNombre}</td>
                  <td className="py-2 pr-2 font-mono">{r.codigo}</td>
                  <td className="py-2 pr-2">{r.nombre}</td>
                  <td className="py-2 pr-2"><Badge tono="critical">{r.stockActual} / {r.stockMinimo}</Badge></td>
                  <td className="py-2 pr-2 text-right">{(r.stockMinimo ?? 0) - (r.stockActual ?? 0)}</td>
                  <td className="py-2 pr-2 text-right">{r.precioPublico != null ? money(r.precioPublico) : "sin precio"}</td>
                  <td className="py-2 text-right"><Button tamano="sm" variante="danger" onClick={() => quitar(r.id)}>Quitar</Button></td>
                </tr>
              ))}
              {listaCompra.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-[var(--text-muted)]">Todavía no agregaste nada a la lista de compra.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardTitle>Stock bajo</CardTitle>
        <p className="mb-3 text-[12px] text-[var(--text-muted)]">Repuestos por debajo del mínimo. Agregalos a la lista de compra para incluirlos en el próximo pedido.</p>
        <div className="mb-3 flex items-center gap-2">
          <InputBusqueda
            value={qStockBajo}
            onChange={(e) => setQStockBajo(e.target.value)}
            onLimpiar={() => setQStockBajo("")}
            placeholder="Buscar por código o nombre…"
            className="w-full max-w-xs"
          />
          {qStockBajo.trim() && (
            <span className="text-[12px] text-[var(--text-muted)]">{stockBajoFiltrado.length} de {stockBajo.length}</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                <th className="py-2 pr-2 font-semibold">Marca</th>
                <th className="py-2 pr-2 font-semibold">Código</th>
                <th className="py-2 pr-2 font-semibold">Repuesto</th>
                <th className="py-2 pr-2 font-semibold">Stock</th>
                <th className="py-2 pr-2 text-right font-semibold">Faltan</th>
                <th className="py-2 pr-2 text-right font-semibold">Precio público</th>
                <th className="py-2 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {stockBajoFiltrado.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2 pr-2">{r.marcaNombre}</td>
                  <td className="py-2 pr-2 font-mono">{r.codigo}</td>
                  <td className="py-2 pr-2">{r.nombre}</td>
                  <td className="py-2 pr-2"><Badge tono="critical">{r.stockActual} / {r.stockMinimo}</Badge></td>
                  <td className="py-2 pr-2 text-right">{(r.stockMinimo ?? 0) - (r.stockActual ?? 0)}</td>
                  <td className="py-2 pr-2 text-right">{r.precioPublico != null ? money(r.precioPublico) : "sin precio"}</td>
                  <td className="py-2 text-right">
                    {idsEnLista.has(r.id)
                      ? <Badge tono="good">En la lista</Badge>
                      : <Button tamano="sm" onClick={() => agregar(r.id)}>Agregar a la lista</Button>}
                  </td>
                </tr>
              ))}
              {stockBajoFiltrado.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-[var(--text-muted)]">
                  {qStockBajo.trim() ? "Ningún repuesto coincide con esa búsqueda." : "Sin códigos con stock bajo."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardTitle>Pedidos generados</CardTitle>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                <th className="py-2 pr-2 font-semibold">Fecha</th>
                <th className="py-2 pr-2 font-semibold">Nota</th>
                <th className="py-2 pr-2 text-right font-semibold">Ítems</th>
                <th className="py-2 pr-2 text-right font-semibold">Valor estimado</th>
                <th className="py-2 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2 pr-2">{p.fecha}</td>
                  <td className="py-2 pr-2">{p.nota}</td>
                  <td className="py-2 pr-2 text-right">{p.nItems}</td>
                  <td className="py-2 pr-2 text-right">{money(p.valorTotal)}</td>
                  <td className="py-2 text-right"><Button tamano="sm" onClick={() => exportarExcel(p.id)}>Descargar Excel</Button></td>
                </tr>
              ))}
              {pedidos.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-[var(--text-muted)]">Todavía no se generó ningún pedido.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
