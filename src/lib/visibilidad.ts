/**
 * Qué ve del catálogo alguien que no inició sesión.
 *
 * Consultar repuestos es libre a propósito (alguien en el mostrador busca un
 * código sin loguearse), pero el precio de costo y el descuento de
 * concesionario no son parte de eso: son el margen del negocio, y la app está
 * publicada en internet. El precio público sí queda visible, que es
 * justamente el que se le dice al cliente.
 */
import type { ItemDePlanConStock, PlanConDetalle, ResumenPorModelo, Usuario } from "@/domain/types";

export function sinCostoSiNoHaySesion<T extends { precioCosto?: number | null; descuentoPct?: number | null }>(
  fila: T,
  usuario: Usuario | null,
): T {
  if (usuario) return fila;
  return { ...fila, precioCosto: null, descuentoPct: null };
}

/**
 * Qué ve de un service alguien que no inició sesión: qué incluye el trabajo y
 * cuánto sale, que es lo que se le dice al cliente. Lo que se tapa es cómo se
 * compone ese precio — cuánto es repuestos, cuánto fluidos y cuánto mano de
 * obra —, porque de ahí sale el valor hora y la estructura de precios del
 * taller, y la app está publicada en internet.
 *
 * También se tapan los importes por ítem: son precio público (el costo real ya
 * lo tapa sinCostoSiNoHaySesion), pero sumándolos se reconstruye la misma
 * composición, así que taparla a medias no taparía nada.
 */
export function sinDesgloseSiNoHaySesion<T extends Partial<PlanConDetalle>>(
  plan: T,
  usuario: Usuario | null,
): T {
  if (usuario) return plan;
  const item = (i: ItemDePlanConStock): ItemDePlanConStock => ({
    ...i, total: null, precioUnitario: null, manoObraHoras: null,
  });
  return {
    ...plan,
    totalRepuestos: null,
    totalFluidos: null,
    manoObraCosto: null,
    manoObraHoras: null,
    packRepuestosCosto: null,
    packManoObraCosto: null,
    desgloseRepuestos: null,
    desgloseFluidos: null,
    repuestos: plan.repuestos?.map(item),
    fluidos: plan.fluidos?.map(item),
    // La pantalla necesita saber que los números no vinieron, para mostrar solo
    // el precio en vez de un desglose lleno de ceros.
    sinDesglose: true,
  };
}

/** Lo mismo para el comparador: queda el precio del plan y lo que sale por km,
 *  se va el reparto entre repuestos, fluidos y mano de obra. */
export function resumenSinDesgloseSiNoHaySesion(
  fila: ResumenPorModelo,
  usuario: Usuario | null,
): ResumenPorModelo {
  if (usuario) return fila;
  return { ...fila, repTotal: 0, fluTotal: 0, moTotal: 0 };
}
