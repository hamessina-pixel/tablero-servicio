import { NextRequest, NextResponse } from "next/server";
import * as configuracionService from "@/services/configuracion.service";
import { errorResponse } from "@/lib/http";
import { usuarioActualDesde } from "@/lib/sesion";

export async function GET() {
  try {
    return NextResponse.json({ valorHora: await configuracionService.valorHora() });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { usuario: actor } = await usuarioActualDesde(req);
    const body = (await req.json().catch(() => ({}))) as { valorHora?: number };
    const valorHora = await configuracionService.actualizarValorHora(actor, Number(body.valorHora));
    return NextResponse.json({ valorHora });
  } catch (err) {
    return errorResponse(err);
  }
}
