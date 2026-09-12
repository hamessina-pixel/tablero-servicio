/**
 * Acceso a datos de `fluidos`. Espejo de dashboard/backend/app/routers/fluidos.py.
 */
import { and, asc, eq, ilike, isNotNull, or, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { fluidos } from "@/db/schema";

export async function listarFluidos(filtros: { q?: string; categoria?: string } = {}) {
  const condiciones: SQL[] = [];
  if (filtros.q) {
    const like = `%${filtros.q}%`;
    condiciones.push(
      or(
        ilike(fluidos.nombre, like),
        ilike(fluidos.codigoMarca, like),
        ilike(fluidos.codigoPuma, like),
      )!,
    );
  }
  if (filtros.categoria) condiciones.push(eq(fluidos.categoria, filtros.categoria));

  const [items, categoriasRows] = await Promise.all([
    db
      .select()
      .from(fluidos)
      .where(condiciones.length ? and(...condiciones) : undefined)
      .orderBy(asc(fluidos.categoria), asc(fluidos.nombre)),
    db
      .selectDistinct({ categoria: fluidos.categoria })
      .from(fluidos)
      .where(isNotNull(fluidos.categoria))
      .orderBy(asc(fluidos.categoria)),
  ]);

  return {
    items,
    categorias: categoriasRows.map((r) => r.categoria).filter((c): c is string => c !== null),
  };
}
