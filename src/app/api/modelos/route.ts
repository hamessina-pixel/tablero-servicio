import { NextRequest, NextResponse } from "next/server";
import * as modelosService from "@/services/modelos.service";
import { errorResponse, parseIntParamOpcional } from "@/lib/http";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const marcaId = parseIntParamOpcional(searchParams.get("marcaId"), "marcaId");
    const data = await modelosService.listarModelos(marcaId);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
