import { NextRequest, NextResponse } from "next/server";
import * as planesService from "@/services/planes.service";
import { errorResponse, parseBoolParam, parseIntParamOpcional } from "@/lib/http";
import { sinCache } from "@/lib/cache";
import { usuarioActualDesde } from "@/lib/sesion";
import { sinDesgloseSiNoHaySesion } from "@/lib/visibilidad";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const { usuario } = await usuarioActualDesde(req);
    const data = await planesService.listarPlanes({
      modeloId: parseIntParamOpcional(searchParams.get("modeloId"), "modeloId"),
      marcaId: parseIntParamOpcional(searchParams.get("marcaId"), "marcaId"),
      incluirPreview: parseBoolParam(searchParams.get("incluirPreview")),
    });
    return NextResponse.json(
      data.map((p) => sinDesgloseSiNoHaySesion(p, usuario)),
      { headers: sinCache() },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
