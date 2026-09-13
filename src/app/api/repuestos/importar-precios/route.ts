import { NextRequest, NextResponse } from "next/server";
import * as repuestosService from "@/services/repuestos.service";
import { errorResponse, requireIntParam } from "@/lib/http";
import { usuarioActualDesde } from "@/lib/sesion";
import type { FilaPrecioLote } from "@/repositories/repuestos.repository";

function numeroOpcional(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function validarBody(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>;
  const marcaId = requireIntParam(String(b.marcaId ?? ""), "marcaId");
  const filasCrudas = Array.isArray(b.filas) ? b.filas : [];
  const filas: FilaPrecioLote[] = filasCrudas
    .map((f) => {
      const fila = (f ?? {}) as Record<string, unknown>;
      return {
        codigo: typeof fila.codigo === "string" ? fila.codigo : "",
        precioPublico: numeroOpcional(fila.precioPublico),
        precioCosto: numeroOpcional(fila.precioCosto),
        descuentoPct: numeroOpcional(fila.descuentoPct),
      };
    })
    .filter((f) => f.codigo.trim());
  return { marcaId, filas, auditar: b.auditar !== false };
}

export async function POST(req: NextRequest) {
  try {
    const { usuario: actor } = await usuarioActualDesde(req);
    const { marcaId, filas, auditar } = validarBody(await req.json().catch(() => null));
    const data = await repuestosService.actualizarPreciosMasivo(actor, marcaId, filas, { auditar });
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}

/** Cierre de una importación por lotes: deja el registro único de auditoría. */
export async function PATCH(req: NextRequest) {
  try {
    const { usuario: actor } = await usuarioActualDesde(req);
    const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    await repuestosService.auditarImportacionPrecios(actor, {
      actualizados: Number(b.actualizados) || 0,
      sinCambios: Number(b.sinCambios) || 0,
      noEncontrados: Number(b.noEncontrados) || 0,
      origen: typeof b.origen === "string" ? b.origen : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
