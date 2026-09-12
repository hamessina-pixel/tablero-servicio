"use client";

import { createContext, useCallback, useContext, useState } from "react";

type TipoToast = "default" | "success" | "error";
interface ToastItem { id: number; mensaje: string; tipo: TipoToast; }

const ToastContext = createContext<((mensaje: string, tipo?: TipoToast) => void) | null>(null);

let idSeq = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((mensaje: string, tipo: TipoToast = "default") => {
    const id = ++idSeq;
    setItems((prev) => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 3500);
  }, []);

  const colorPorTipo: Record<TipoToast, string> = {
    default: "var(--brand)",
    success: "var(--status-good)",
    error: "var(--status-critical)",
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 no-print">
        {items.map((i) => (
          <div
            key={i.id}
            className="animar-entrada min-w-[220px] max-w-sm rounded-[var(--radius-sm)] bg-[var(--surface-raised)]
                       px-4 py-3 text-sm text-[var(--text-primary)] shadow-[var(--shadow-lg)]"
            style={{ borderLeft: `3px solid ${colorPorTipo[i.tipo]}` }}
          >
            {i.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast() tiene que usarse dentro de <ToastProvider>");
  return ctx;
}
