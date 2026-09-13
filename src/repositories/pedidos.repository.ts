/**
 * Acceso a datos de pedidos de compra. Espejo de
 * dashboard/backend/app/routers/pedidos.py.
 */
import { and, asc, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { listaCompra, marcas, pedidoItems, pedidosCompra, repuestos } from "@/db/schema";
import { ahoraArgentinaISO } from "@/lib/fecha";

export async function listarPedidos() {
  return db
    .select({
      id: pedidosCompra.id,
      fecha: pedidosCompra.fecha,
      nota: pedidosCompra.nota,
      nItems: sql<number>`count(${pedidoItems.id})`.mapWith(Number),
      valorTotal: sql<number>`COALESCE(SUM(${pedidoItems.totalEstimado}), 0)`.mapWith(Number),
    })
    .from(pedidosCompra)
    .leftJoin(pedidoItems, eq(pedidoItems.pedidoId, pedidosCompra.id))
    .groupBy(pedidosCompra.id, pedidosCompra.fecha, pedidosCompra.nota)
    .orderBy(desc(pedidosCompra.id));
}

export async function repuestosConStockBajo(marcaId?: number) {
  const condiciones = [eq(repuestos.esStockGestionado, true), lt(repuestos.stockActual, repuestos.stockMinimo)];
  if (marcaId) condiciones.push(eq(repuestos.marcaId, marcaId));

  return db
    .select({
      id: repuestos.id,
      codigo: repuestos.codigo,
      nombre: repuestos.nombre,
      marcaId: repuestos.marcaId,
      marcaNombre: marcas.nombre,
      stockActual: repuestos.stockActual,
      stockMinimo: repuestos.stockMinimo,
      precioPublico: repuestos.precioPublico,
      precioCosto: repuestos.precioCosto,
    })
    .from(repuestos)
    .leftJoin(marcas, eq(marcas.id, repuestos.marcaId))
    .where(and(...condiciones))
    .orderBy(asc(marcas.nombre), asc(repuestos.nombre));
}

export async function crearPedidoConItems(
  nota: string | null,
  candidatos: Array<{
    id: number; codigo: string | null; nombre: string | null; marcaNombre: string | null;
    stockActual: number | null; stockMinimo: number | null; precioPublico: number | null;
  }>,
) {
  return db.transaction(async (tx) => {
    const [pedido] = await tx
      .insert(pedidosCompra)
      .values({ fecha: ahoraArgentinaISO(), nota })
      .returning();

    const items = candidatos.map((c) => {
      const cantidad = (c.stockMinimo ?? 0) - (c.stockActual ?? 0);
      const precio = c.precioPublico;
      const total = precio != null ? precio * cantidad : null;
      return {
        pedidoId: pedido.id,
        repuestoId: c.id,
        codigo: c.codigo,
        nombre: c.nombre,
        marcaNombre: c.marcaNombre,
        stockActual: c.stockActual,
        stockMinimo: c.stockMinimo,
        cantidadAPedir: cantidad,
        precioUnitario: precio,
        totalEstimado: total,
      };
    });

    const filas = await tx.insert(pedidoItems).values(items).returning();

    const repuestoIds = candidatos.map((c) => c.id);
    if (repuestoIds.length) await tx.delete(listaCompra).where(inArray(listaCompra.repuestoId, repuestoIds));

    return { pedido, items: filas };
  });
}

/** La lista de compra: carrito manual, arranca vacío. */
export async function listarListaCompra(marcaId?: number) {
  const condiciones = [];
  if (marcaId) condiciones.push(eq(repuestos.marcaId, marcaId));

  return db
    .select({
      id: repuestos.id,
      codigo: repuestos.codigo,
      nombre: repuestos.nombre,
      marcaId: repuestos.marcaId,
      marcaNombre: marcas.nombre,
      stockActual: repuestos.stockActual,
      stockMinimo: repuestos.stockMinimo,
      precioPublico: repuestos.precioPublico,
      precioCosto: repuestos.precioCosto,
      agregadoEn: listaCompra.agregadoEn,
    })
    .from(listaCompra)
    .innerJoin(repuestos, eq(repuestos.id, listaCompra.repuestoId))
    .leftJoin(marcas, eq(marcas.id, repuestos.marcaId))
    .where(condiciones.length ? and(...condiciones) : undefined)
    .orderBy(asc(marcas.nombre), asc(repuestos.nombre));
}

export async function agregarAListaCompra(repuestoId: number) {
  await db.insert(listaCompra)
    .values({ repuestoId, agregadoEn: ahoraArgentinaISO() })
    .onConflictDoNothing({ target: listaCompra.repuestoId });
}

export async function quitarDeListaCompra(repuestoId: number) {
  await db.delete(listaCompra).where(eq(listaCompra.repuestoId, repuestoId));
}

export async function estaEnListaCompra(repuestoId: number) {
  const [row] = await db.select({ id: listaCompra.id }).from(listaCompra).where(eq(listaCompra.repuestoId, repuestoId)).limit(1);
  return Boolean(row);
}

export async function buscarPedidoPorId(pedidoId: number) {
  const [row] = await db.select().from(pedidosCompra).where(eq(pedidosCompra.id, pedidoId)).limit(1);
  return row;
}

export async function itemsDePedido(pedidoId: number) {
  return db
    .select()
    .from(pedidoItems)
    .where(eq(pedidoItems.pedidoId, pedidoId))
    .orderBy(asc(pedidoItems.marcaNombre), asc(pedidoItems.nombre));
}

export async function eliminarPedido(pedidoId: number) {
  await db.transaction(async (tx) => {
    await tx.delete(pedidoItems).where(eq(pedidoItems.pedidoId, pedidoId));
    await tx.delete(pedidosCompra).where(eq(pedidosCompra.id, pedidoId));
  });
}
