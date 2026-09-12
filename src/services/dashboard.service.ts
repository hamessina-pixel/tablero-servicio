import * as dashboardRepo from "@/repositories/dashboard.repository";
import type { ResumenDashboard } from "@/domain/types";

export async function resumen(): Promise<ResumenDashboard> {
  const r = await dashboardRepo.resumenDashboard();
  return {
    marcas: r.marcas,
    modelos: r.modelos,
    repuestosTotal: r.repuestosTotal,
    repuestosStockGestionado: r.repuestosStockGestionado,
    repuestosStockBajo: r.repuestosStockBajo,
    fluidos: r.fluidos,
    planesMantenimiento: r.planesMantenimiento,
    sustituciones: r.sustituciones,
    valorStockGestionado: r.valorStockGestionado,
    repuestosPorMarca: r.repuestosPorMarca,
    modelosPorMarca: r.modelosPorMarca,
    costoPorKmTop: r.costoPorKmTop.map((x) => ({
      modelo: x.modelo,
      marca: x.marca,
      costoPorKm: x.costo_por_km == null ? 0 : Number(x.costo_por_km),
    })),
  };
}
