"use client";

import { useEffect } from "react";

/**
 * Aplica el override manual de tema guardado en localStorage, si existe. Por
 * defecto (sin override) el tema ya sigue prefers-color-scheme vía CSS puro,
 * sin parpadeo — este componente solo entra en juego para el caso de alguien
 * que tocó el toggle y quiere quedarse en un tema distinto al del sistema.
 */
export function ThemeInit() {
  useEffect(() => {
    try {
      const t = localStorage.getItem("theme");
      if (t === "dark" || t === "light") document.documentElement.setAttribute("data-theme", t);
      if (localStorage.getItem("densidad") === "taller") document.documentElement.setAttribute("data-density", "taller");
    } catch {}
  }, []);
  return null;
}
