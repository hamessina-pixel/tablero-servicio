import { NextResponse } from "next/server";
import * as sustitucionesService from "@/services/sustituciones.service";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    const data = await sustitucionesService.marcasConSustituciones();
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
