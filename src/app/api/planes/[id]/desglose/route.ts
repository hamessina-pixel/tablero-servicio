import { NextRequest, NextResponse } from "next/server";
import * as planesService from "@/services/planes.service";
import { errorResponse, requireIntParam } from "@/lib/http";
import { usuarioActualDesde } from "@/lib/sesion";

const numero = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/planes/[id]/desglose">) {
  try {
    const { id } = await ctx.params;
    const { usuario: actor } = await usuarioActualDesde(req);
    const body = (await req.json().catch(() => ({}))) as { repuestos?: number | null; fluidos?: number | null };
    const data = await planesService.actualizarDesglose(actor, requireIntParam(id, "id"), {
      repuestos: numero(body.repuestos),
      fluidos: numero(body.fluidos),
    });
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
