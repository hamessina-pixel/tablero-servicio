import { NextRequest, NextResponse } from "next/server";
import * as dashboardService from "@/services/dashboard.service";
import { requireUsuario } from "@/services/auth.service";
import { errorResponse } from "@/lib/http";
import { usuarioActualDesde } from "@/lib/sesion";

// El panel resume cuánta plata hay inmovilizada en el depósito y cómo se
// reparte por marca. Es el número más sensible del negocio, así que no sale
// sin sesión, aunque el resto de las pantallas de consulta sí sean abiertas.
export async function GET(req: NextRequest) {
  try {
    const { usuario } = await usuarioActualDesde(req);
    requireUsuario(usuario);
    const data = await dashboardService.resumen();
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
