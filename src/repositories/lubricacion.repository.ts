/**
 * Acceso a datos de `lubricacion`. Espejo de
 * dashboard/backend/app/routers/lubricacion.py.
 */
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { lubricacion, marcas } from "@/db/schema";

export async function listarLubricacion(marcaId?: number) {
  const query = db
    .select({
      id: lubricacion.id,
      marcaId: lubricacion.marcaId,
      modeloPatron: lubricacion.modeloPatron,
      cilindradas: lubricacion.cilindradas,
      motor: lubricacion.motor,
      transManual: lubricacion.transManual,
      transAutomatica: lubricacion.transAutomatica,
      diferencial: lubricacion.diferencial,
      frenos: lubricacion.frenos,
      refrigerante: lubricacion.refrigerante,
      fuente: lubricacion.fuente,
      vigencia: lubricacion.vigencia,
      marcaNombre: marcas.nombre,
    })
    .from(lubricacion)
    .innerJoin(marcas, eq(marcas.id, lubricacion.marcaId));

  if (marcaId) {
    return query
      .where(eq(lubricacion.marcaId, marcaId))
      .orderBy(asc(marcas.orden), asc(lubricacion.modeloPatron), asc(lubricacion.cilindradas));
  }
  return query.orderBy(asc(marcas.orden), asc(lubricacion.modeloPatron), asc(lubricacion.cilindradas));
}

/** Todas las filas de una marca — la elección de cuál corresponde a un modelo
 *  concreto es una decisión de negocio (ver lubricacion.service.buscarParaModelo). */
export async function filasDeMarca(marcaId: number) {
  return db.select().from(lubricacion).where(eq(lubricacion.marcaId, marcaId));
}

export async function contarFilasDeMarca(marcaId: number) {
  const filas = await filasDeMarca(marcaId);
  return filas.length;
}
