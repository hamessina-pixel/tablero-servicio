/**
 * Acceso a datos de planes de mantenimiento (el Cotizador).
 * Espejo de dashboard/backend/app/routers/planes.py.
 */
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  flagsCalidadDatos, marcas, modelos, planChecklist, planesMantenimiento,
  planFluidos, planRepuestos,
} from "@/db/schema";

export async function listarPlanes(filtros: { modeloId?: number; marcaId?: number } = {}) {
  const condiciones = [];
  if (filtros.modeloId) condiciones.push(eq(planesMantenimiento.modeloId, filtros.modeloId));
  if (filtros.marcaId) condiciones.push(eq(modelos.marcaId, filtros.marcaId));

  return db
    .select({
      id: planesMantenimiento.id,
      modeloId: planesMantenimiento.modeloId,
      kmIntervalo: planesMantenimiento.kmIntervalo,
      manoObraHoras: planesMantenimiento.manoObraHoras,
      manoObraCosto: planesMantenimiento.manoObraCosto,
      totalRepuestos: planesMantenimiento.totalRepuestos,
      totalFluidos: planesMantenimiento.totalFluidos,
      costoTotal: planesMantenimiento.costoTotal,
      precioSugerido: planesMantenimiento.precioSugerido,
      esFlatRate: planesMantenimiento.esFlatRate,
      notas: planesMantenimiento.notas,
      packRepuestosCosto: planesMantenimiento.packRepuestosCosto,
      packManoObraCosto: planesMantenimiento.packManoObraCosto,
      manoObraHorasVerificada: planesMantenimiento.manoObraHorasVerificada,
      desgloseRepuestos: planesMantenimiento.desgloseRepuestos,
      desgloseFluidos: planesMantenimiento.desgloseFluidos,
      modeloNombre: modelos.nombre,
      marcaNombre: marcas.nombre,
    })
    .from(planesMantenimiento)
    .innerJoin(modelos, eq(modelos.id, planesMantenimiento.modeloId))
    .innerJoin(marcas, eq(marcas.id, modelos.marcaId))
    .where(condiciones.length ? and(...condiciones) : undefined)
    .orderBy(asc(marcas.nombre), asc(modelos.nombre), asc(planesMantenimiento.kmIntervalo));
}

export async function itemsPreview(planId: number, limite = 3) {
  const rows = await db.execute(sql`
    SELECT nombre FROM plan_repuestos WHERE plan_id = ${planId}
    UNION ALL
    SELECT nombre FROM plan_fluidos WHERE plan_id = ${planId}
  `);
  const nombres = rows.rows.map((r) => r.nombre as string | null).filter((n): n is string => !!n);
  let preview = nombres.slice(0, limite).join(", ");
  if (nombres.length > limite) preview += "…";
  return { preview, total: nombres.length };
}

export async function resumenPorModelo() {
  const rows = await db.execute(sql`
    SELECT mo.id AS modelo_id, mo.nombre AS modelo, ma.nombre AS marca,
           COALESCE(SUM(pm.costo_total), 0) AS costo_total,
           COALESCE(SUM(pm.precio_sugerido), 0) AS pvp_total,
           COALESCE(SUM(pm.total_repuestos), 0) AS rep_total,
           COALESCE(SUM(pm.total_fluidos), 0) AS flu_total,
           COALESCE(SUM(pm.mano_obra_costo), 0) AS mo_total,
           COALESCE(MAX(pm.costo_total), 0) AS max_servicio
      FROM modelos mo
      JOIN marcas ma ON ma.id = mo.marca_id
      LEFT JOIN planes_mantenimiento pm ON pm.modelo_id = mo.id
     GROUP BY mo.id, mo.nombre, ma.nombre
     ORDER BY ma.nombre, mo.nombre
  `);
  return rows.rows as Array<{
    modelo_id: number; modelo: string; marca: string; costo_total: number;
    pvp_total: number; rep_total: number; flu_total: number; mo_total: number;
    max_servicio: number;
  }>;
}

