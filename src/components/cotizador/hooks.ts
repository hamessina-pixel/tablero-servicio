import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import type { ModeloConMarca } from "@/repositories/modelos.repository";
import type { PlanMantenimiento } from "@/domain/types";

export function useModelosDeMarca(marcaId: number | undefined) {
  const [modelos, setModelos] = useState<ModeloConMarca[]>([]);
  useEffect(() => {
    if (!marcaId) { setModelos([]); return; }
    let vivo = true;
    api.modelos.listar(marcaId).then((data) => { if (vivo) setModelos(data); });
    return () => { vivo = false; };
  }, [marcaId]);
  return modelos;
}

export function usePlanesDeModelo(modeloId: number | undefined) {
  const [planes, setPlanes] = useState<PlanMantenimiento[]>([]);
  useEffect(() => {
    if (!modeloId) { setPlanes([]); return; }
    let vivo = true;
    api.planes.listar({ modeloId }).then((data) => {
      if (vivo) setPlanes((data as PlanMantenimiento[]).slice().sort((a, b) => a.kmIntervalo - b.kmIntervalo));
    });
    return () => { vivo = false; };
  }, [modeloId]);
  return planes;
}
