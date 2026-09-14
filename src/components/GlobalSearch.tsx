"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/components/AuthProvider";

interface Resultado {
  key: string;
  grupo: "Páginas" | "Repuestos" | "Sustituciones";
  titulo: string;
  subtitulo: string;
  ir: () => void;
}

const PAGINAS = [
  { label: "Cotizador", href: "/cotizador", icon: "🧮" },
  { label: "Inicio", href: "/", icon: "🏠" },
  { label: "Repuestos & Stock", href: "/repuestos", icon: "⚙️" },
  { label: "Fluidos", href: "/fluidos", icon: "🧴" },
  { label: "Sustituciones", href: "/sustituciones", icon: "⇄" },
  { label: "Pedidos de compra", href: "/pedidos", icon: "📦" },
];

export function GlobalSearch() {
  const router = useRouter();
  const { esAdmin } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState("");
  const [repuestos, setRepuestos] = useState<{ id: number; codigo: string | null; nombre: string | null; marcaNombre: string | null }[]>([]);
  const [sustituciones, setSustituciones] = useState<{ id: number; codigoAnterior: string | null; codigoNuevo: string | null; marcaNombre: string | null }[]>([]);
  const [activo, setActivo] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAbierto((v) => !v);
      } else if (e.key === "Escape") {
        setAbierto(false);
      }
    }
    function onAbrir() { setAbierto(true); }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("abrir-busqueda", onAbrir);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("abrir-busqueda", onAbrir);
    };
  }, []);

  useEffect(() => {
    if (abierto) {
      setQ(""); setRepuestos([]); setSustituciones([]); setActivo(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [abierto]);

  useEffect(() => {
    if (!abierto || q.trim().length < 2) { setRepuestos([]); setSustituciones([]); return; }
    const controlador = setTimeout(() => {
      api.repuestos.listar({ q, pageSize: 6 }).then((r) => setRepuestos(r.items)).catch(() => {});
      api.sustituciones.listar({ q, pageSize: 5 }).then((r) => setSustituciones(r.items)).catch(() => {});
    }, 250);
    return () => clearTimeout(controlador);
  }, [q, abierto]);

  const paginasFiltradas = useMemo(() => {
    const texto = q.trim().toLowerCase();
    const items = PAGINAS.filter((p) => !texto || p.label.toLowerCase().includes(texto));
    return esAdmin ? [...items, { label: "Usuarios", href: "/usuarios", icon: "👤" }].filter((p) => !texto || p.label.toLowerCase().includes(texto)) : items;
  }, [q, esAdmin]);

  function cerrar() { setAbierto(false); }

  const resultados: Resultado[] = useMemo(() => {
    const lista: Resultado[] = [];
    for (const p of paginasFiltradas) {
      lista.push({ key: `p-${p.href}`, grupo: "Páginas", titulo: p.label, subtitulo: p.href, ir: () => { router.push(p.href); cerrar(); } });
    }
    for (const r of repuestos) {
      lista.push({
        key: `r-${r.id}`, grupo: "Repuestos",
        titulo: r.nombre ?? "(sin nombre)", subtitulo: `${r.codigo ?? "sin código"} · ${r.marcaNombre ?? "—"}`,
        ir: () => { router.push(`/repuestos?q=${encodeURIComponent(r.codigo ?? r.nombre ?? "")}`); cerrar(); },
      });
    }
    for (const s of sustituciones) {
      lista.push({
        key: `s-${s.id}`, grupo: "Sustituciones",
        titulo: `${s.codigoAnterior ?? "?"} → ${s.codigoNuevo ?? "?"}`, subtitulo: s.marcaNombre ?? "—",
        ir: () => { router.push(`/sustituciones?q=${encodeURIComponent(s.codigoAnterior ?? "")}`); cerrar(); },
      });
    }
    return lista;
  }, [paginasFiltradas, repuestos, sustituciones, router]);

  useEffect(() => { setActivo(0); }, [resultados.length]);

  function onKeyDownInput(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActivo((i) => Math.min(i + 1, resultados.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActivo((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); resultados[activo]?.ir(); }
  }

  if (!abierto) return null;

  let contadorFilas = -1;
  const grupos: Resultado["grupo"][] = ["Páginas", "Repuestos", "Sustituciones"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-[3px]"
      onClick={(e) => { if (e.target === e.currentTarget) cerrar(); }}
    >
      <div className="w-full max-w-[540px] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-raised)] shadow-[var(--shadow-lg)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-3">
          <span aria-hidden className="text-[15px] text-[var(--text-muted)]">🔍</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDownInput}
            placeholder="Buscar un repuesto, código o página…"
            className="flex-1 border-0 bg-transparent text-[14.5px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
          {q && (
            <button
              type="button"
              onClick={() => { setQ(""); inputRef.current?.focus(); }}
              aria-label="Borrar la búsqueda"
              title="Borrar"
              className="flex h-6 w-6 items-center justify-center rounded-full text-[15px] leading-none
                         text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
            >
              &times;
            </button>
          )}
          <kbd className="rounded-[6px] border border-[var(--border-strong)] px-1.5 py-0.5 text-[11px] text-[var(--text-muted)]">Esc</kbd>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {resultados.length === 0 && (
            <p className="px-3 py-6 text-center text-[13px] text-[var(--text-muted)]">
              {q.trim().length >= 2 ? "Sin resultados." : "Escribí al menos 2 letras para buscar en repuestos y sustituciones."}
            </p>
          )}
          {grupos.map((grupo) => {
            const items = resultados.filter((r) => r.grupo === grupo);
            if (!items.length) return null;
            return (
              <div key={grupo} className="mb-1">
                <div className="px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[.06em] text-[var(--text-muted)]">{grupo}</div>
                {items.map((r) => {
                  contadorFilas++;
                  const i = contadorFilas;
                  return (
                    <button
                      key={r.key}
                      onClick={r.ir}
                      onMouseEnter={() => setActivo(i)}
                      className={`flex w-full flex-col items-start gap-0.5 rounded-[var(--radius-sm)] px-3 py-2 text-left transition-colors
                                  ${activo === i ? "bg-[var(--brand-soft)]" : "hover:bg-[var(--surface-2)]"}`}
                    >
                      <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">{r.titulo}</span>
                      <span className="text-[12px] text-[var(--text-muted)]">{r.subtitulo}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
