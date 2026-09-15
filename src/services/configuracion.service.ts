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
export const CLAVE_EMPRESA = "nombre_empresa";

const EMPRESA_POR_DEFECTO = "Panel de Servicio";

export async function nombreEmpresa(): Promise<string> {
  return (await repo.leer(CLAVE_EMPRESA))?.trim() || EMPRESA_POR_DEFECTO;
}

export async function actualizarNombreEmpresa(actor: Usuario | null, nombre: string): Promise<string> {
  const usuario = await exigirPermiso(actor, "usuarios:gestionar");
  const limpio = nombre.trim();
  if (!limpio) throw new ValidationError("Escribí el nombre del taller o concesionario");
  if (limpio.length > 80) throw new ValidationError("El nombre no puede superar los 80 caracteres");

  await repo.guardar(CLAVE_EMPRESA, limpio, ahoraArgentinaISO());
  await auditoriaRepo.registrar({
    usuarioId: usuario.id, accion: "editar", entidad: "configuracion",
    detalle: `Nombre del taller: "${limpio}"`, fecha: ahoraArgentinaISO(),
  });
  return limpio;
}

/** El valor con el que se venían calculando los planes ya cargados: si nadie
 *  lo cambió todavía, las cuentas dan igual que antes. */
const VALOR_HORA_POR_DEFECTO = 250_000;

/** Techo del valor hora. No es una regla del taller: es para que un cero de
 *  más al cargarlo no se lleve puesto el precio de todos los services. */
const MAX_VALOR_HORA = 100_000_000;

export async function valorHora(): Promise<number> {
  const guardado = await repo.leer(CLAVE_VALOR_HORA);
  const n = Number(guardado);
  return Number.isFinite(n) && n > 0 ? n : VALOR_HORA_POR_DEFECTO;
}

export async function actualizarValorHora(actor: Usuario | null, valor: number): Promise<number> {
  const usuario = await exigirPermiso(actor, "servicios:editar");
  if (!Number.isFinite(valor) || valor <= 0) throw new ValidationError("El valor de la hora tiene que ser mayor a 0");
  if (valor > MAX_VALOR_HORA) throw new ValidationError("El valor de la hora es demasiado alto: revisá lo que cargaste");

  const anterior = await valorHora();
  await repo.guardar(CLAVE_VALOR_HORA, String(valor), ahoraArgentinaISO());
  await auditoriaRepo.registrar({
    usuarioId: usuario.id, accion: "editar", entidad: "configuracion",
    detalle: `Valor de la hora: ${anterior} -> ${valor}`, fecha: ahoraArgentinaISO(),
  });
  return valor;
}
