import { NextRequest, NextResponse } from "next/server";
import * as planesService from "@/services/planes.service";
import { errorResponse, requireIntParam } from "@/lib/http";
import { sinCache } from "@/lib/cache";
import { usuarioActualDesde } from "@/lib/sesion";
import { sinCostoSiNoHaySesion, sinDesgloseSiNoHaySesion } from "@/lib/visibilidad";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/planes/[id]">) {
  try {
    const { id } = await ctx.params;
    const { usuario } = await usuarioActualDesde(req);
    const data = await planesService.obtenerPlan(requireIntParam(id, "id"));
    const visible = sinDesgloseSiNoHaySesion({
      ...data,
      repuestos: data.repuestos.map((r) => sinCostoSiNoHaySesion(r, usuario)),
      fluidos: data.fluidos.map((f) => sinCostoSiNoHaySesion(f, usuario)),
    }, usuario);
    return NextResponse.json(visible, { headers: sinCache() });
  } catch (err) {
    return errorResponse(err);
  }
}
