import { NextRequest, NextResponse } from "next/server";
import * as sustitucionesService from "@/services/sustituciones.service";
import { errorResponse, parseIntParamOpcional } from "@/lib/http";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const data = await sustitucionesService.listarSustituciones({
      q: searchParams.get("q") ?? undefined,
      marcaId: parseIntParamOpcional(searchParams.get("marcaId"), "marcaId"),
      page: parseIntParamOpcional(searchParams.get("page"), "page"),
      pageSize: parseIntParamOpcional(searchParams.get("pageSize"), "pageSize"),
    });
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
