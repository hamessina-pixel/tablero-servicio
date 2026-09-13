"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import type { MarcaConConteos } from "@/repositories/marcas.repository";

interface FilaPrecio {
  codigo: string;
  precioPublico?: number | null;
  precioCosto?: number | null;
}

function parsearFilas(texto: string): FilaPrecio[] {
  return texto
    .split("\n")
    .map((linea) => linea.trim())
    .filter(Boolean)
    .map((linea) => {
      const partes = linea.split(/[;,\t]+/).map((p) => p.trim());
      const [codigo, precioPublico, precioCosto] = partes;
      const num = (v?: string) => (v ? Number(v.replace(/\./g, "").replace(",", ".")) : undefined);
      return { codigo, precioPublico: num(precioPublico) ?? null, precioCosto: num(precioCosto) ?? null };
    })
    .filter((f) => f.codigo);
}

export function ImportarPreciosModal({
  marcas, onCerrar, onImportado,
}: {
  marcas: MarcaConConteos[];
  onCerrar: () => void;
  onImportado: () => void;
}) {
  const toast = useToast();
  const [marcaId, setMarcaId] = useState<number | undefined>(marcas[0]?.id);
  const [texto, setTexto] = useState("");
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<{ actualizados: number; noEncontrados: string[] } | null>(null);

  const filas = parsearFilas(texto);

  async function importar() {
    if (!marcaId) { toast("Elegí una marca", "error"); return; }
    if (filas.length === 0) { toast("Pegá al menos una fila con código y precio", "error"); return; }
    setImportando(true);
    try {
      const r = await api.repuestos.importarPrecios(marcaId, filas);
      setResultado(r);
      toast(`${r.actualizados} repuestos actualizados`, "success");
      onImportado();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No se pudo importar", "error");
    } finally {
      setImportando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[3px]"
         onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="max-h-[88vh] w-full max-w-[560px] overflow-y-auto rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Importar precios</h2>
            <p className="text-[12.5px] text-[var(--text-muted)]">
              Pegá una lista con código y precio (uno por línea, separado por coma, punto y coma o tabulación) —
              por ejemplo, copiada de la lista de precios oficial.
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

        <label className="block text-[12px] font-semibold text-[var(--text-secondary)]">
          Código, precio público, precio costo
          <textarea
            className="mt-1 h-40 w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)]
                       p-3 font-mono text-[12.5px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)]"
            placeholder={"916000021;145000;98000\n916000022;52000"}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        </label>
        <p className="mt-1 text-[12px] text-[var(--text-muted)]">
          {filas.length} filas reconocidas{filas.length > 0 && ` (ej: ${filas[0].codigo})`}
        </p>

        {resultado && (
          <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--border)] p-3 text-[12.5px]">
            <p><strong>{resultado.actualizados}</strong> repuestos actualizados.</p>
            {resultado.noEncontrados.length > 0 && (
              <p className="mt-1 text-[var(--status-warning)]">
                {resultado.noEncontrados.length} códigos no encontrados en esa marca: {resultado.noEncontrados.slice(0, 15).join(", ")}
                {resultado.noEncontrados.length > 15 && "…"}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCerrar}>Cerrar</Button>
          <Button variante="primary" onClick={importar} disabled={importando}>Importar</Button>
        </div>
      </div>
    </div>
  );
}
