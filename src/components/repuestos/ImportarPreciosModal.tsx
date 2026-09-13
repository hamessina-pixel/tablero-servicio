"use client";

import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import type { MarcaConConteos } from "@/repositories/marcas.repository";

interface FilaPrecio {
  codigo: string;
  precioPublico?: number | null;
  precioCosto?: number | null;
  descuentoPct?: number | null;
}

/** Reporte de ancho fijo que exporta el portal de la terminal (LinkEntry):
 *  | Material | Material Description | Mat Price | Material Discount |
 *  El precio es de lista y el descuento es el del concesionario, así que el
 *  costo real es precio * (1 - descuento/100) — que es como quedó cargado el
 *  catálogo en las importaciones anteriores. */
const RE_LINKENTRY = /^\|\s*(\S+)\s*\|(.{1,60}?)\|\s*([\d.,]+)\s*\|\s*([\d.,]*)-?\s*\|$/;

/** Número en formato argentino: 1.234.567,89 */
function numAr(s: string | undefined): number | undefined {
  if (!s || !s.trim()) return undefined;
  const n = Number(s.trim().replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

export function parsearLista(texto: string): { filas: FilaPrecio[]; formato: "linkentry" | "simple" } {
  const lineas = texto.split(/\r?\n/);

  const filasLink: FilaPrecio[] = [];
  for (const linea of lineas) {
    const m = RE_LINKENTRY.exec(linea);
    // El "*" es la fila de total general del reporte, no una pieza.
    if (!m || m[1] === "*") continue;
    const precioLista = numAr(m[3]);
    if (precioLista == null) continue;
    const descuento = numAr(m[4]) ?? 0;
    filasLink.push({
      codigo: m[1],
      // A centavos, como quedaron cargados los precios de las importaciones
      // anteriores — si no, la cola binaria del float hace que cada reimportación
      // parezca un cambio de precio.
      precioCosto: Math.round(precioLista * (1 - descuento / 100) * 100) / 100,
      descuentoPct: descuento / 100,
    });
  }
  if (filasLink.length) return { filas: filasLink, formato: "linkentry" };

  const simples: FilaPrecio[] = [];
  for (const linea of lineas) {
    if (!linea.trim()) continue;
    const [codigo, publico, costo] = linea.split(/[;,\t]+/).map((p) => p.trim());
    if (!codigo) continue;
    simples.push({ codigo, precioPublico: numAr(publico) ?? null, precioCosto: numAr(costo) ?? null });
  }
  return { filas: simples, formato: "simple" };
}

const TAM_LOTE = 1000;

export function ImportarPreciosModal({
  marcas, onCerrar, onImportado,
}: {
  marcas: MarcaConConteos[];
  onCerrar: () => void;
  onImportado: () => void;
}) {
  const toast = useToast();
  const inputArchivo = useRef<HTMLInputElement>(null);
  const [marcaId, setMarcaId] = useState<number | undefined>(marcas.find((m) => m.nombre === "FIAT")?.id ?? marcas[0]?.id);
  const [texto, setTexto] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [parseado, setParseado] = useState<{ filas: FilaPrecio[]; formato: string } | null>(null);
  const [progreso, setProgreso] = useState<{ hechas: number; total: number } | null>(null);
  const [resultado, setResultado] = useState<{ actualizados: number; sinCambios: number; noEncontrados: number } | null>(null);

  function analizar(contenido: string, origen: string) {
    const r = parsearLista(contenido);
    setParseado(r);
    setResultado(null);
    setNombreArchivo(origen);
    if (!r.filas.length) toast("No se reconoció ninguna fila con código y precio", "error");
  }

  async function elegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setTexto("");
    analizar(await archivo.text(), archivo.name);
  }

  async function importar() {
    if (!marcaId) { toast("Elegí una marca", "error"); return; }
    const filas = parseado?.filas ?? [];
    if (!filas.length) { toast("Cargá un archivo o pegá la lista primero", "error"); return; }

    const total = Math.ceil(filas.length / TAM_LOTE);
    setProgreso({ hechas: 0, total });
    const acumulado = { actualizados: 0, sinCambios: 0, noEncontrados: 0 };
    try {
      const origen = nombreArchivo || "pegado a mano";
      for (let i = 0; i < filas.length; i += TAM_LOTE) {
        const r = await api.repuestos.importarPrecios(marcaId, filas.slice(i, i + TAM_LOTE), origen);
        acumulado.actualizados += r.actualizados;
        acumulado.sinCambios += r.sinCambios;
        acumulado.noEncontrados += r.noEncontrados;
        setProgreso({ hechas: Math.floor(i / TAM_LOTE) + 1, total });
      }
      setResultado(acumulado);
      toast(`${acumulado.actualizados} precios actualizados`, "success");
      onImportado();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No se pudo importar", "error");
    } finally {
      setProgreso(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[3px]"
         onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="max-h-[88vh] w-full max-w-[580px] overflow-y-auto rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Importar precios</h2>
            <p className="text-[12.5px] text-[var(--text-muted)]">
              Subí la lista de precios oficial tal como la bajaste del portal de la terminal,
              o pegá una lista simple de código y precio.
            </p>
          </div>
          <button onClick={onCerrar} className="rounded-full p-1 text-xl leading-none text-[var(--text-muted)] hover:bg-[var(--surface-2)]">&times;</button>
        </div>

        <label className="mb-3 block text-[12px] font-semibold text-[var(--text-secondary)]">
          Marca
          <Select className="mt-1" value={marcaId ?? ""} onChange={(e) => setMarcaId(Number(e.target.value) || undefined)}>
            {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </Select>
        </label>

        <div className="mb-3">
          <input ref={inputArchivo} type="file" accept=".txt,.csv,text/plain" className="hidden" onChange={elegirArchivo} />
          <Button onClick={() => inputArchivo.current?.click()}>Elegir archivo…</Button>
          {nombreArchivo && <span className="ml-2 text-[12px] text-[var(--text-muted)]">{nombreArchivo}</span>}
        </div>

        <label className="block text-[12px] font-semibold text-[var(--text-secondary)]">
          …o pegá acá (código, precio público, precio costo)
          <textarea
            className="mt-1 h-28 w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)]
                       p-3 font-mono text-[12.5px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)]"
            placeholder={"916000021;145000;98000\n916000022;52000"}
            value={texto}
            onChange={(e) => { setTexto(e.target.value); analizar(e.target.value, ""); }}
          />
        </label>

        {parseado && parseado.filas.length > 0 && (
          <p className="mt-1 text-[12px] text-[var(--text-muted)]">
            {parseado.filas.length.toLocaleString("es-AR")} piezas reconocidas
            {parseado.formato === "linkentry" && " · formato de lista oficial (precio de lista y descuento de concesionario)"}
          </p>
        )}

        {progreso && (
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div className="h-full bg-[var(--brand)] transition-[width]"
                   style={{ width: `${Math.round((progreso.hechas / progreso.total) * 100)}%` }} />
            </div>
            <p className="mt-1 text-[12px] text-[var(--text-muted)]">
              Importando… lote {progreso.hechas} de {progreso.total}
            </p>
          </div>
        )}

        {resultado && (
          <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--border)] p-3 text-[12.5px]">
            <p><strong>{resultado.actualizados.toLocaleString("es-AR")}</strong> precios actualizados.</p>
            <p className="text-[var(--text-muted)]">
              {resultado.sinCambios.toLocaleString("es-AR")} ya estaban al día ·{" "}
              {resultado.noEncontrados.toLocaleString("es-AR")} códigos no están en esta marca.
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCerrar}>Cerrar</Button>
          <Button variante="primary" onClick={importar} disabled={!!progreso}>Importar</Button>
        </div>
      </div>
    </div>
  );
}
