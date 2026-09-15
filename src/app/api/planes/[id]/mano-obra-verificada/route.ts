import { NextRequest, NextResponse } from "next/server";
import * as planesService from "@/services/planes.service";
import { errorResponse, numeroSeguro, requireIntParam } from "@/lib/http";
import { usuarioActualDesde } from "@/lib/sesion";

/** Un service no lleva más de esto: el tope corta un valor absurdo antes de
 *  que quede guardado y ensucie todas las cuentas que lo usen. */
const MAX_HORAS = 999;

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/planes/[id]/mano-obra-verificada">) {
  try {
    const { id } = await ctx.params;
    const { usuario: actor } = await usuarioActualDesde(req);
    const body = (await req.json().catch(() => ({}))) as { horas?: unknown };
    const horas = numeroSeguro(body.horas, "Las horas", { max: MAX_HORAS });
    const data = await planesService.actualizarManoObraVerificada(actor, requireIntParam(id, "id"), horas);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
