import { NextRequest, NextResponse } from "next/server";
import * as pedidosService from "@/services/pedidos.service";
import { errorResponse, parseIntParamOpcional } from "@/lib/http";
import { sinCache } from "@/lib/cache";
import { usuarioActualDesde } from "@/lib/sesion";
import { ValidationError } from "@/domain/errors";

export async function GET(req: NextRequest) {
  try {
    const marcaId = parseIntParamOpcional(req.nextUrl.searchParams.get("marcaId"), "marcaId");
    const data = await pedidosService.listarListaCompra(marcaId);
    return NextResponse.json(data, { headers: sinCache() });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { usuario: actor } = await usuarioActualDesde(req);
    const body = (await req.json().catch(() => ({}))) as { repuestoId?: number };
    if (!body.repuestoId) throw new ValidationError("Falta repuestoId");
    await pedidosService.agregarAListaCompra(actor, body.repuestoId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
