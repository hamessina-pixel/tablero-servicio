"use client";

import { useEffect, useRef, useState } from "react";
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
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [precioPublico, setPrecioPublico] = useState("");
  const [precioCosto, setPrecioCosto] = useState("");
  const [stockActual, setStockActual] = useState("");
  const [stockMinimo, setStockMinimo] = useState("");
  const [gestionado, setGestionado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarSustitucion, setMostrarSustitucion] = useState(false);
  const [codigoNuevoFiat, setCodigoNuevoFiat] = useState("");
  const [precioPublicoFiat, setPrecioPublicoFiat] = useState("");
  const [precioCostoFiat, setPrecioCostoFiat] = useState("");
  const [aplicandoSustitucion, setAplicandoSustitucion] = useState(false);

  useEffect(() => {
    api.repuestos.obtener(repuestoId).then((d) => {
      const det = d as RepuestoDetalle;
      setDetalle(det);
      setCodigo(det.codigo);
      setNombre(det.nombre ?? "");
      setPrecioPublico(det.precioPublico?.toString() ?? "");
      setPrecioCosto(det.precioCosto?.toString() ?? "");
      setStockActual(det.stockActual?.toString() ?? "0");
      setStockMinimo(det.stockMinimo?.toString() ?? "0");
      setGestionado(det.esStockGestionado);
    });
  }, [repuestoId]);

  const puedePrecios = !usuario || puede("precios:editar");
  const puedeStock = !usuario || puede("stock:editar");
  const puedeCatalogo = !usuario || puede("repuestos:crear");

  async function guardar() {
    const entro = await requireAuth();
    if (!entro) return;
    const cambios: Record<string, unknown> = {};
    if (puede("repuestos:crear")) {
      if (!codigo.trim()) { toast("El código no puede quedar vacío", "error"); return; }
      cambios.codigo = codigo.trim();
      cambios.nombre = nombre.trim() || null;
    }
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
      if (puede("stock:editar") && gestionado) {
        const actual = Number(stockActual) || 0;
        const minimo = Number(stockMinimo) || 0;
        if (actual < minimo && confirm(`Este repuesto quedó con stock bajo (${actual}/${minimo}). ¿Agregarlo a la lista de compra?`)) {
          await api.pedidos.agregarAListaCompra(repuestoId).catch(() => {});
        }
      }
      onGuardado();
      onCerrar();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No se pudo guardar", "error");
    } finally {
      setGuardando(false);
    }
  }

  async function aplicarSustitucion() {
    const entro = await requireAuth();
    if (!entro) return;
    if (!codigoNuevoFiat.trim()) { toast("Ingresá el código nuevo informado por Fiat", "error"); return; }
    setAplicandoSustitucion(true);
    try {
      await api.repuestos.registrarSustitucion(repuestoId, {
        codigoNuevo: codigoNuevoFiat.trim(),
        precioPublico: precioPublicoFiat ? Number(precioPublicoFiat) : undefined,
        precioCosto: precioCostoFiat ? Number(precioCostoFiat) : undefined,
      });
      toast("Sustitución registrada", "success");
      onGuardado();
      onCerrar();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No se pudo registrar la sustitución", "error");
    } finally {
      setAplicandoSustitucion(false);
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
            <p className="text-[12.5px] text-[var(--text-muted)]">{detalle.marcaNombre}</p>
          </div>
          <button onClick={onCerrar} className="rounded-full p-1 text-xl leading-none text-[var(--text-muted)] hover:bg-[var(--surface-2)]">&times;</button>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <Campo label="Código">
            <Input className="font-mono" value={codigo} onChange={(e) => setCodigo(e.target.value)} disabled={!puedeCatalogo} />
          </Campo>
          <Campo label="Nombre">
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={!puedeCatalogo} />
          </Campo>
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
        {usuario && !puedePrecios && !puedeStock && !puedeCatalogo && (
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

        {puedeCatalogo && (
          <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--border)] p-3">
            {!mostrarSustitucion ? (
              <button
                className="text-[12.5px] font-semibold text-[var(--brand)] hover:underline"
                onClick={() => { setCodigoNuevoFiat(""); setPrecioPublicoFiat(""); setPrecioCostoFiat(""); setMostrarSustitucion(true); }}
              >
                Registrar sustitución (verificada en Fiat LinkEntry)
              </button>
            ) : (
              <>
                <p className="mb-2 text-[12.5px] font-bold">Sustitución verificada en Fiat LinkEntry</p>
                <LinkEntryAtajo codigo={detalle.codigo} />
                <p className="mb-2 text-[12px] text-[var(--text-muted)]">
                  Reemplaza el código <span className="font-mono">{detalle.codigo}</span> por el nuevo número informado
                  por la terminal, actualiza sus precios y deja la equivalencia asentada para futuras búsquedas.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Campo label="Código nuevo (Fiat)">
                    <Input className="font-mono" value={codigoNuevoFiat} onChange={(e) => setCodigoNuevoFiat(e.target.value)} />
                  </Campo>
                  <div />
                  <Campo label="Precio público nuevo">
                    <Input type="number" value={precioPublicoFiat} onChange={(e) => setPrecioPublicoFiat(e.target.value)} disabled={!puedePrecios} />
                  </Campo>
                  <Campo label="Precio costo nuevo">
                    <Input type="number" value={precioCostoFiat} onChange={(e) => setPrecioCostoFiat(e.target.value)} disabled={!puedePrecios} />
                  </Campo>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button tamano="sm" onClick={() => setMostrarSustitucion(false)}>Cancelar</Button>
                  <Button tamano="sm" variante="primary" onClick={aplicarSustitucion} disabled={aplicandoSustitucion}>
                    Aplicar sustitución
                  </Button>
                </div>
              </>
            )}
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

const URL_LINKENTRY = "https://linkentry-ames.fiat.com/appl/NSC/index.php?module=partsinquiry";

/** Abre la consulta de piezas de la terminal y deja el código a mano para
 *  pegarlo allá: el portal pide login propio, así que no se puede consultar
 *  desde acá — esto ahorra el ida y vuelta de buscar la pantalla y tipear. */
function LinkEntryAtajo({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);
  const campo = useRef<HTMLInputElement>(null);

  async function copiar() {
    // Donde el portapapeles está bloqueado (visores embebidos, http sin TLS)
    // queda al menos el código seleccionado para copiarlo con el teclado.
    campo.current?.select();
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* queda seleccionado: Ctrl+C */
    }
  }

  return (
    <div className="mb-2 flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={URL_LINKENTRY}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-2.5 py-1 text-[12px]
                     font-semibold text-[var(--brand)] hover:bg-[var(--surface-2)]"
        >
          Abrir Fiat LinkEntry ↗
        </a>
        <input
          ref={campo}
          readOnly
          value={codigo}
          onFocus={(e) => e.target.select()}
          className="w-[150px] rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)]
                     px-2 py-1 font-mono text-[12px] text-[var(--text-primary)]"
        />
        <button
          onClick={copiar}
          className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-2.5 py-1 text-[12px] hover:bg-[var(--surface-2)]"
        >
          {copiado ? "¡Copiado!" : "Copiar"}
        </button>
      </div>
      <span className="text-[11.5px] text-[var(--text-muted)]">
        Entrá con tu usuario y clave, pegá el código en “Nro. Pieza” y tocá el ícono de flechas para ver si hay reemplazo.
        Si el portal te deja en la portada: <strong>POSTVENTA → Repuestos → Consulta de Repuestos</strong>.
      </span>
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
