import { NextRequest, NextResponse } from "next/server";
import * as repuestosService from "@/services/repuestos.service";
import { ValidationError } from "@/domain/errors";
import { errorResponse } from "@/lib/http";
import { usuarioActualDesde } from "@/lib/sesion";
import { sinCostoSiNoHaySesion } from "@/lib/visibilidad";

export async function GET(req: NextRequest) {
  try {
    const codigo = req.nextUrl.searchParams.get("codigo");
    if (!codigo) throw new ValidationError("Falta el parámetro 'codigo'");
    const { usuario } = await usuarioActualDesde(req);
    const data = await repuestosService.obtenerEquivalentes(codigo);
    return NextResponse.json({
      ...data,
      propio: data.propio.map((p) => sinCostoSiNoHaySesion(p, usuario)),
      equivalentes: data.equivalentes.map((e) => sinCostoSiNoHaySesion(e, usuario)),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
