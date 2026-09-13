import { NextRequest, NextResponse } from "next/server";
import * as service from "@/services/cotizacionesGuardadas.service";
import { errorResponse, requireIntParam } from "@/lib/http";
import { usuarioActualDesde } from "@/lib/sesion";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/cotizaciones-guardadas/[id]">) {
  try {
    const { id } = await ctx.params;
    const { usuario: actor } = await usuarioActualDesde(req);
    const body = (await req.json().catch(() => ({}))) as { patente?: string; cliente?: string };
    const data = await service.actualizarCotizacion(actor, requireIntParam(id, "id"), body);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/cotizaciones-guardadas/[id]">) {
  try {
    const { id } = await ctx.params;
    const { usuario: actor } = await usuarioActualDesde(req);
    await service.eliminarCotizacion(actor, requireIntParam(id, "id"));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
