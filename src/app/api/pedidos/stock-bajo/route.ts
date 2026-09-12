import { NextRequest, NextResponse } from "next/server";
import * as pedidosService from "@/services/pedidos.service";
import { errorResponse, parseIntParamOpcional } from "@/lib/http";

export async function GET(req: NextRequest) {
  try {
    const marcaId = parseIntParamOpcional(req.nextUrl.searchParams.get("marcaId"), "marcaId");
    const data = await pedidosService.listarStockBajo(marcaId);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
