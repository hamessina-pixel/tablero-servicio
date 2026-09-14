import * as dashboardRepo from "@/repositories/dashboard.repository";
import * as configuracionService from "@/services/configuracion.service";
import type { ResumenDashboard } from "@/domain/types";

export async function resumen(): Promise<ResumenDashboard> {
  const [r, empresa] = await Promise.all([
    dashboardRepo.resumenDashboard(),
    configuracionService.nombreEmpresa(),
  ]);
  return {
    empresa,
    enListaCompra: r.enListaCompra,
    cuentasPendientes: r.cuentasPendientes,
    cotizacionesDelMes: r.cotizacionesDelMes,
    ultimasCotizaciones: r.ultimasCotizaciones.map((c) => ({
      id: c.id, marca: c.marca, modelo: c.modelo, km: c.km,
      patente: c.patente, cliente: c.cliente, total: Number(c.total), creadoEn: c.creado_en,
    })),
    faltantesCriticos: r.faltantesCriticos.map((f) => ({
      marca: f.marca, codigo: f.codigo, nombre: f.nombre,
      stockActual: f.stock_actual, stockMinimo: f.stock_minimo,
    })),
    marcas: r.marcas,
    modelos: r.modelos,
    repuestosTotal: r.repuestosTotal,
    repuestosStockGestionado: r.repuestosStockGestionado,
    repuestosStockBajo: r.repuestosStockBajo,
    fluidos: r.fluidos,
    planesMantenimiento: r.planesMantenimiento,
    sustituciones: r.sustituciones,
    valorStockGestionado: r.valorStockGestionado,
    valorStockPorMarca: r.valorStockPorMarca
      .map((x) => ({ marca: x.marca, valor: Number(x.valor) }))
      .filter((x) => x.valor > 0),
    repuestosPorMarca: r.repuestosPorMarca,
    modelosPorMarca: r.modelosPorMarca,
    costoPorKmTop: r.costoPorKmTop.map((x) => ({
      modelo: x.modelo,
      marca: x.marca,
      costoPorKm: x.costo_por_km == null ? 0 : Number(x.costo_por_km),
    })),
  };
}
