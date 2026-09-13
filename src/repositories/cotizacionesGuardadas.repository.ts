/**
 * Acceso a datos de `cotizaciones_guardadas`: historial de cotizaciones
 * buscable por patente o cliente, no solo el localStorage de quien cotizó.
 */
import { desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db/client";
import { cotizacionesGuardadas } from "@/db/schema";
import { ahoraArgentinaISO } from "@/lib/fecha";

export interface DatosCotizacionGuardada {
  marcaId: number; modeloId: number; planId: number;
  marcaNombre: string; modeloNombre: string; km: number;
  patente?: string | null; cliente?: string | null;
  total: number; pvp?: number | null;
  creadoPorId?: number | null;
}

export async function crearCotizacionGuardada(datos: DatosCotizacionGuardada) {
  const [fila] = await db
    .insert(cotizacionesGuardadas)
    .values({
      marcaId: datos.marcaId,
      modeloId: datos.modeloId,
      planId: datos.planId,
      marcaNombre: datos.marcaNombre,
      modeloNombre: datos.modeloNombre,
      km: datos.km,
      patente: datos.patente?.trim().toUpperCase() || null,
      cliente: datos.cliente?.trim() || null,
      total: datos.total,
      pvp: datos.pvp ?? null,
      creadoPorId: datos.creadoPorId ?? null,
      creadoEn: ahoraArgentinaISO(),
    })
    .returning();
  return fila;
}

export async function buscarCotizacionesGuardadas(q: string, limite = 30) {
  const like = `%${q}%`;
  return db
    .select()
    .from(cotizacionesGuardadas)
    .where(or(ilike(cotizacionesGuardadas.patente, like), ilike(cotizacionesGuardadas.cliente, like)))
    .orderBy(desc(cotizacionesGuardadas.id))
    .limit(limite);
}

export async function recientesCotizacionesGuardadas(limite = 30) {
  return db.select().from(cotizacionesGuardadas).orderBy(desc(cotizacionesGuardadas.id)).limit(limite);
}

export async function buscarCotizacionGuardadaPorId(id: number) {
  const [fila] = await db.select().from(cotizacionesGuardadas).where(eq(cotizacionesGuardadas.id, id)).limit(1);
  return fila;
}

export async function actualizarCotizacionGuardada(id: number, cambios: { patente?: string | null; cliente?: string | null }) {
  const set: Record<string, unknown> = {};
  if (cambios.patente !== undefined) set.patente = cambios.patente?.trim().toUpperCase() || null;
  if (cambios.cliente !== undefined) set.cliente = cambios.cliente?.trim() || null;
  if (Object.keys(set).length === 0) return buscarCotizacionGuardadaPorId(id);
  await db.update(cotizacionesGuardadas).set(set).where(eq(cotizacionesGuardadas.id, id));
  return buscarCotizacionGuardadaPorId(id);
}

export async function eliminarCotizacionGuardada(id: number) {
  await db.delete(cotizacionesGuardadas).where(eq(cotizacionesGuardadas.id, id));
}
