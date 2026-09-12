"use client";

import { useEffect, useState } from "react";

function densidadActual(): "normal" | "taller" {
  const attr = document.documentElement.getAttribute("data-density");
  return attr === "taller" ? "taller" : "normal";
}

export function DensityToggle() {
  const [densidad, setDensidad] = useState<"normal" | "taller">("normal");

  useEffect(() => {
    try {
      const guardada = localStorage.getItem("densidad");
      if (guardada === "taller") {
        document.documentElement.setAttribute("data-density", "taller");
        setDensidad("taller");
        return;
      }
    } catch {}
    setDensidad(densidadActual());
  }, []);

  function alternar() {
    const nuevo = densidad === "taller" ? "normal" : "taller";
    if (nuevo === "taller") document.documentElement.setAttribute("data-density", "taller");
    else document.documentElement.removeAttribute("data-density");
    try { localStorage.setItem("densidad", nuevo); } catch {}
    setDensidad(nuevo);
  }

  return (
    <button
      onClick={alternar}
      title={densidad === "taller" ? "Volver a vista normal" : "Modo taller: botones e inputs más grandes para usar con guantes"}
      className={`flex h-8 items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 text-[12px] font-semibold
                  transition-colors ${densidad === "taller"
                    ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]"
                    : "border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"}`}
    >
      <span aria-hidden>🖐</span>
      Modo taller
    </button>
  );
}
