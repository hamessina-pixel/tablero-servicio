import { NextRequest, NextResponse } from "next/server";
import * as lubricacionService from "@/services/lubricacion.service";
import { errorResponse, parseIntParamOpcional } from "@/lib/http";

export async function GET(req: NextRequest) {
  try {
    const marcaId = parseIntParamOpcional(req.nextUrl.searchParams.get("marcaId"), "marcaId");
    const data = await lubricacionService.listarLubricacion(marcaId);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
