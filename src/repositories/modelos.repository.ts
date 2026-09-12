/**
 * Acceso a datos de `modelos`. Espejo de dashboard/backend/app/routers/modelos.py.
 */
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { modelos, marcas } from "@/db/schema";

export interface ModeloConMarca {
  id: number;
  nombre: string;
  marcaId: number;
  marcaNombre: string;
}

export async function listarModelos(marcaId?: number): Promise<ModeloConMarca[]> {
  const query = db
    .select({
      id: modelos.id,
      nombre: modelos.nombre,
      marcaId: modelos.marcaId,
      marcaNombre: marcas.nombre,
    })
    .from(modelos)
    .innerJoin(marcas, eq(marcas.id, modelos.marcaId));

  if (marcaId) {
    return query.where(eq(modelos.marcaId, marcaId)).orderBy(asc(modelos.id));
  }
  return query.orderBy(asc(marcas.id), asc(modelos.id));
}

export async function buscarModeloPorId(id: number) {
  const [row] = await db.select().from(modelos).where(eq(modelos.id, id)).limit(1);
  return row;
}
