import { NextRequest, NextResponse } from "next/server";
import * as planesService from "@/services/planes.service";
import { errorResponse, requireIntParam } from "@/lib/http";
import { usuarioActualDesde } from "@/lib/sesion";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/planes/[id]/mano-obra-verificada">) {
  try {
    const { id } = await ctx.params;
    const { usuario: actor } = await usuarioActualDesde(req);
    const body = (await req.json().catch(() => ({}))) as { horas?: number | null };
    const horas = typeof body.horas === "number" ? body.horas : null;
    const data = await planesService.actualizarManoObraVerificada(actor, requireIntParam(id, "id"), horas);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
