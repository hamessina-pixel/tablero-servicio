import * as fluidosRepo from "@/repositories/fluidos.repository";

export function listarFluidos(filtros: { q?: string; categoria?: string } = {}) {
  return fluidosRepo.listarFluidos(filtros);
}
