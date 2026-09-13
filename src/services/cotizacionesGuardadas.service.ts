/**
 * Historial de cotizaciones guardadas: buscable por patente o cliente, sin
 * gate de permiso (espeja el criterio anterior en localStorage: cualquiera
 * podía guardar y volver a cargar una cotización).
 */
import * as repo from "@/repositories/cotizacionesGuardadas.repository";
import { NotFoundError, ValidationError } from "@/domain/errors";
import type { Usuario } from "@/domain/types";

export async function guardarCotizacion(actor: Usuario | null, datos: {
  marcaId?: number; modeloId?: number; planId?: number;
  marcaNombre?: string; modeloNombre?: string; km?: number;
  patente?: string; cliente?: string; total?: number; pvp?: number | null;
}) {
  if (!datos.marcaId || !datos.modeloId || !datos.planId || !datos.marcaNombre || !datos.modeloNombre || datos.km == null || datos.total == null) {
    throw new ValidationError("Faltan datos de la cotización para guardarla");
  }
  return repo.crearCotizacionGuardada({
    marcaId: datos.marcaId, modeloId: datos.modeloId, planId: datos.planId,
    marcaNombre: datos.marcaNombre, modeloNombre: datos.modeloNombre, km: datos.km,
    patente: datos.patente, cliente: datos.cliente,
    total: datos.total, pvp: datos.pvp,
    creadoPorId: actor?.id ?? null,
  });
}

export async function buscarCotizaciones(q?: string) {
  const texto = (q ?? "").trim();
  if (!texto) return repo.recientesCotizacionesGuardadas(30);
  if (texto.length < 2) throw new ValidationError("Escribí al menos 2 caracteres para buscar");
  return repo.buscarCotizacionesGuardadas(texto);
}

export async function actualizarCotizacion(id: number, cambios: { patente?: string; cliente?: string }) {
  const existente = await repo.buscarCotizacionGuardadaPorId(id);
  if (!existente) throw new NotFoundError("Cotización no encontrada");
  return repo.actualizarCotizacionGuardada(id, cambios);
}

export async function eliminarCotizacion(id: number) {
  const existente = await repo.buscarCotizacionGuardadaPorId(id);
  if (!existente) throw new NotFoundError("Cotización no encontrada");
  await repo.eliminarCotizacionGuardada(id);
}
