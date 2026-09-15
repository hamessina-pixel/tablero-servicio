import { NextRequest, NextResponse } from "next/server";
import * as pedidosService from "@/services/pedidos.service";
import { errorResponse } from "@/lib/http";
import { sinCache } from "@/lib/cache";
import { usuarioActualDesde } from "@/lib/sesion";

export async function GET() {
  try {
    const data = await pedidosService.listarPedidos();
    return NextResponse.json(data, { headers: sinCache() });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { usuario: actor } = await usuarioActualDesde(req);
    const body = (await req.json().catch(() => ({}))) as { marcaId?: number; nota?: string };
    const data = await pedidosService.crearPedido(actor, body);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
