import { NextRequest, NextResponse } from "next/server";
import * as service from "@/services/cotizacionesGuardadas.service";
import { errorResponse, requireIntParam } from "@/lib/http";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/cotizaciones-guardadas/[id]">) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as { patente?: string; cliente?: string };
    const data = await service.actualizarCotizacion(requireIntParam(id, "id"), body);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/cotizaciones-guardadas/[id]">) {
  try {
    const { id } = await ctx.params;
    await service.eliminarCotizacion(requireIntParam(id, "id"));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
