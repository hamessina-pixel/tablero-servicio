import { NextRequest, NextResponse } from "next/server";
import * as planesService from "@/services/planes.service";
import { errorResponse } from "@/lib/http";
import { sinCache } from "@/lib/cache";
import { usuarioActualDesde } from "@/lib/sesion";
import { resumenSinDesgloseSiNoHaySesion } from "@/lib/visibilidad";

export async function GET(req: NextRequest) {
  try {
    // Depende de la sesión (el desglose se tapa sin ella), así que ya no puede
    // quedar cacheada en un proxy para cualquiera.
    const { usuario } = await usuarioActualDesde(req);
    const data = await planesService.resumenPorModelo();
    return NextResponse.json(
      data.map((f) => resumenSinDesgloseSiNoHaySesion(f, usuario)),
      { headers: sinCache() },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
