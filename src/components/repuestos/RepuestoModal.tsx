"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import type { MarcaConConteos } from "@/repositories/marcas.repository";

interface RepuestoDetalle {
  id: number; codigo: string; nombre: string | null; marcaId: number | null; marcaNombre: string | null;
  categoria: string | null; precioPublico: number | null; precioCosto: number | null;
  esStockGestionado: boolean; stockActual: number | null; stockMinimo: number | null; stockFicticio: boolean;
  usadoEnPlanes: { marca: string; modelo: string; kmIntervalo: number; cantidad: number; precioUnitario: number | null }[];
  sustituciones: { codigoAnterior: string | null; codigoNuevo: string | null; clase: string | null }[];
  equivalentes: { codigo: string; nombre: string | null; marcaNombre: string | null; esStockGestionado: boolean; stockActual: number | null }[];
}

export function RepuestoModal({
  repuestoId, marcas, onCerrar, onGuardado,
}: {
  repuestoId: number;
  marcas: MarcaConConteos[];
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const { usuario, puede, requireAuth } = useAuth();
  const toast = useToast();
  const [detalle, setDetalle] = useState<RepuestoDetalle | null>(null);
  const [precioPublico, setPrecioPublico] = useState("");
  const [precioCosto, setPrecioCosto] = useState("");
  const [stockActual, setStockActual] = useState("");
  const [stockMinimo, setStockMinimo] = useState("");
  const [gestionado, setGestionado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.repuestos.obtener(repuestoId).then((d) => {
      const det = d as RepuestoDetalle;
      setDetalle(det);
      setPrecioPublico(det.precioPublico?.toString() ?? "");
      setPrecioCosto(det.precioCosto?.toString() ?? "");
      setStockActual(det.stockActual?.toString() ?? "0");
      setStockMinimo(det.stockMinimo?.toString() ?? "0");
      setGestionado(det.esStockGestionado);
    });
  }, [repuestoId]);

  const puedePrecios = !usuario || puede("precios:editar");
  const puedeStock = !usuario || puede("stock:editar");

  async function guardar() {
    const entro = await requireAuth();
    if (!entro) return;
    const cambios: Record<string, unknown> = {};
    if (puede("precios:editar")) {
      cambios.precioPublico = precioPublico ? Number(precioPublico) : null;
      cambios.precioCosto = precioCosto ? Number(precioCosto) : null;
    }
    if (puede("stock:editar")) {
      cambios.stockActual = Number(stockActual) || 0;
      cambios.stockMinimo = Number(stockMinimo) || 0;
      cambios.esStockGestionado = gestionado;
    }
    if (Object.keys(cambios).length === 0) {
      toast(`Tu nivel de acceso no permite editar este repuesto`, "error");
      return;
    }
    setGuardando(true);
    try {
      await api.repuestos.actualizar(repuestoId, cambios);
      toast("Repuesto actualizado", "success");
      onGuardado();
      onCerrar();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No se pudo guardar", "error");
    } finally {
      setGuardando(false);
    }
  }

  if (!detalle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[3px]"
         onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="max-h-[88vh] w-full max-w-[620px] overflow-y-auto rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{detalle.nombre || detalle.codigo}</h2>
            <p className="font-mono text-[12.5px] text-[var(--text-muted)]">{detalle.codigo} · {detalle.marcaNombre}</p>
          </div>
          <button onClick={onCerrar} className="rounded-full p-1 text-xl leading-none text-[var(--text-muted)] hover:bg-[var(--surface-2)]">&times;</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Precio público">
            <Input type="number" value={precioPublico} onChange={(e) => setPrecioPublico(e.target.value)} disabled={!puedePrecios} />
          </Campo>
          <Campo label="Precio costo">
            <Input type="number" value={precioCosto} onChange={(e) => setPrecioCosto(e.target.value)} disabled={!puedePrecios} />
          </Campo>
          <Campo label="Stock actual">
            <Input type="number" value={stockActual} onChange={(e) => setStockActual(e.target.value)} disabled={!puedeStock} />
          </Campo>
          <Campo label="Stock mínimo">
            <Input type="number" value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} disabled={!puedeStock} />
          </Campo>
        </div>
        <label className="mt-3 flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={gestionado} disabled={!puedeStock} onChange={(e) => setGestionado(e.target.checked)} />
          Controlar stock de este repuesto
        </label>
        {usuario && !puedePrecios && !puedeStock && (
          <p className="mt-2 text-[12px] text-[var(--status-warning)]">Tu nivel de acceso no permite editar este repuesto.</p>
        )}

        {detalle.usadoEnPlanes.length > 0 && (
          <div className="mt-5">
            <p className="mb-1.5 text-[12.5px] font-bold">Usado en planes de mantenimiento</p>
            <table className="w-full text-[12.5px]">
              <thead><tr className="text-left text-[var(--text-muted)]"><th>Marca</th><th>Modelo</th><th>Km</th><th className="text-right">Cant.</th></tr></thead>
              <tbody>
                {detalle.usadoEnPlanes.map((p, i) => (
                  <tr key={i}><td>{p.marca}</td><td>{p.modelo}</td><td>{Math.round(p.kmIntervalo / 1000)}k</td><td className="text-right">{p.cantidad}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {detalle.equivalentes.filter((e) => e.marcaNombre).length > 0 && (
          <div className="mt-5">
            <p className="mb-1.5 text-[12.5px] font-bold">Códigos equivalentes / sustitutos — stock disponible</p>
            <table className="w-full text-[12.5px]">
              <tbody>
                {detalle.equivalentes.filter((e) => e.marcaNombre).map((e, i) => (
                  <tr key={i}>
                    <td className="font-mono">{e.codigo}</td><td>{e.marcaNombre}</td>
                    <td>{e.esStockGestionado ? <Badge tono={(e.stockActual||0)>0?"good":"critical"}>{e.stockActual} en stock</Badge> : <Badge tono="neutral">sin datos</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button variante="primary" onClick={guardar} disabled={guardando}>Guardar</Button>
        </div>
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[12px] font-semibold text-[var(--text-secondary)]">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function CrearRepuestoModal({
  marcas, onCerrar, onCreado,
}: {
  marcas: MarcaConConteos[];
  onCerrar: () => void;
  onCreado: () => void;
}) {
  const toast = useToast();
  const [marcaId, setMarcaId] = useState<number | undefined>(marcas[0]?.id);
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [precioPublico, setPrecioPublico] = useState("");
  const [precioCosto, setPrecioCosto] = useState("");
  const [stockActual, setStockActual] = useState("0");
  const [stockMinimo, setStockMinimo] = useState("0");
  const [guardando, setGuardando] = useState(false);

  async function crear() {
    if (!marcaId || !codigo) { toast("Completá marca y código", "error"); return; }
    setGuardando(true);
    try {
      await api.repuestos.crear({
        marcaId, codigo, nombre: nombre || null,
        precioPublico: precioPublico ? Number(precioPublico) : null,
        precioCosto: precioCosto ? Number(precioCosto) : null,
        stockActual: Number(stockActual) || 0, stockMinimo: Number(stockMinimo) || 0,
      });
      toast("Repuesto creado", "success");
      onCreado();
      onCerrar();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No se pudo crear", "error");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[3px]"
         onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="w-full max-w-[480px] rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)]">
        <h2 className="mb-4 text-lg font-bold">Agregar a stock</h2>
        <div className="flex flex-col gap-3">
          <Campo label="Marca">
            <Select value={marcaId ?? ""} onChange={(e) => setMarcaId(Number(e.target.value) || undefined)}>
              {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </Select>
          </Campo>
          <Campo label="Código"><Input value={codigo} onChange={(e) => setCodigo(e.target.value)} /></Campo>
          <Campo label="Nombre"><Input value={nombre} onChange={(e) => setNombre(e.target.value)} /></Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Precio público"><Input type="number" value={precioPublico} onChange={(e) => setPrecioPublico(e.target.value)} /></Campo>
            <Campo label="Precio costo"><Input type="number" value={precioCosto} onChange={(e) => setPrecioCosto(e.target.value)} /></Campo>
            <Campo label="Stock actual"><Input type="number" value={stockActual} onChange={(e) => setStockActual(e.target.value)} /></Campo>
            <Campo label="Stock mínimo"><Input type="number" value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} /></Campo>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button variante="primary" onClick={crear} disabled={guardando}>Crear</Button>
        </div>
      </div>
    </div>
  );
}
