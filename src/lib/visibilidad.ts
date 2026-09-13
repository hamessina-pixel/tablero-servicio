/**
 * Qué ve del catálogo alguien que no inició sesión.
 *
 * Consultar repuestos es libre a propósito (alguien en el mostrador busca un
 * código sin loguearse), pero el precio de costo y el descuento de
 * concesionario no son parte de eso: son el margen del negocio, y la app está
 * publicada en internet. El precio público sí queda visible, que es
 * justamente el que se le dice al cliente.
 */
import type { Usuario } from "@/domain/types";

export function sinCostoSiNoHaySesion<T extends { precioCosto?: number | null; descuentoPct?: number | null }>(
  fila: T,
  usuario: Usuario | null,
): T {
  if (usuario) return fila;
  return { ...fila, precioCosto: null, descuentoPct: null };
}
