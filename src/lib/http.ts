/**
 * Helpers compartidos por las API routes: traducir errores de dominio a
 * códigos HTTP, y parsear query params con el mismo criterio en todas partes.
 * Así el servicio nunca sabe nada de HTTP, y cada ruta no repite el mapeo.
 */
import { NextResponse } from "next/server";
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "@/domain/errors";

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
  if (err instanceof ValidationError) return NextResponse.json({ error: err.message }, { status: 400 });
  if (err instanceof ConflictError) return NextResponse.json({ error: err.message }, { status: 409 });
  if (err instanceof UnauthorizedError) return NextResponse.json({ error: err.message }, { status: 401 });
  if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 });
  // eslint-disable-next-line no-console
  console.error(err);
  return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
}

/** Entero opcional desde un query param; undefined si no vino. Lanza
 *  ValidationError (-> 400) si vino pero no es un entero válido. */
export function parseIntParamOpcional(raw: string | null, campo: string): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) throw new ValidationError(`${campo} inválido`);
  return n;
}

/** Entero obligatorio (típicamente un [id] de la URL). */
export function requireIntParam(raw: string, campo: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) throw new ValidationError(`${campo} inválido`);
  return n;
}

export function parseBoolParam(raw: string | null): boolean {
  return raw === "true" || raw === "1";
}

/** Tope de los importes y cantidades que entran por la API. Un número mayor a
 *  esto no es un precio del taller: es un error de carga o alguien probando
 *  qué rompe. `Infinity` entra por JSON como `1e400` y hay que frenarlo acá,
 *  porque una vez guardado arruina todas las cuentas que lo toquen. */
const TOPE_IMPORTE = 1_000_000_000_000;

/** Número que se puede guardar: finito, no negativo y dentro de un rango
 *  creíble. Devuelve null si no vino. */
export function numeroSeguro(
  valor: unknown,
  campo: string,
  opciones: { max?: number; min?: number } = {},
): number | null {
  if (valor == null) return null;
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    throw new ValidationError(`${campo} tiene que ser un número`);
  }
  const min = opciones.min ?? 0;
  const max = opciones.max ?? TOPE_IMPORTE;
  if (valor < min) throw new ValidationError(`${campo} no puede ser menor a ${min}`);
  if (valor > max) throw new ValidationError(`${campo} es demasiado grande`);
  return valor;
}
