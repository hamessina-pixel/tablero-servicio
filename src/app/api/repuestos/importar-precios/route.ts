import { NextRequest, NextResponse } from "next/server";
import * as repuestosService from "@/services/repuestos.service";
import { errorResponse, requireIntParam } from "@/lib/http";
import { usuarioActualDesde } from "@/lib/sesion";

interface FilaPrecio {
  codigo: string;
  precioPublico?: number | null;
  precioCosto?: number | null;
}

function validarBody(body: unknown): { marcaId: number; filas: FilaPrecio[] } {
  const b = (body ?? {}) as Record<string, unknown>;
  const marcaId = requireIntParam(String(b.marcaId ?? ""), "marcaId");
  const filasCrudas = Array.isArray(b.filas) ? b.filas : [];
  const filas: FilaPrecio[] = filasCrudas
    .map((f) => {
      const fila = (f ?? {}) as Record<string, unknown>;
      return {
        codigo: typeof fila.codigo === "string" ? fila.codigo : "",
        precioPublico: typeof fila.precioPublico === "number" ? fila.precioPublico : null,
        precioCosto: typeof fila.precioCosto === "number" ? fila.precioCosto : null,
      };
    })
    .filter((f) => f.codigo.trim());
  return { marcaId, filas };
}

export async function POST(req: NextRequest) {
  try {
    const { usuario: actor } = await usuarioActualDesde(req);
    const { marcaId, filas } = validarBody(await req.json().catch(() => null));
    const data = await repuestosService.actualizarPreciosMasivo(actor, marcaId, filas);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
