/**
 * Acceso a datos de `repuestos`. Espejo de dashboard/backend/app/routers/repuestos.py.
 *
 * OJO con LIKE: SQLite compara LIKE sin distinguir mayúsculas/minúsculas para
 * ASCII por defecto; Postgres NO (LIKE es case-sensitive ahí). Para no cambiar
 * el comportamiento de ninguna búsqueda, acá se usa `ilike` en vez de `like`
 * en todo lo que en el sistema viejo era una búsqueda de texto libre.
 */
import { and, asc, desc, eq, ilike, inArray, lt, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { marcas, planRepuestos, repuestos } from "@/db/schema";
import { ValidationError } from "@/domain/errors";
import type { Repuesto } from "@/domain/types";

export interface RepuestoConMarca extends Repuesto {
  marcaNombre: string | null;
}

export interface FiltrosRepuestos {
  marcaId?: number;
  categoria?: string;
  q?: string;
  stockBajo?: boolean;
  soloStockGestionado?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listarRepuestos(filtros: FiltrosRepuestos = {}) {
  const page = Math.max(filtros.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filtros.pageSize ?? 50, 1), 500);
  const offset = (page - 1) * pageSize;

  const condiciones = [];
  if (filtros.marcaId) condiciones.push(eq(repuestos.marcaId, filtros.marcaId));

  // La columna `categoria` guarda la PROCEDENCIA de la última importación, no
  // lo que el usuario entiende al leer la etiqueta del filtro — por eso "plan"
  // y "stock" se resuelven contra el dato real (existe en algún plan / tiene
  // control de stock) y no como un valor más de esa columna.
  if (filtros.categoria === "plan") {
    condiciones.push(
      sql`EXISTS (SELECT 1 FROM ${planRepuestos} pr WHERE pr.repuesto_id = ${repuestos.id})`,
    );
  } else if (filtros.categoria === "stock") {
    condiciones.push(eq(repuestos.esStockGestionado, true));
  } else if (filtros.categoria) {
    condiciones.push(eq(repuestos.categoria, filtros.categoria));
  }

  if (filtros.soloStockGestionado) condiciones.push(eq(repuestos.esStockGestionado, true));
  if (filtros.stockBajo) {
    condiciones.push(eq(repuestos.esStockGestionado, true));
    condiciones.push(lt(repuestos.stockActual, repuestos.stockMinimo));
  }
  if (filtros.q) {
    const like = `%${filtros.q}%`;
    condiciones.push(or(ilike(repuestos.codigo, like), ilike(repuestos.nombre, like)));
  }

  const where = condiciones.length ? and(...condiciones) : undefined;

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)`.mapWith(Number) })
    .from(repuestos)
    .where(where);

  const items = await db
    .select({
      id: repuestos.id,
      codigo: repuestos.codigo,
      nombre: repuestos.nombre,
      marcaId: repuestos.marcaId,
      categoria: repuestos.categoria,
      precioPublico: repuestos.precioPublico,
      precioCosto: repuestos.precioCosto,
      descuentoPct: repuestos.descuentoPct,
      fechaLista: repuestos.fechaLista,
      esStockGestionado: repuestos.esStockGestionado,
      stockActual: repuestos.stockActual,
      stockMinimo: repuestos.stockMinimo,
      stockFicticio: repuestos.stockFicticio,
      fuente: repuestos.fuente,
      marcaNombre: marcas.nombre,
    })
    .from(repuestos)
    .leftJoin(marcas, eq(marcas.id, repuestos.marcaId))
    .where(where)
    .orderBy(desc(repuestos.esStockGestionado), asc(repuestos.nombre))
    .limit(pageSize)
    .offset(offset);

  return { items, total, page, pageSize };
}

export async function conteoCategorias(marcaId?: number) {
  const filtroMarca: SQL | undefined = marcaId ? eq(repuestos.marcaId, marcaId) : undefined;

  const contar = async (cond?: SQL): Promise<number> => {
    const partes = [cond, filtroMarca].filter((x): x is SQL => x !== undefined);
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(repuestos)
      .where(partes.length ? and(...partes) : undefined);
    return n;
  };

  const tienePlan = sql`EXISTS (SELECT 1 FROM ${planRepuestos} pr WHERE pr.repuesto_id = ${repuestos.id})`;

  const [total, stock, plan, catalogo, multimarca, accesorio, manual] = await Promise.all([
    contar(),
    contar(eq(repuestos.esStockGestionado, true)),
    contar(tienePlan),
    contar(eq(repuestos.categoria, "catalogo")),
    contar(eq(repuestos.categoria, "multimarca")),
    contar(eq(repuestos.categoria, "accesorio")),
    contar(eq(repuestos.categoria, "manual")),
  ]);

  return { "": total, stock, plan, catalogo, multimarca, accesorio, manual };
}

/** Repuestos por código exacto, en cualquier marca (para resolver equivalentes). */
export async function buscarRepuestosPorCodigos(codigos: string[]) {
  if (!codigos.length) return [];
  return db
    .select({
      codigo: repuestos.codigo,
      nombre: repuestos.nombre,
      marcaNombre: marcas.nombre,
      esStockGestionado: repuestos.esStockGestionado,
      stockActual: repuestos.stockActual,
      stockMinimo: repuestos.stockMinimo,
      stockFicticio: repuestos.stockFicticio,
      precioPublico: repuestos.precioPublico,
      precioCosto: repuestos.precioCosto,
    })
    .from(repuestos)
    .leftJoin(marcas, eq(marcas.id, repuestos.marcaId))
    .where(inArray(repuestos.codigo, codigos))
    .orderBy(desc(repuestos.stockActual));
}

export async function buscarRepuestoPorCodigo(codigo: string) {
  return db
    .select({
      codigo: repuestos.codigo,
      nombre: repuestos.nombre,
      marcaNombre: marcas.nombre,
      esStockGestionado: repuestos.esStockGestionado,
      stockActual: repuestos.stockActual,
      stockMinimo: repuestos.stockMinimo,
      stockFicticio: repuestos.stockFicticio,
      precioPublico: repuestos.precioPublico,
      precioCosto: repuestos.precioCosto,
    })
    .from(repuestos)
    .leftJoin(marcas, eq(marcas.id, repuestos.marcaId))
    .where(eq(repuestos.codigo, codigo));
}

/** Stock "en vivo" de un código concreto dentro de una marca (para un ítem de plan). */
export async function buscarStockPorMarcaYCodigo(marcaId: number | null, codigo: string) {
  if (marcaId == null) return undefined;
  const [row] = await db
    .select({
      id: repuestos.id,
      esStockGestionado: repuestos.esStockGestionado,
      stockActual: repuestos.stockActual,
      stockMinimo: repuestos.stockMinimo,
      precioPublico: repuestos.precioPublico,
      precioCosto: repuestos.precioCosto,
    })
    .from(repuestos)
    .where(and(eq(repuestos.marcaId, marcaId), eq(repuestos.codigo, codigo)))
    .limit(1);
  return row;
}

export async function buscarRepuestoPorId(id: number): Promise<RepuestoConMarca | undefined> {
  const [row] = await db
    .select({
      id: repuestos.id,
      codigo: repuestos.codigo,
      nombre: repuestos.nombre,
      marcaId: repuestos.marcaId,
      categoria: repuestos.categoria,
      precioPublico: repuestos.precioPublico,
      precioCosto: repuestos.precioCosto,
      descuentoPct: repuestos.descuentoPct,
      fechaLista: repuestos.fechaLista,
      esStockGestionado: repuestos.esStockGestionado,
      stockActual: repuestos.stockActual,
      stockMinimo: repuestos.stockMinimo,
      stockFicticio: repuestos.stockFicticio,
      fuente: repuestos.fuente,
      marcaNombre: marcas.nombre,
    })
    .from(repuestos)
    .leftJoin(marcas, eq(marcas.id, repuestos.marcaId))
    .where(eq(repuestos.id, id))
    .limit(1);
  return row;
}

export async function planesQueUsanRepuesto(repuestoId: number) {
  const { planesMantenimiento, modelos } = await import("@/db/schema");
  return db
    .selectDistinct({
      modelo: modelos.nombre,
      marca: marcas.nombre,
      kmIntervalo: planesMantenimiento.kmIntervalo,
      cantidad: planRepuestos.cantidad,
      precioUnitario: planRepuestos.precioUnitario,
    })
    .from(planRepuestos)
    .innerJoin(planesMantenimiento, eq(planesMantenimiento.id, planRepuestos.planId))
    .innerJoin(modelos, eq(modelos.id, planesMantenimiento.modeloId))
    .innerJoin(marcas, eq(marcas.id, modelos.marcaId))
    .where(eq(planRepuestos.repuestoId, repuestoId))
    .orderBy(asc(marcas.nombre), asc(modelos.nombre), asc(planesMantenimiento.kmIntervalo));
}

export async function actualizarRepuesto(
  id: number,
  cambios: {
    codigo?: string | null;
    nombre?: string | null;
    stockActual?: number | null;
    stockMinimo?: number | null;
    precioCosto?: number | null;
    precioPublico?: number | null;
    esStockGestionado?: boolean | null;
  },
) {
  const set: Record<string, unknown> = {};
  if (cambios.codigo !== undefined && cambios.codigo !== null) set.codigo = cambios.codigo;
  if (cambios.nombre !== undefined) set.nombre = cambios.nombre;
  if (cambios.stockActual !== undefined && cambios.stockActual !== null) set.stockActual = cambios.stockActual;
  if (cambios.stockMinimo !== undefined && cambios.stockMinimo !== null) set.stockMinimo = cambios.stockMinimo;
  if (cambios.precioCosto !== undefined && cambios.precioCosto !== null) set.precioCosto = cambios.precioCosto;
  if (cambios.precioPublico !== undefined && cambios.precioPublico !== null) set.precioPublico = cambios.precioPublico;
  if (cambios.esStockGestionado !== undefined && cambios.esStockGestionado !== null) {
    set.esStockGestionado = cambios.esStockGestionado;
  }
  if (Object.keys(set).length === 0) return buscarRepuestoPorId(id);

  await db.update(repuestos).set(set).where(eq(repuestos.id, id));
  return buscarRepuestoPorId(id);
}

export interface FilaPrecioLote {
  codigo: string;
  precioPublico?: number | null;
  precioCosto?: number | null;
  descuentoPct?: number | null;
}

/**
 * Actualiza precios de un lote de repuestos ubicándolos por (marca, código),
 * en una sola consulta. Un campo que viene null/undefined no se toca (queda
 * el valor que ya tenía), y solo se escriben las filas donde algún valor
 * realmente cambia — así reimportar la misma lista no genera escrituras.
 *
 * Devuelve los códigos efectivamente modificados y los que existen en esa
 * marca, para poder informar cuántos quedaron igual y cuántos no se encontraron.
 */
export async function actualizarPreciosLote(marcaId: number, filas: FilaPrecioLote[]) {
  if (!filas.length) return { actualizados: [] as string[], existentes: 0 };

  const SEP = "";
  // Los cuatro arrays se reparten por posición: si un código trajera el
  // separador, `string_to_array` los desalinearía y cada precio terminaría en
  // la pieza equivocada. Ningún código legítimo lo contiene.
  if (filas.some((f) => f.codigo.includes(SEP))) {
    throw new ValidationError("Hay códigos con caracteres de control; revisá el archivo de origen");
  }
  const codigos = filas.map((f) => f.codigo).join(SEP);
  const numero = (v: number | null | undefined) => (v == null ? "" : String(v));
  const publicos = filas.map((f) => numero(f.precioPublico)).join(SEP);
  const costos = filas.map((f) => numero(f.precioCosto)).join(SEP);
  const descuentos = filas.map((f) => numero(f.descuentoPct)).join(SEP);

  const datos = sql`
    SELECT t.codigo,
           NULLIF(t.publico, '')::double precision   AS publico,
           NULLIF(t.costo, '')::double precision     AS costo,
           NULLIF(t.descuento, '')::double precision AS descuento
      FROM unnest(
             string_to_array(${codigos}, ${SEP}),
             string_to_array(${publicos}, ${SEP}),
             string_to_array(${costos}, ${SEP}),
             string_to_array(${descuentos}, ${SEP})
           ) AS t(codigo, publico, costo, descuento)
  `;

  const actualizadas = await db.execute(sql`
    UPDATE ${repuestos} r
       SET precio_publico = COALESCE(d.publico, r.precio_publico),
           precio_costo   = COALESCE(d.costo, r.precio_costo),
           descuento_pct  = COALESCE(d.descuento, r.descuento_pct)
      FROM (${datos}) d
     WHERE r.marca_id = ${marcaId}
       AND r.codigo = d.codigo
       AND (r.precio_publico IS DISTINCT FROM COALESCE(d.publico, r.precio_publico)
         OR r.precio_costo   IS DISTINCT FROM COALESCE(d.costo, r.precio_costo)
         OR r.descuento_pct  IS DISTINCT FROM COALESCE(d.descuento, r.descuento_pct))
    RETURNING r.codigo
  `);

  const [{ n }] = (await db.execute(sql`
    SELECT count(*) AS n FROM ${repuestos} r
     WHERE r.marca_id = ${marcaId}
       AND r.codigo = ANY(string_to_array(${codigos}, ${SEP}))
  `)).rows as { n: string }[];

  return {
    actualizados: actualizadas.rows.map((r) => r.codigo as string),
    existentes: Number(n),
  };
}

/** Para validar unicidad (marcaId, código) al renombrar un código existente. */
export async function existeOtroConCodigo(marcaId: number | null, codigo: string, excluirId: number) {
  if (marcaId == null) return false;
  const [row] = await db
    .select({ id: repuestos.id })
    .from(repuestos)
    .where(and(eq(repuestos.marcaId, marcaId), eq(repuestos.codigo, codigo), ne(repuestos.id, excluirId)))
    .limit(1);
  return Boolean(row);
}

export async function crearRepuesto(datos: {
  codigo: string;
  nombre: string | null;
  marcaId: number;
  categoria: string | null;
  precioPublico: number | null;
  precioCosto: number | null;
  stockActual: number | null;
  stockMinimo: number | null;
}) {
  const [row] = await db
    .insert(repuestos)
    .values({
      codigo: datos.codigo,
      nombre: datos.nombre,
      marcaId: datos.marcaId,
      categoria: datos.categoria,
      precioPublico: datos.precioPublico,
      precioCosto: datos.precioCosto,
      esStockGestionado: true,
      stockActual: datos.stockActual ?? 0,
      stockMinimo: datos.stockMinimo ?? 0,
      fuente: "manual",
    })
    .returning();
  return row;
}

export async function eliminarRepuesto(id: number) {
  await db.delete(repuestos).where(eq(repuestos.id, id));
}
