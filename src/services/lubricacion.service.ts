/**
 * Lógica de negocio de lubricación. Espejo de
 * dashboard/backend/app/routers/lubricacion.py.
 */
import * as lubricacionRepo from "@/repositories/lubricacion.repository";
import * as modelosRepo from "@/repositories/modelos.repository";
import type { Lubricacion } from "@/domain/types";

const RE_CILINDRADA = /\b(\d\.\d)\b/;

function extraerCilindrada(nombreModelo: string | null): string | null {
  const m = RE_CILINDRADA.exec(nombreModelo ?? "");
  return m ? m[1] : null;
}

/**
 * Devuelve la fila de lubricación que corresponde a un modelo, o null.
 *
 * El emparejamiento es deliberadamente estricto: tienen que coincidir el
 * modelo Y la cilindrada. Un Partner 1.4 y un Partner 1.6 llevan aceites
 * distintos, así que dar por buena la fila de al lado porque el nombre se
 * parece sería inventar una recomendación técnica. Si la guía no cubre esa
 * cilindrada, se devuelve null y la pantalla lo dice.
 */
export async function buscarParaModelo(
  marcaId: number,
  nombreModelo: string | null,
): Promise<Lubricacion | null> {
  const nombre = (nombreModelo ?? "").toUpperCase();
  const cilindrada = extraerCilindrada(nombre);
  if (!cilindrada) return null;

  const filas = await lubricacionRepo.filasDeMarca(marcaId);
  const candidatas: Array<{ largoPatron: number; fila: Lubricacion }> = [];

  for (const fila of filas) {
    const patron = (fila.modeloPatron ?? "").toUpperCase();
    if (!patron || !nombre.startsWith(patron)) continue;
    const cubiertas = (fila.cilindradas ?? "")
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    if (cubiertas.length && !cubiertas.includes(cilindrada)) continue;
    candidatas.push({ largoPatron: patron.length, fila });
  }

  if (!candidatas.length) return null;
  // Con "C3" y "C3 AIRCROSS" compitiendo, gana el patrón más largo.
  candidatas.sort((a, b) => b.largoPatron - a.largoPatron);
  return candidatas[0].fila;
}

export interface ResultadoLubricacionModelo {
  encontrado: boolean;
  modelo?: string;
  motivo?: string;
}

export async function lubricacionDeModelo(
  modeloId: number,
): Promise<(ResultadoLubricacionModelo & Partial<Lubricacion>)> {
  const modelo = await modelosRepo.buscarModeloPorId(modeloId);
  if (!modelo) return { encontrado: false, motivo: "modelo inexistente" };

  const lub = await buscarParaModelo(modelo.marcaId, modelo.nombre);
  if (!lub) {
    const hay = await lubricacionRepo.contarFilasDeMarca(modelo.marcaId);
    return {
      encontrado: false,
      modelo: modelo.nombre,
      motivo: hay ? "la guía no cubre esta cilindrada" : "no hay tabla de lubricación cargada para esta marca",
    };
  }
  return { encontrado: true, modelo: modelo.nombre, ...lub };
}

export function listarLubricacion(marcaId?: number) {
  return lubricacionRepo.listarLubricacion(marcaId);
}
