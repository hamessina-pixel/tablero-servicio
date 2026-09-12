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

export async function crearPedido(actor: Usuario | null, datos: { marcaId?: number; nota?: string | null }) {
  const usuario = exigirPermiso(actor, "pedidos:crear");

  const candidatos = await pedidosRepo.repuestosConStockBajo(datos.marcaId);
  if (!candidatos.length) {
    throw new ValidationError("No hay repuestos con stock bajo para generar un pedido");
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
  const usuario = exigirPermiso(actor, "pedidos:eliminar");
  const existe = await pedidosRepo.buscarPedidoPorId(pedidoId);
  if (!existe) throw new NotFoundError("Pedido no encontrado");
  await pedidosRepo.eliminarPedido(pedidoId);
  await auditoriaRepo.registrar({
    usuarioId: usuario.id, accion: "eliminar", entidad: "pedido", entidadId: pedidoId,
    fecha: ahoraArgentinaISO(),
  });
}
