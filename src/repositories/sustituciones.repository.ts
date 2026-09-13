/**
 * Acceso a datos de `sustituciones`. Espejo de
 * dashboard/backend/app/routers/sustituciones.py.
 */
import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { marcas, sustituciones } from "@/db/schema";

export async function marcasConSustituciones() {
  const rows = await db
    .select({
      marcaId: sustituciones.marcaId,
      nombre: sql<string>`COALESCE(${marcas.nombre}, 'Sin marca')`,
      total: sql<number>`count(*)`.mapWith(Number),
    })
    .from(sustituciones)
    .leftJoin(marcas, eq(marcas.id, sustituciones.marcaId))
    .groupBy(sustituciones.marcaId, marcas.nombre)
    .orderBy(desc(sql`count(*)`));
  return rows;
}

export async function listarSustituciones(filtros: {
  q?: string;
  marcaId?: number;
  page?: number;
  pageSize?: number;
} = {}) {
  const page = Math.max(filtros.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filtros.pageSize ?? 50, 1), 500);
  const offset = (page - 1) * pageSize;

  const condiciones: SQL[] = [];
  if (filtros.q) {
    const like = `%${filtros.q}%`;
    condiciones.push(or(ilike(sustituciones.codigoAnterior, like), ilike(sustituciones.codigoNuevo, like))!);
  }
  if (filtros.marcaId !== undefined) condiciones.push(eq(sustituciones.marcaId, filtros.marcaId));
  const where = condiciones.length ? and(...condiciones) : undefined;

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)`.mapWith(Number) })
    .from(sustituciones)
    .where(where);

  const items = await db
    .select({
      id: sustituciones.id,
      marcaId: sustituciones.marcaId,
      codigoAnterior: sustituciones.codigoAnterior,
      codigoNuevo: sustituciones.codigoNuevo,
      clase: sustituciones.clase,
      tipoIntercambio: sustituciones.tipoIntercambio,
      cantidadMinima: sustituciones.cantidadMinima,
      fechaVigencia: sustituciones.fechaVigencia,
      marcaNombre: marcas.nombre,
    })
    .from(sustituciones)
    .leftJoin(marcas, eq(marcas.id, sustituciones.marcaId))
    .where(where)
    .orderBy(asc(sustituciones.id))
    .limit(pageSize)
    .offset(offset);

  return { items, total, page, pageSize };
}

/** Sustituciones donde el código aparece como anterior o como nuevo, en cualquier
 *  dirección — es la base del recorrido de equivalencias (ver repuestos.service). */
export async function buscarSustitucionesPorCodigos(codigos: string[]) {
  if (!codigos.length) return [];
  return db
    .select({ codigoAnterior: sustituciones.codigoAnterior, codigoNuevo: sustituciones.codigoNuevo })
    .from(sustituciones)
    .where(
      or(
        inArray(sustituciones.codigoAnterior, codigos),
        inArray(sustituciones.codigoNuevo, codigos),
      ),
    );
}

export async function buscarSustitucionesDeCodigo(codigo: string) {
  return db
    .select()
    .from(sustituciones)
    .where(or(eq(sustituciones.codigoAnterior, codigo), eq(sustituciones.codigoNuevo, codigo)));
}

/** Registra una equivalencia código anterior -> nuevo (p.ej. verificada a mano
 *  contra el portal de piezas de la terminal). */
export async function crearSustitucion(datos: {
  marcaId: number | null;
  codigoAnterior: string;
  codigoNuevo: string;
  clase?: string | null;
}) {
  const [row] = await db
    .insert(sustituciones)
    .values({
      marcaId: datos.marcaId,
      codigoAnterior: datos.codigoAnterior,
      codigoNuevo: datos.codigoNuevo,
      clase: datos.clase ?? "S",
    })
    .returning();
  return row;
}
