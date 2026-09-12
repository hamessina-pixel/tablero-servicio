import * as marcasRepo from "@/repositories/marcas.repository";

/**
 * Lista las marcas con su configuración y cuánto tiene cargado cada una.
 * `conModelos=true` deja solo las que tienen modelos cargados — el Cotizador
 * lo usa para no ofrecer una marca a la que todavía no se le importaron los
 * planes, ni 'GENERAL', que es el cajón de stock del depósito.
 */
export function listarMarcas(opts: { conModelos?: boolean; incluirInactivas?: boolean } = {}) {
  return marcasRepo.listarMarcas(opts);
}
