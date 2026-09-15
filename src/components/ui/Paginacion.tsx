"use client";

import { Button } from "@/components/ui/Button";

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

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-[var(--text-muted)]">
      {totalItems != null
        ? <span>{totalItems.toLocaleString("es-AR")} {etiquetaItems}</span>
        : <span />}
      <div className="flex items-center gap-1.5">
        <Button tamano="sm" disabled={primera} onClick={() => onCambiar(1)} title="Primera página" aria-label="Primera página">
          «
        </Button>
        <Button tamano="sm" disabled={primera} onClick={() => onCambiar(page - 1)}>Anterior</Button>
        <span className="px-1 tabular-nums">Página {page} de {totalPaginas}</span>
        <Button tamano="sm" disabled={ultima} onClick={() => onCambiar(page + 1)}>Siguiente</Button>
        <Button tamano="sm" disabled={ultima} onClick={() => onCambiar(totalPaginas)} title="Última página" aria-label="Última página">
          »
        </Button>
      </div>
    </div>
  );
}