export async function buscarRepuestoEnPlanes(q: string) {
  const like = `%${q}%`;
  const rows = await db.execute(sql`
    SELECT ma.nombre AS marca, mo.nombre AS modelo, pm.km_intervalo AS km_intervalo,
           x.nombre, x.codigo
      FROM (
          SELECT plan_id, nombre, codigo FROM plan_repuestos
          UNION ALL
          SELECT plan_id, nombre, producto AS codigo FROM plan_fluidos
      ) x
      JOIN planes_mantenimiento pm ON pm.id = x.plan_id
      JOIN modelos mo ON mo.id = pm.modelo_id
      JOIN marcas ma ON ma.id = mo.marca_id
     WHERE x.codigo ILIKE ${like} OR x.nombre ILIKE ${like}
     ORDER BY ma.nombre, mo.nombre, pm.km_intervalo
  `);
  return rows.rows as Array<{
    marca: string; modelo: string; km_intervalo: number; nombre: string | null; codigo: string | null;
  }>;
}

export async function buscarPlanPorId(planId: number) {
  const [row] = await db
    .select({
      id: planesMantenimiento.id,
      modeloId: planesMantenimiento.modeloId,
      kmIntervalo: planesMantenimiento.kmIntervalo,
      manoObraHoras: planesMantenimiento.manoObraHoras,
      manoObraCosto: planesMantenimiento.manoObraCosto,
      totalRepuestos: planesMantenimiento.totalRepuestos,
      totalFluidos: planesMantenimiento.totalFluidos,
      costoTotal: planesMantenimiento.costoTotal,
      precioSugerido: planesMantenimiento.precioSugerido,
      esFlatRate: planesMantenimiento.esFlatRate,
      notas: planesMantenimiento.notas,
      packRepuestosCosto: planesMantenimiento.packRepuestosCosto,
      packManoObraCosto: planesMantenimiento.packManoObraCosto,
      manoObraHorasVerificada: planesMantenimiento.manoObraHorasVerificada,
      desgloseRepuestos: planesMantenimiento.desgloseRepuestos,
      desgloseFluidos: planesMantenimiento.desgloseFluidos,
      modeloNombre: modelos.nombre,
      marcaNombre: marcas.nombre,
      marcaId: modelos.marcaId,
    })
    .from(planesMantenimiento)
    .innerJoin(modelos, eq(modelos.id, planesMantenimiento.modeloId))
    .innerJoin(marcas, eq(marcas.id, modelos.marcaId))
    .where(eq(planesMantenimiento.id, planId))
    .limit(1);
  return row;
}

export async function repuestosDelPlan(planId: number) {
  return db
    .select()
    .from(planRepuestos)
    .where(eq(planRepuestos.planId, planId))
    .orderBy(asc(planRepuestos.nombre));
}

export async function fluidosDelPlan(planId: number) {
  return db
    .select()
    .from(planFluidos)
    .where(eq(planFluidos.planId, planId))
    .orderBy(asc(planFluidos.nombre));
}

export async function checklistDelPlan(planId: number) {
  return db
    .select()
    .from(planChecklist)
    .where(eq(planChecklist.planId, planId))
    .orderBy(asc(planChecklist.id));
}

/** Horas de taller de un ítem puntual del plan (p.ej. las bujías). */
export async function actualizarManoObraDeItem(itemId: number, horas: number | null) {
  const [row] = await db
    .update(planRepuestos)
    .set({ manoObraHoras: horas })
    .where(eq(planRepuestos.id, itemId))
    .returning();
  return row;
}

export async function buscarItemDePlan(itemId: number) {
  const [row] = await db.select().from(planRepuestos).where(eq(planRepuestos.id, itemId)).limit(1);
  return row;
}

export async function actualizarDesglose(
  planId: number,
  desglose: { repuestos: number | null; fluidos: number | null },
) {
  await db
    .update(planesMantenimiento)
    .set({ desgloseRepuestos: desglose.repuestos, desgloseFluidos: desglose.fluidos })
    .where(eq(planesMantenimiento.id, planId));
}

export async function actualizarManoObraVerificada(planId: number, horas: number | null) {
  await db.update(planesMantenimiento).set({ manoObraHorasVerificada: horas }).where(eq(planesMantenimiento.id, planId));
}

export async function flagDeModeloYKm(modeloId: number, kmIntervalo: number) {
  const [row] = await db
    .select({ item: flagsCalidadDatos.item, nota: flagsCalidadDatos.nota })
    .from(flagsCalidadDatos)
    .where(and(eq(flagsCalidadDatos.modeloId, modeloId), eq(flagsCalidadDatos.kmIntervalo, kmIntervalo)))
    .limit(1);
  return row;
}
