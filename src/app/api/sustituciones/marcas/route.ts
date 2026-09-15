import { NextResponse } from "next/server";
import * as sustitucionesService from "@/services/sustituciones.service";
import { errorResponse } from "@/lib/http";
import { cacheCompartido } from "@/lib/cache";

export async function GET() {
  try {
    const data = await sustitucionesService.marcasConSustituciones();
    return NextResponse.json(data, { headers: cacheCompartido(300) });
  } catch (err) {
    return errorResponse(err);
  }
}
