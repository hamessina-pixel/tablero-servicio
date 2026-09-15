import { NextRequest, NextResponse } from "next/server";
import * as repuestosService from "@/services/repuestos.service";
import { errorResponse, parseIntParamOpcional } from "@/lib/http";
import { cacheCompartido } from "@/lib/cache";

export async function GET(req: NextRequest) {
  try {
    const marcaId = parseIntParamOpcional(req.nextUrl.searchParams.get("marcaId"), "marcaId");
    const data = await repuestosService.conteoCategorias(marcaId);
    return NextResponse.json(data, { headers: cacheCompartido(120) });
  } catch (err) {
    return errorResponse(err);
  }
}
