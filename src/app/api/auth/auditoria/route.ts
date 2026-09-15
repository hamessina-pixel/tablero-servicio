import { NextRequest, NextResponse } from "next/server";
import * as auditoriaService from "@/services/auditoria.service";
import { errorResponse, parseIntParamOpcional } from "@/lib/http";
import { sinCache } from "@/lib/cache";
import { usuarioActualDesde } from "@/lib/sesion";

export async function GET(req: NextRequest) {
  try {
    const { usuario: actor } = await usuarioActualDesde(req);
    const { searchParams } = req.nextUrl;
    const page = parseIntParamOpcional(searchParams.get("page"), "page") ?? 1;
    const pageSize = parseIntParamOpcional(searchParams.get("pageSize"), "pageSize") ?? 50;
    const data = await auditoriaService.listarAuditoria(actor, page, pageSize);
    return NextResponse.json(data, { headers: sinCache() });
  } catch (err) {
    return errorResponse(err);
  }
}
