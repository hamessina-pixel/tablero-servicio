/**
 * Acceso a datos de `marcas`. Espejo de dashboard/backend/app/routers/marcas.py.
 */
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { marcas } from "@/db/schema";
import type { Marca } from "@/domain/types";

export interface MarcaConConteos extends Marca {
  modelos: number;
  planes: number;
  repuestos: number;
}

export async function listarMarcas(opts: {
  conModelos?: boolean;
  incluirInactivas?: boolean;
} = {}): Promise<MarcaConConteos[]> {
  const { conModelos = false, incluirInactivas = false } = opts;

  const condiciones = [];
  if (!incluirInactivas) condiciones.push(eq(marcas.activa, true));
  if (conModelos) {
    condiciones.push(
      sql`EXISTS (SELECT 1 FROM modelos mo3 WHERE mo3.marca_id = ${marcas.id})`,
    );
  }

  const rows = await db
    .select({
      id: marcas.id,
      nombre: marcas.nombre,
      slug: marcas.slug,
      orden: marcas.orden,
      color: marcas.color,
      grupoCatalogo: marcas.grupoCatalogo,
      esVehiculos: marcas.esVehiculos,
      activa: marcas.activa,
      // OJO: interpolar ${marcas.id} acá adentro renderiza "id" SIN calificar
      // con la tabla ("marcas"."id") porque este sql`` no corre dentro de un
      // contexto de query que sepa a qué tabla pertenece la columna — y
      // Postgres lo confunde con el "id" de la propia subconsulta
      // correlacionada. Se usa texto plano "marcas.id": es un identificador
      // fijo nuestro, no un dato de usuario, cero riesgo de inyección.
      modelos: sql<number>`(SELECT COUNT(*) FROM modelos mo WHERE mo.marca_id = marcas.id)`.mapWith(Number),
      planes: sql<number>`(SELECT COUNT(*) FROM planes_mantenimiento pm
                            JOIN modelos mo2 ON mo2.id = pm.modelo_id
                           WHERE mo2.marca_id = marcas.id)`.mapWith(Number),
      repuestos: sql<number>`(SELECT COUNT(*) FROM repuestos r WHERE r.marca_id = marcas.id)`.mapWith(Number),
    })
    .from(marcas)
    .where(condiciones.length ? and(...condiciones) : undefined)
    .orderBy(asc(marcas.orden), asc(marcas.nombre));

  return rows;
}

export async function buscarMarcaPorId(id: number): Promise<Marca | undefined> {
  const [row] = await db.select().from(marcas).where(eq(marcas.id, id)).limit(1);
  return row;
}

export async function buscarMarcaPorNombre(nombre: string): Promise<Marca | undefined> {
  const [row] = await db.select().from(marcas).where(eq(marcas.nombre, nombre)).limit(1);
  return row;
}
