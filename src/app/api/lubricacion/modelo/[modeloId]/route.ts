import { NextResponse } from "next/server";
import * as lubricacionService from "@/services/lubricacion.service";
import { errorResponse, requireIntParam } from "@/lib/http";

export async function GET(_req: Request, ctx: RouteContext<"/api/lubricacion/modelo/[modeloId]">) {
  try {
    const { modeloId } = await ctx.params;
    const data = await lubricacionService.lubricacionDeModelo(requireIntParam(modeloId, "modeloId"));
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
