"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { money } from "@/lib/format";
import { HISTORIAL_KEY, type SeleccionCotizador } from "@/components/cotizador/CotizadorTab";

interface EntradaHistorial {
  marcaId: number; modeloId: number; planId: number;
  marca: string; modelo: string; km: number; fecha: string; total: number; pvp: number | null;
}

interface CotizacionGuardada {
  id: number; marcaId: number; modeloId: number; planId: number;
  marcaNombre: string; modeloNombre: string; km: number;
  patente: string | null; cliente: string | null; total: number; pvp: number | null; creadoEn: string;
}

export function HistorialTab({ onCargar }: { onCargar: (s: SeleccionCotizador) => void }) {
  const toast = useToast();
  const { requireAuth } = useAuth();
  const [historial, setHistorial] = useState<EntradaHistorial[]>([]);
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<CotizacionGuardada[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  const [patenteEdit, setPatenteEdit] = useState("");
  const [clienteEdit, setClienteEdit] = useState("");

  useEffect(() => {
    try { setHistorial(JSON.parse(localStorage.getItem(HISTORIAL_KEY) || "[]")); } catch { setHistorial([]); }
  }, []);

  function recargarBusqueda() {
    setBuscando(true);
    api.cotizacionesGuardadas.buscar(q || undefined).then(setResultados).finally(() => setBuscando(false));
  }

  useEffect(() => {
    setBuscando(true);
    const t = setTimeout(recargarBusqueda, 250);
    return () => clearTimeout(t);
  }, [q]);

  function vaciar() {
    if (!confirm("¿Vaciar el historial de este navegador? No se puede deshacer.")) return;
    localStorage.removeItem(HISTORIAL_KEY);
    setHistorial([]);
  }

  function borrarLocal(i: number) {
    const copia = historial.slice();
    copia.splice(i, 1);
    setHistorial(copia);
    localStorage.setItem(HISTORIAL_KEY, JSON.stringify(copia));
  }

  async function abrirEdicion(r: CotizacionGuardada) {
    // Editar y borrar tocan datos de clientes de todo el taller: piden sesión.
    if (!(await requireAuth())) return;
    setEditando(r.id);
    setPatenteEdit(r.patente ?? "");
    setClienteEdit(r.cliente ?? "");
  }

  async function guardarEdicion(id: number) {
    try {
      await api.cotizacionesGuardadas.actualizar(id, { patente: patenteEdit, cliente: clienteEdit });
      toast("Actualizado", "success");
      setEditando(null);
      recargarBusqueda();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No se pudo actualizar", "error");
    }
  }

  async function borrarGuardada(id: number) {
    if (!(await requireAuth())) return;
    if (!confirm("¿Borrar esta cotización guardada? No se puede deshacer.")) return;
    try {
      await api.cotizacionesGuardadas.eliminar(id);
      toast("Cotización borrada", "success");
      setResultados((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No se pudo borrar", "error");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-[13.5px] font-bold">Buscar por patente o cliente</p>
        <p className="mb-3 text-[12px] text-[var(--text-muted)]">
          Busca en todas las cotizaciones guardadas por cualquier usuario, no solo en este navegador.
        </p>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Patente (AB123CD) o nombre de cliente…"
          className="max-w-sm"
        />
        <div className="mt-3 flex flex-col gap-2">
          {buscando && <p className="text-[13px] text-[var(--text-muted)]">Buscando…</p>}
          {!buscando && resultados.length === 0 && (
            <p className="text-[13px] text-[var(--text-muted)]">
              {q.trim() ? "Sin resultados." : "Todavía no hay cotizaciones guardadas en el sistema."}
            </p>
          )}
          {!buscando && resultados.map((r) => (
            <div key={r.id} className="rounded-[var(--radius-md)] border border-[var(--border)] p-3 text-[13px]">
              {editando === r.id ? (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Input value={patenteEdit} onChange={(e) => setPatenteEdit(e.target.value)} placeholder="Patente" className="max-w-[140px]" />
                    <Input value={clienteEdit} onChange={(e) => setClienteEdit(e.target.value)} placeholder="Cliente" className="max-w-[220px]" />
                  </div>
                  <div className="flex gap-2">
                    <Button tamano="sm" onClick={() => setEditando(null)}>Cancelar</Button>
                    <Button tamano="sm" variante="primary" onClick={() => guardarEdicion(r.id)}>Guardar</Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {r.marcaNombre} {r.modeloNombre} · {Math.round(r.km / 1000)}.000 km
                      {r.patente && <span className="ml-2 rounded-[var(--radius-pill)] bg-[var(--surface-2)] px-2 py-0.5 font-mono text-[11.5px]">{r.patente}</span>}
                    </p>
                    <p className="text-[12px] text-[var(--text-muted)]">
                      {r.cliente ? `${r.cliente} · ` : ""}{r.creadoEn.slice(0, 10)} · Total {money(r.total)}{r.pvp != null && ` · PVP ${money(r.pvp)}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button tamano="sm" onClick={() => abrirEdicion(r)}>Editar</Button>
                    <Button tamano="sm" variante="danger" onClick={() => borrarGuardada(r.id)}>Borrar</Button>
                    <Button tamano="sm" variante="primary" onClick={() => onCargar({ marcaId: r.marcaId, modeloId: r.modeloId, planId: r.planId })}>Cargar</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--border)] pt-5">
        <p className="mb-2 text-[13.5px] font-bold">Guardado en este navegador</p>
        {!historial.length ? (
          <p className="text-[13px] text-[var(--text-muted)]">Todavía no guardaste ninguna cotización en este navegador.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {historial.map((h, i) => (
              <div key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] p-3 text-[13px]">
                <div>
                  <p className="font-semibold">{h.marca} {h.modelo} · {Math.round(h.km / 1000)}.000 km</p>
                  <p className="text-[12px] text-[var(--text-muted)]">{h.fecha} · Total {money(h.total)}{h.pvp != null && ` · PVP ${money(h.pvp)}`}</p>
                </div>
                <div className="flex gap-2">
                  <Button tamano="sm" variante="danger" onClick={() => borrarLocal(i)}>Borrar</Button>
                  <Button tamano="sm" variante="primary" onClick={() => onCargar({ marcaId: h.marcaId, modeloId: h.modeloId, planId: h.planId })}>Cargar</Button>
                </div>
              </div>
            ))}
            <Button variante="danger" className="self-start" onClick={vaciar}>Vaciar historial de este navegador</Button>
          </div>
        )}
      </div>
    </div>
  );
}
