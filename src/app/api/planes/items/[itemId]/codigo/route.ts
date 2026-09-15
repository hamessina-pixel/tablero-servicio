import { NextRequest, NextResponse } from "next/server";
import * as planesService from "@/services/planes.service";
import { errorResponse, requireIntParam } from "@/lib/http";
import { usuarioActualDesde } from "@/lib/sesion";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/planes/items/[itemId]/codigo">) {
  try {
    const { itemId } = await ctx.params;
    const { usuario: actor } = await usuarioActualDesde(req);
    const body = (await req.json().catch(() => ({}))) as { codigo?: string | null };
    const codigo = typeof body.codigo === "string" && body.codigo.trim() ? body.codigo.trim() : null;
    const data = await planesService.asignarCodigoAItem(actor, requireIntParam(itemId, "itemId"), codigo);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
