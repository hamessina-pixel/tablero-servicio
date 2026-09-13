/**
 * Lógica de negocio de pedidos de compra. Espejo de
 * dashboard/backend/app/routers/pedidos.py.
 */
import * as pedidosRepo from "@/repositories/pedidos.repository";
import * as auditoriaRepo from "@/repositories/auditoria.repository";
import { exigirPermiso } from "@/services/auth.service";
import { ahoraArgentinaISO } from "@/lib/fecha";
import { NotFoundError, ValidationError } from "@/domain/errors";
import type { Usuario } from "@/domain/types";

export function listarPedidos() {
  return pedidosRepo.listarPedidos();
}

export function listarStockBajo(marcaId?: number) {
  return pedidosRepo.repuestosConStockBajo(marcaId);
}

export function listarListaCompra(marcaId?: number) {
  return pedidosRepo.listarListaCompra(marcaId);
}

export async function agregarAListaCompra(actor: Usuario | null, repuestoId: number) {
  await exigirPermiso(actor, "pedidos:crear");
  await pedidosRepo.agregarAListaCompra(repuestoId);
}

export async function quitarDeListaCompra(actor: Usuario | null, repuestoId: number) {
  await exigirPermiso(actor, "pedidos:crear");
  await pedidosRepo.quitarDeListaCompra(repuestoId);
}

export async function crearPedido(actor: Usuario | null, datos: { marcaId?: number; nota?: string | null }) {
  const usuario = await exigirPermiso(actor, "pedidos:crear");

  const candidatos = await pedidosRepo.listarListaCompra(datos.marcaId);
  if (!candidatos.length) {
    throw new ValidationError("La lista de compra está vacía: agregá repuestos antes de generar el pedido");
  }
  const { pedido, items } = await pedidosRepo.crearPedidoConItems(datos.nota ?? null, candidatos);
  await auditoriaRepo.registrar({
    usuarioId: usuario.id, accion: "crear", entidad: "pedido", entidadId: pedido.id,
    detalle: `${items.length} ítems`, fecha: ahoraArgentinaISO(),
  });
  return { ...pedido, items };
}

export async function obtenerPedido(pedidoId: number) {
  const pedido = await pedidosRepo.buscarPedidoPorId(pedidoId);
  if (!pedido) throw new NotFoundError("Pedido no encontrado");
  const items = await pedidosRepo.itemsDePedido(pedidoId);
  return { ...pedido, items };
}

export async function eliminarPedido(actor: Usuario | null, pedidoId: number) {
  const usuario = await exigirPermiso(actor, "pedidos:eliminar");
  const existe = await pedidosRepo.buscarPedidoPorId(pedidoId);
  if (!existe) throw new NotFoundError("Pedido no encontrado");
  await pedidosRepo.eliminarPedido(pedidoId);
  await auditoriaRepo.registrar({
    usuarioId: usuario.id, accion: "eliminar", entidad: "pedido", entidadId: pedidoId,
    fecha: ahoraArgentinaISO(),
  });
}
