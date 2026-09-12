"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";
import type { MarcaConConteos } from "@/repositories/marcas.repository";

interface MarcasContextValor {
  marcas: MarcaConConteos[];
  cargando: boolean;
  porId: (id: number) => MarcaConConteos | undefined;
  colorMarca: (nombre: string) => string;
  marcasCotizables: () => MarcaConConteos[];
  marcasSinPlanes: () => MarcaConConteos[];
  recargar: () => Promise<void>;
}

const MarcasContext = createContext<MarcasContextValor | null>(null);

export function MarcasProvider({ children }: { children: React.ReactNode }) {
  const [marcas, setMarcas] = useState<MarcaConConteos[]>([]);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    const data = await api.marcas.listar({ incluirInactivas: false });
    setMarcas(data);
  }, []);

  useEffect(() => {
    recargar().finally(() => setCargando(false));
  }, [recargar]);

  const porId = useCallback((id: number) => marcas.find((m) => m.id === id), [marcas]);
  const colorMarca = useCallback(
    (nombre: string) => marcas.find((m) => m.nombre === nombre)?.color || "var(--text-muted)",
    [marcas],
  );
  const marcasCotizables = useCallback(
    () => marcas.filter((m) => m.esVehiculos && m.modelos > 0),
    [marcas],
  );
  const marcasSinPlanes = useCallback(
    () => marcas.filter((m) => m.esVehiculos && m.modelos === 0),
    [marcas],
  );

  const valor = useMemo(
    () => ({ marcas, cargando, porId, colorMarca, marcasCotizables, marcasSinPlanes, recargar }),
    [marcas, cargando, porId, colorMarca, marcasCotizables, marcasSinPlanes, recargar],
  );

  return <MarcasContext.Provider value={valor}>{children}</MarcasContext.Provider>;
}

export function useMarcas(): MarcasContextValor {
  const ctx = useContext(MarcasContext);
  if (!ctx) throw new Error("useMarcas() tiene que usarse dentro de <MarcasProvider>");
  return ctx;
}
