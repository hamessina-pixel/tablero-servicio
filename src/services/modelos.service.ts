import * as modelosRepo from "@/repositories/modelos.repository";

export function listarModelos(marcaId?: number) {
  return modelosRepo.listarModelos(marcaId);
}
