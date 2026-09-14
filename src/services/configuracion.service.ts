/**
 * Parámetros del taller. Por ahora hay uno solo: cuánto se cobra la hora de
 * trabajo, que antes estaba escrito en el código del cotizador.
 */
import * as repo from "@/repositories/configuracion.repository";
import * as auditoriaRepo from "@/repositories/auditoria.repository";
import { exigirPermiso } from "@/services/auth.service";
import { ahoraArgentinaISO } from "@/lib/fecha";
import { ValidationError } from "@/domain/errors";
import type { Usuario } from "@/domain/types";

export const CLAVE_VALOR_HORA = "valor_hora";

/** El valor con el que se venían calculando los planes ya cargados: si nadie
 *  lo cambió todavía, las cuentas dan igual que antes. */
const VALOR_HORA_POR_DEFECTO = 250_000;

export async function valorHora(): Promise<number> {
  const guardado = await repo.leer(CLAVE_VALOR_HORA);
  const n = Number(guardado);
  return Number.isFinite(n) && n > 0 ? n : VALOR_HORA_POR_DEFECTO;
}

export async function actualizarValorHora(actor: Usuario | null, valor: number): Promise<number> {
  const usuario = await exigirPermiso(actor, "servicios:editar");
  if (!Number.isFinite(valor) || valor <= 0) throw new ValidationError("El valor de la hora tiene que ser mayor a 0");

  const anterior = await valorHora();
  await repo.guardar(CLAVE_VALOR_HORA, String(valor), ahoraArgentinaISO());
  await auditoriaRepo.registrar({
    usuarioId: usuario.id, accion: "editar", entidad: "configuracion",
    detalle: `Valor de la hora: ${anterior} -> ${valor}`, fecha: ahoraArgentinaISO(),
  });
  return valor;
}
