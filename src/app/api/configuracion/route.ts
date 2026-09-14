import { NextRequest, NextResponse } from "next/server";
import * as configuracionService from "@/services/configuracion.service";
import { errorResponse } from "@/lib/http";
import { usuarioActualDesde } from "@/lib/sesion";

export async function GET() {
  try {
    const [valorHora, empresa] = await Promise.all([
      configuracionService.valorHora(),
      configuracionService.nombreEmpresa(),
    ]);
    return NextResponse.json({ valorHora, empresa });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { usuario: actor } = await usuarioActualDesde(req);
    const body = (await req.json().catch(() => ({}))) as { valorHora?: number; empresa?: string };

    if (typeof body.empresa === "string") await configuracionService.actualizarNombreEmpresa(actor, body.empresa);
    if (body.valorHora !== undefined) await configuracionService.actualizarValorHora(actor, Number(body.valorHora));

    const [valorHora, empresa] = await Promise.all([
      configuracionService.valorHora(),
      configuracionService.nombreEmpresa(),
    ]);
    return NextResponse.json({ valorHora, empresa });
  } catch (err) {
    return errorResponse(err);
  }
}
