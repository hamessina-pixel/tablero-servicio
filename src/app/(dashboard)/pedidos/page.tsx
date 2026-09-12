"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { useMarcas } from "@/components/MarcasProvider";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { money } from "@/lib/format";

interface StockBajoItem {
  id: number; codigo: string; nombre: string | null; marcaNombre: string | null;
  stockActual: number | null; stockMinimo: number | null; precioPublico: number | null;
}
interface PedidoResumen { id: number; fecha: string; nota: string | null; nItems: number; valorTotal: number; }
interface PedidoItem {
  codigo: string | null; nombre: string | null; marcaNombre: string | null;
  stockActual: number | null; stockMinimo: number | null; cantidadAPedir: number | null;
  precioUnitario: number | null; totalEstimado: number | null;
}

export default function PedidosPage() {
  const { marcas } = useMarcas();
  const { requirePermiso } = useAuth();
  const toast = useToast();
  const [marcaId, setMarcaId] = useState<number | undefined>();
  const [stockBajo, setStockBajo] = useState<StockBajoItem[]>([]);
  const [pedidos, setPedidos] = useState<PedidoResumen[]>([]);
  const [generando, setGenerando] = useState(false);

  function recargarStockBajo() { api.pedidos.stockBajo(marcaId).then((d) => setStockBajo(d as StockBajoItem[])); }
  function recargarPedidos() { api.pedidos.listar().then((d) => setPedidos(d as PedidoResumen[])); }

  useEffect(recargarStockBajo, [marcaId]);
  useEffect(recargarPedidos, []);

  async function generarPedido() {
    if (!(await requirePermiso("pedidos:crear"))) return;
    setGenerando(true);
    try {
      const pedido = await api.pedidos.crear({ marcaId }) as { id: number; items: PedidoItem[] };
      toast(`Pedido generado con ${pedido.items.length} ítems`, "success");
      await exportarExcel(pedido.id);
      recargarStockBajo();
      recargarPedidos();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No se pudo generar el pedido", "error");
    } finally {
      setGenerando(false);
    }
  }

  async function exportarExcel(pedidoId: number) {
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
        <p className="text-[13px] text-[var(--text-secondary)]">Repuestos con stock por debajo del mínimo, listos para generar un pedido.</p>
      </div>

      <Card>
        <CardTitle>Stock bajo</CardTitle>
        <div className="mb-3 mt-2 flex items-center gap-2">
          <Select value={marcaId ?? ""} onChange={(e) => setMarcaId(Number(e.target.value) || undefined)} className="max-w-[220px]">
            <option value="">Todas las marcas</option>
            {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </Select>
          <Button variante="primary" className="ml-auto" disabled={!stockBajo.length || generando} onClick={generarPedido}>
            Generar pedido de compra (Excel)
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                <th className="py-2 pr-2 font-semibold">Marca</th>
                <th className="py-2 pr-2 font-semibold">Código</th>
                <th className="py-2 pr-2 font-semibold">Repuesto</th>
                <th className="py-2 pr-2 font-semibold">Stock</th>
                <th className="py-2 pr-2 text-right font-semibold">Faltan</th>
                <th className="py-2 text-right font-semibold">Precio público</th>
              </tr>
            </thead>
            <tbody>
              {stockBajo.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2 pr-2">{r.marcaNombre}</td>
                  <td className="py-2 pr-2 font-mono">{r.codigo}</td>
                  <td className="py-2 pr-2">{r.nombre}</td>
                  <td className="py-2 pr-2"><Badge tono="critical">{r.stockActual} / {r.stockMinimo}</Badge></td>
                  <td className="py-2 pr-2 text-right">{(r.stockMinimo ?? 0) - (r.stockActual ?? 0)}</td>
                  <td className="py-2 text-right">{r.precioPublico != null ? money(r.precioPublico) : "sin precio"}</td>
                </tr>
              ))}
              {stockBajo.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-[var(--text-muted)]">Sin códigos con stock bajo.</td></tr>
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
