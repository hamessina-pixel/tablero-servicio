import { NextRequest, NextResponse } from "next/server";
import * as planesService from "@/services/planes.service";
import { errorResponse, numeroSeguro, requireIntParam } from "@/lib/http";
import { usuarioActualDesde } from "@/lib/sesion";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/planes/[id]/desglose">) {
  try {
    const { id } = await ctx.params;
    const { usuario: actor } = await usuarioActualDesde(req);
    const body = (await req.json().catch(() => ({}))) as { repuestos?: unknown; fluidos?: unknown };
    const data = await planesService.actualizarDesglose(actor, requireIntParam(id, "id"), {
      repuestos: numeroSeguro(body.repuestos, "El monto de repuestos"),
      fluidos: numeroSeguro(body.fluidos, "El monto de fluidos"),
    });
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
