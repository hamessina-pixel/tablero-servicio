/**
 * Lógica de negocio del Cotizador. Espejo de
 * dashboard/backend/app/routers/planes.py.
 */
import * as planesRepo from "@/repositories/planes.repository";
import * as repuestosRepo from "@/repositories/repuestos.repository";
import * as auditoriaRepo from "@/repositories/auditoria.repository";
import { buscarEquivalentesConStock } from "@/services/repuestos.service";
import { exigirPermiso } from "@/services/auth.service";
import { ahoraArgentinaISO } from "@/lib/fecha";
import { NotFoundError, ValidationError } from "@/domain/errors";
import type {
  GrupoBusquedaRepuesto, ItemDePlanConStock, PlanConDetalle, PlanRepuesto, PlanFluido,
  ResumenPorModelo, Usuario,
} from "@/domain/types";

/** Agrega a cada repuesto del plan su stock en vivo (dentro de la marca del
 *  plan) y sus códigos equivalentes/sustitutos con su propio stock — así el
 *  Cotizador puede marcar en verde/rojo y ofrecer alternativas. */
async function enriquecerRepuestos(marcaId: number, filas: PlanRepuesto[]): Promise<ItemDePlanConStock[]> {
  return Promise.all(filas.map(async (it) => {
    const codigo = it.codigo;
    const [stock, equivalentes] = await Promise.all([
      codigo ? repuestosRepo.buscarStockPorMarcaYCodigo(marcaId, codigo) : Promise.resolve(undefined),
      codigo ? buscarEquivalentesConStock(codigo) : Promise.resolve([]),
    ]);
    return {
      nombre: it.nombre,
      codigo: it.codigo,
      cantidad: it.cantidad,
      precioUnitario: it.precioUnitario,
      total: it.total,
      esStockGestionado: stock?.esStockGestionado ?? false,
      stockActual: stock?.stockActual ?? null,
      stockMinimo: stock?.stockMinimo ?? null,
      precioPublico: stock?.precioPublico ?? null,
      precioCosto: stock?.precioCosto ?? null,
      equivalentes,
    };
  }));
}

async function enriquecerFluidos(marcaId: number, filas: PlanFluido[]): Promise<ItemDePlanConStock[]> {
  return Promise.all(filas.map(async (it) => {
    const codigo = it.producto;
    const [stock, equivalentes] = await Promise.all([
      codigo ? repuestosRepo.buscarStockPorMarcaYCodigo(marcaId, codigo) : Promise.resolve(undefined),
      codigo ? buscarEquivalentesConStock(codigo) : Promise.resolve([]),
    ]);
    return {
      nombre: it.nombre,
      producto: it.producto,
      litros: it.litros,
      total: it.total,
      esStockGestionado: stock?.esStockGestionado ?? false,
      stockActual: stock?.stockActual ?? null,
      stockMinimo: stock?.stockMinimo ?? null,
      precioPublico: stock?.precioPublico ?? null,
      precioCosto: stock?.precioCosto ?? null,
      equivalentes,
    };
  }));
}

export async function listarPlanes(filtros: {
  modeloId?: number; marcaId?: number; incluirPreview?: boolean;
} = {}) {
  const rows = await planesRepo.listarPlanes(filtros);
  if (!filtros.incluirPreview) return rows;
  return Promise.all(rows.map(async (row) => {
    const { preview, total } = await planesRepo.itemsPreview(row.id);
    return { ...row, itemsPreview: preview, itemsCount: total };
  }));
}

/** Equivalente a RESUMEN_BASE del cotizador viejo: costo agregado 0-100.000km
 *  por modelo. */
export async function resumenPorModelo(): Promise<ResumenPorModelo[]> {
  const rows = await planesRepo.resumenPorModelo();
  return rows.map((r) => ({
    modeloId: r.modelo_id,
    modelo: r.modelo,
    marca: r.marca,
    costoTotal: Number(r.costo_total),
    pvpTotal: Number(r.pvp_total),
    repTotal: Number(r.rep_total),
    fluTotal: Number(r.flu_total),
    moTotal: Number(r.mo_total),
    maxServicio: Number(r.max_servicio),
    costoKm: Math.round((Number(r.costo_total) / 100000) * 100) / 100,
  }));
}

export async function buscarRepuesto(qCrudo: string) {
  const q = (qCrudo ?? "").trim();
  if (!q) return { query: q, grupos: [] as GrupoBusquedaRepuesto[] };

  const rows = await planesRepo.buscarRepuestoEnPlanes(q);
  const grupos = new Map<string | null, GrupoBusquedaRepuesto>();
  const orden: (string | null)[] = [];
  for (const r of rows) {
    const key = r.codigo || r.nombre || null;
    if (!grupos.has(key)) {
      grupos.set(key, { codigo: r.codigo, nombre: r.nombre, usos: [] });
      orden.push(key);
    }
    grupos.get(key)!.usos.push({ marca: r.marca, modelo: r.modelo, kmIntervalo: r.km_intervalo });
  }
  const resultado = orden.map((k) => grupos.get(k)!);
  return {
    query: q,
    totalCoincidencias: rows.length,
    totalCodigos: resultado.length,
    grupos: resultado.slice(0, 30),
  };
}

export async function obtenerPlan(planId: number): Promise<PlanConDetalle> {
  const plan = await planesRepo.buscarPlanPorId(planId);
  if (!plan) throw new NotFoundError("Plan no encontrado");

  const [repuestosFilas, fluidosFilas, checklist, flag] = await Promise.all([
    planesRepo.repuestosDelPlan(planId),
    planesRepo.fluidosDelPlan(planId),
    planesRepo.checklistDelPlan(planId),
    planesRepo.flagDeModeloYKm(plan.modeloId, plan.kmIntervalo),
  ]);

  const [repuestos, fluidos] = await Promise.all([
    enriquecerRepuestos(plan.marcaId, repuestosFilas),
    enriquecerFluidos(plan.marcaId, fluidosFilas),
  ]);

  return { ...plan, repuestos, fluidos, checklist, flag: flag ?? null };
}

/**
 * Guarda las horas de mano de obra verificadas a mano contra el manual de
 * tiempos oficial de la terminal (dato de referencia: no toca costoTotal ni
 * precioSugerido, que siguen siendo los que ya tiene cargado el plan).
 */
export async function actualizarManoObraVerificada(
  actor: Usuario | null,
  planId: number,
  horas: number | null,
) {
  const usuario = await exigirPermiso(actor, "precios:editar");
  const plan = await planesRepo.buscarPlanPorId(planId);
  if (!plan) throw new NotFoundError("Plan no encontrado");
  if (horas != null && horas <= 0) throw new ValidationError("Las horas deben ser mayores a 0");

  await planesRepo.actualizarManoObraVerificada(planId, horas);
  await auditoriaRepo.registrar({
    usuarioId: usuario.id, accion: "editar", entidad: "plan", entidadId: planId,
    detalle: `Horas de mano de obra verificadas: ${horas ?? "—"}`, fecha: ahoraArgentinaISO(),
  });
  return planesRepo.buscarPlanPorId(planId);
}
