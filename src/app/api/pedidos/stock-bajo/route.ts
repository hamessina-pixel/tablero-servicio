import { NextRequest, NextResponse } from "next/server";
import * as pedidosService from "@/services/pedidos.service";
import { requireUsuario } from "@/services/auth.service";
import { errorResponse, parseIntParamOpcional } from "@/lib/http";
import { usuarioActualDesde } from "@/lib/sesion";

// Lista qué falta en el depósito y a qué costo reponerlo: es información de
// compras, no de mostrador.
export async function GET(req: NextRequest) {
  try {
    const { usuario } = await usuarioActualDesde(req);
    requireUsuario(usuario);
    const marcaId = parseIntParamOpcional(req.nextUrl.searchParams.get("marcaId"), "marcaId");
    const data = await pedidosService.listarStockBajo(marcaId);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
