import { NextRequest, NextResponse } from "next/server";
import * as repuestosService from "@/services/repuestos.service";
import { errorResponse, requireIntParam } from "@/lib/http";
import { usuarioActualDesde } from "@/lib/sesion";

interface SustitucionBody {
  codigoNuevo: string;
  precioPublico?: number | null;
  precioCosto?: number | null;
}

function validarBody(body: unknown): SustitucionBody {
  const b = (body ?? {}) as Record<string, unknown>;
  const codigoNuevo = typeof b.codigoNuevo === "string" ? b.codigoNuevo : "";
  const out: SustitucionBody = { codigoNuevo };
  if (typeof b.precioPublico === "number" || b.precioPublico === null) out.precioPublico = b.precioPublico as number | null;
  if (typeof b.precioCosto === "number" || b.precioCosto === null) out.precioCosto = b.precioCosto as number | null;
  return out;
}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/repuestos/[id]/sustitucion">) {
  try {
    const { id } = await ctx.params;
    const { usuario: actor } = await usuarioActualDesde(req);
    const body = validarBody(await req.json().catch(() => null));
    const data = await repuestosService.registrarSustitucionFiat(actor, requireIntParam(id, "id"), body);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
