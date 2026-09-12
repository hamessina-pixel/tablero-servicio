import { NextRequest, NextResponse } from "next/server";
import * as service from "@/services/cotizacionesGuardadas.service";
import { errorResponse } from "@/lib/http";
import { usuarioActualDesde } from "@/lib/sesion";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") ?? undefined;
    const data = await service.buscarCotizaciones(q);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { usuario: actor } = await usuarioActualDesde(req);
    const body = await req.json().catch(() => ({}));
    const data = await service.guardarCotizacion(actor, body);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
