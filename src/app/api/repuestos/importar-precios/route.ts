import { NextRequest, NextResponse } from "next/server";
import * as repuestosService from "@/services/repuestos.service";
import { exigirPermiso } from "@/services/auth.service";
import { ValidationError } from "@/domain/errors";
import { errorResponse, numeroSeguro, requireIntParam } from "@/lib/http";
import { sinCache } from "@/lib/cache";
import { usuarioActualDesde } from "@/lib/sesion";
import type { FilaPrecioLote } from "@/repositories/repuestos.repository";

/** Cuántas piezas entran por llamada. La pantalla manda de a 1.000; el tope
 *  deja margen para eso y corta un envío desmedido, que en la base se arma
 *  como cuatro cadenas gigantes en memoria. */
const MAX_FILAS = 5_000;

/** Tamaño máximo del cuerpo. Se mira el Content-Length antes de leer nada:
 *  sin esto, cualquiera sin sesión podía hacer que el servidor cargue en
 *  memoria un archivo enorme y recién después recibir su 401. */
const MAX_BYTES = 4 * 1024 * 1024;

function validarBody(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>;
  const marcaId = requireIntParam(String(b.marcaId ?? ""), "marcaId");
  const filasCrudas = Array.isArray(b.filas) ? b.filas : [];
  if (filasCrudas.length > MAX_FILAS) {
    throw new ValidationError(`Mandá hasta ${MAX_FILAS} piezas por vez`);
  }
  const filas: FilaPrecioLote[] = filasCrudas
    .map((f) => {
      const fila = (f ?? {}) as Record<string, unknown>;
      return {
        codigo: typeof fila.codigo === "string" ? fila.codigo.slice(0, 80) : "",
        precioPublico: numeroSeguro(fila.precioPublico, "precio público"),
        precioCosto: numeroSeguro(fila.precioCosto, "precio de costo"),
        descuentoPct: numeroSeguro(fila.descuentoPct, "descuento", { max: 1 }),
      };
    })
    .filter((f) => f.codigo.trim());
  const origen = typeof b.origen === "string" ? b.origen.slice(0, 120) : undefined;
  return { marcaId, filas, origen };
}

export async function POST(req: NextRequest) {
  try {
    // El permiso se exige ANTES de leer el cuerpo: quien no puede importar
    // precios no debería poder hacer que el servidor lea nada.
    const { usuario: actor } = await usuarioActualDesde(req);
    await exigirPermiso(actor, "precios:editar");

    const largo = Number(req.headers.get("content-length") ?? 0);
    if (largo > MAX_BYTES) throw new ValidationError("El envío es demasiado grande: mandalo en partes más chicas");

    const { marcaId, filas, origen } = validarBody(await req.json().catch(() => null));
    const data = await repuestosService.actualizarPreciosMasivo(actor, marcaId, filas, { origen });
    return NextResponse.json(data, { headers: sinCache() });
  } catch (err) {
    return errorResponse(err);
  }
}
