import { NextRequest, NextResponse } from "next/server";
import * as planesService from "@/services/planes.service";
import { errorResponse, parseBoolParam, parseIntParamOpcional } from "@/lib/http";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const data = await planesService.listarPlanes({
      modeloId: parseIntParamOpcional(searchParams.get("modeloId"), "modeloId"),
      marcaId: parseIntParamOpcional(searchParams.get("marcaId"), "marcaId"),
      incluirPreview: parseBoolParam(searchParams.get("incluirPreview")),
    });
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
