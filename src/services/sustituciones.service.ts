import * as sustitucionesRepo from "@/repositories/sustituciones.repository";

export function marcasConSustituciones() {
  return sustitucionesRepo.marcasConSustituciones();
}

export function listarSustituciones(filtros: {
  q?: string; marcaId?: number; page?: number; pageSize?: number;
} = {}) {
  return sustitucionesRepo.listarSustituciones(filtros);
}
