"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";

/** Aire que queda arriba del listado al cambiar de página, para que no quede
 *  pegado al borde de la pantalla. */
const MARGEN_ARRIBA = 16;

/**
 * Navegación de páginas para las listas largas. Incluye ir al principio y al
 * final: con cientos de códigos, llegar al último a fuerza de "siguiente" es
 * inviable.
 */
export function Paginacion({
  page, totalPaginas, onCambiar, totalItems, etiquetaItems = "resultados",
}: {
  page: number;
  totalPaginas: number;
  onCambiar: (nueva: number) => void;
  totalItems?: number;
  etiquetaItems?: string;
}) {
  const primera = page <= 1;
  const ultima = page >= totalPaginas;
  const nodo = useRef<HTMLDivElement>(null);

  /** Cambiar de página y volver al principio de la lista: los botones están
   *  abajo, así que sin esto la página nueva arranca mostrando el final. */
  function ir(nueva: number) {
    onCambiar(nueva);
    // Se sube hasta el recuadro que contiene la tabla, no hasta el tope de la
    // página: así quedan a la vista el buscador y los filtros de la lista.
    let contenedor = nodo.current?.parentElement ?? null;
    while (contenedor && !contenedor.querySelector("table")) contenedor = contenedor.parentElement;
    const destino = contenedor ?? nodo.current;
    if (!destino) return;

    const y = destino.getBoundingClientRect().top + window.scrollY - MARGEN_ARRIBA;
    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: Math.max(y, 0), behavior: suave ? "smooth" : "auto" });
  }

  return (
    <div ref={nodo} className="flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-[var(--text-muted)]">
      {totalItems != null
        ? <span>{totalItems.toLocaleString("es-AR")} {etiquetaItems}</span>
        : <span />}
      <div className="flex items-center gap-1.5">
        <Button tamano="sm" disabled={primera} onClick={() => ir(1)} title="Primera página" aria-label="Primera página">
          «
        </Button>
        <Button tamano="sm" disabled={primera} onClick={() => ir(page - 1)}>Anterior</Button>
        <span className="px-1 tabular-nums">Página {page} de {totalPaginas}</span>
        <Button tamano="sm" disabled={ultima} onClick={() => ir(page + 1)}>Siguiente</Button>
        <Button tamano="sm" disabled={ultima} onClick={() => ir(totalPaginas)} title="Última página" aria-label="Última página">
          »
        </Button>
      </div>
    </div>
  );
}
