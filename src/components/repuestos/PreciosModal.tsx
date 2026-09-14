"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/components/AuthProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { money } from "@/lib/format";

/** Los precios del catálogo se guardan SIN IVA: el cotizador les suma este
 *  21% para mostrar el total al cliente (verificable comparando el precio
 *  público de una pieza contra el precio unitario del mismo código en un plan:
 *  la relación es exactamente 1,21). */
const IVA = 0.21;

interface DetalleRepuesto {
  id: number; codigo: string; nombre: string | null; marcaNombre: string | null;
  categoria: string | null; precioPublico: number | null; precioCosto: number | null;
  descuentoPct: number | null; fechaLista: string | null; fuente: string | null;
  esStockGestionado: boolean; stockActual: number | null; stockMinimo: number | null;
  stockFicticio: boolean;
  usadoEnPlanes: { marca: string; modelo: string; kmIntervalo: number; cantidad: number }[];
  equivalentes: { codigo: string; nombre: string | null; marcaNombre: string | null; esStockGestionado: boolean; stockActual: number | null }[];
}

export function PreciosModal({ repuestoId, onCerrar }: { repuestoId: number; onCerrar: () => void }) {
  const { usuario } = useAuth();
  const [d, setD] = useState<DetalleRepuesto | null>(null);

  // Se vuelve a pedir si cambia la sesión: el costo no viaja sin ella, así que
  // alguien que abre esta ventana, entra con su usuario y la abre de nuevo
  // tiene que ver los precios completos y no los guiones de la vez anterior.
  useEffect(() => {
    api.repuestos.obtener(repuestoId).then((r) => setD(r as DetalleRepuesto));
  }, [repuestoId, usuario?.id]);

  if (!d) return null;

  const costo = d.precioCosto;
  const publico = d.precioPublico;
  const conIva = (v: number | null) => (v == null ? null : v * (1 + IVA));
  const margen = costo != null && publico != null ? publico - costo : null;
  const margenPct = costo && publico != null && costo > 0 ? ((publico - costo) / costo) * 100 : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[3px]"
         onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="max-h-[88vh] w-full max-w-[560px] overflow-y-auto rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-mono text-lg font-bold">{d.codigo}</h2>
            <p className="text-[13px]">{d.nombre}</p>
            <p className="text-[12px] text-[var(--text-muted)]">
              {d.marcaNombre}{d.categoria ? ` · ${d.categoria}` : ""}
            </p>
          </div>
          <button onClick={onCerrar} className="rounded-full p-1 text-xl leading-none text-[var(--text-muted)] hover:bg-[var(--surface-2)]">&times;</button>
        </div>

        {!usuario && (
          <p className="mb-3 rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-2.5 text-[12px] text-[var(--text-secondary)]">
            Iniciá sesión para ver el costo y el margen.
          </p>
        )}

        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
              <th className="py-2 text-left font-semibold" />
              <th className="py-2 text-right font-semibold">Costo</th>
              <th className="py-2 text-right font-semibold">Público</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[var(--border)]">
              <td className="py-2 text-[var(--text-secondary)]">Sin IVA</td>
              <td className="py-2 text-right font-semibold">{costo != null ? money(costo) : "—"}</td>
              <td className="py-2 text-right font-semibold">{publico != null ? money(publico) : "—"}</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="py-2 text-[var(--text-secondary)]">IVA ({Math.round(IVA * 100)}%)</td>
              <td className="py-2 text-right text-[var(--text-muted)]">{costo != null ? money(costo * IVA) : "—"}</td>
              <td className="py-2 text-right text-[var(--text-muted)]">{publico != null ? money(publico * IVA) : "—"}</td>
            </tr>
            <tr>
              <td className="py-2 font-semibold">Con IVA</td>
              <td className="py-2 text-right text-[15px] font-extrabold">{costo != null ? money(conIva(costo)) : "—"}</td>
              <td className="py-2 text-right text-[15px] font-extrabold text-[var(--brand)]">
                {publico != null ? money(conIva(publico)) : "—"}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 flex flex-col gap-1.5 text-[12.5px]">
          {d.descuentoPct != null && d.descuentoPct > 0 && (
            <Linea label="Descuento de concesionario" valor={`${(d.descuentoPct * 100).toFixed(1).replace(".", ",")} %`} />
          )}
          {margen != null && (
            <Linea
              label="Margen sobre el costo"
              valor={`${money(margen)}${margenPct != null ? ` · ${margenPct.toFixed(1).replace(".", ",")} %` : ""}`}
              tono={margen < 0 ? "alerta" : undefined}
            />
          )}
          {margen != null && margen < 0 && (
            <p className="text-[11.5px] text-[var(--status-critical)]">
              El precio de lista quedó por debajo del costo de reposición: revisá cuál de los dos está desactualizado.
            </p>
          )}
          <Linea
            label="Stock"
            valor={
              d.esStockGestionado
                ? `${d.stockActual ?? 0} en depósito · mínimo ${d.stockMinimo ?? 0}${d.stockFicticio ? " (unidades de prueba)" : ""}`
                : "sin control de stock"
            }
          />
          {d.esStockGestionado && costo != null && (d.stockActual ?? 0) > 0 && (
            <Linea label="Valorización del stock" valor={`${money((d.stockActual ?? 0) * costo)} (a costo, sin IVA)`} />
          )}
          {d.fechaLista && <Linea label="Fecha de lista" valor={d.fechaLista} />}
          {d.fuente && <Linea label="Origen del dato" valor={d.fuente} />}
        </div>

        {d.usadoEnPlanes.length > 0 && (
          <div className="mt-4">
            <p className="mb-1 text-[12.5px] font-bold">Se usa en {d.usadoEnPlanes.length} servicio{d.usadoEnPlanes.length > 1 ? "s" : ""}</p>
            <div className="text-[12px] text-[var(--text-muted)]">
              {d.usadoEnPlanes.slice(0, 6).map((p, i) => (
                <div key={i}>{p.marca} {p.modelo} · {Math.round(p.kmIntervalo / 1000)}.000 km (x{p.cantidad})</div>
              ))}
              {d.usadoEnPlanes.length > 6 && <div>y {d.usadoEnPlanes.length - 6} más…</div>}
            </div>
          </div>
        )}

        {d.equivalentes.filter((e) => e.marcaNombre).length > 0 && (
          <div className="mt-4">
            <p className="mb-1 text-[12.5px] font-bold">Códigos equivalentes</p>
            <table className="w-full text-[12px]">
              <tbody>
                {d.equivalentes.filter((e) => e.marcaNombre).map((e, i) => (
                  <tr key={i}>
                    <td className="py-0.5 pr-2 font-mono">{e.codigo}</td>
                    <td className="py-0.5 pr-2">{e.marcaNombre}</td>
                    <td className="py-0.5">
                      {e.esStockGestionado
                        ? <Badge tono={(e.stockActual || 0) > 0 ? "good" : "critical"}>{e.stockActual} en stock</Badge>
                        : <Badge tono="neutral">sin datos</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={onCerrar}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
}

function Linea({ label, valor, tono }: { label: string; valor: string; tono?: "alerta" }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] py-1 last:border-0">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className={`font-semibold ${tono === "alerta" ? "text-[var(--status-critical)]" : ""}`}>{valor}</span>
    </div>
  );
}
