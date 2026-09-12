"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";

interface StockBajoItem {
  id: number; codigo: string; nombre: string | null; marcaId: number | null; marcaNombre: string | null;
  stockActual: number | null; stockMinimo: number | null;
}

const CINCO_MIN = 5 * 60 * 1000;

export function AlertasStock() {
  const router = useRouter();
  const [items, setItems] = useState<StockBajoItem[]>([]);
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function cargar() {
      api.pedidos.stockBajo().then((d) => setItems(d as StockBajoItem[])).catch(() => {});
    }
    cargar();
    const id = setInterval(cargar, CINCO_MIN);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!abierto) return;
    function onClick(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) setAbierto(false);
    }
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") setAbierto(false); }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [abierto]);

  const ordenados = items
    .slice()
    .sort((a, b) => ((b.stockMinimo ?? 0) - (b.stockActual ?? 0)) - ((a.stockMinimo ?? 0) - (a.stockActual ?? 0)));
  const visibles = ordenados.slice(0, 8);

  function irAPedido(marcaId: number | null) {
    router.push(marcaId ? `/pedidos?marcaId=${marcaId}` : "/pedidos");
    setAbierto(false);
  }

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        title="Alertas de stock crítico"
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-base text-[var(--text-secondary)]
                   transition-colors hover:bg-[var(--surface-2)]"
      >
        🔔
        {items.length > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1
                       text-[10px] font-bold text-white"
            style={{ background: "var(--status-critical)" }}
          >
            {items.length > 99 ? "99+" : items.length}
          </span>
        )}
      </button>

      {abierto && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-40 w-[320px] overflow-hidden rounded-[var(--radius-md)]
                     border border-[var(--border)] bg-[var(--surface-raised)] shadow-[var(--shadow-lg)]"
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-3.5 py-2.5">
            <span className="text-[13px] font-bold">Stock crítico</span>
            <span className="text-[11.5px] text-[var(--text-muted)]">{items.length} código{items.length === 1 ? "" : "s"}</span>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {visibles.length === 0 && (
              <p className="px-3.5 py-6 text-center text-[12.5px] text-[var(--text-muted)]">Sin códigos por debajo del mínimo.</p>
            )}
            {visibles.map((it) => (
              <button
                key={it.id}
                onClick={() => irAPedido(it.marcaId)}
                className="flex w-full flex-col items-start gap-0.5 border-b border-[var(--border)] px-3.5 py-2.5
                           text-left last:border-0 hover:bg-[var(--surface-2)]"
              >
                <span className="text-[12.5px] font-semibold text-[var(--text-primary)]">{it.nombre ?? it.codigo}</span>
                <span className="text-[11.5px] text-[var(--text-muted)]">
                  {it.marcaNombre ?? "—"} · <span className="font-mono">{it.codigo}</span> ·{" "}
                  <span style={{ color: "var(--status-critical)" }}>{it.stockActual ?? 0} / {it.stockMinimo ?? 0}</span>
                </span>
              </button>
            ))}
          </div>
          {items.length > 0 && (
            <button
              onClick={() => irAPedido(null)}
              className="block w-full border-t border-[var(--border)] px-3.5 py-2.5 text-center text-[12.5px]
                         font-semibold text-[var(--brand)] hover:bg-[var(--surface-2)]"
            >
              Armar pedido de compra →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
