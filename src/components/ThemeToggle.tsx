"use client";

import { useEffect, useState } from "react";

function temaActual(): "dark" | "light" {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [tema, setTema] = useState<"dark" | "light">("dark");

  useEffect(() => setTema(temaActual()), []);

  function alternar() {
    const nuevo = tema === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nuevo);
    try { localStorage.setItem("theme", nuevo); } catch {}
    setTema(nuevo);
  }

  return (
    <button
      onClick={alternar}
      title={tema === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="flex h-8 w-8 items-center justify-center rounded-full text-base text-[var(--text-secondary)]
                 transition-colors hover:bg-[var(--surface-2)]"
    >
      {tema === "dark" ? "☀" : "☽"}
    </button>
  );
}
