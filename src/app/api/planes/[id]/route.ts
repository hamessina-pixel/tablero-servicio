import { NextResponse } from "next/server";
import * as planesService from "@/services/planes.service";
import { errorResponse, requireIntParam } from "@/lib/http";

export async function GET(_req: Request, ctx: RouteContext<"/api/planes/[id]">) {
  try {
    const { id } = await ctx.params;
    const data = await planesService.obtenerPlan(requireIntParam(id, "id"));
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
