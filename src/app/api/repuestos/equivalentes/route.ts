import { NextRequest, NextResponse } from "next/server";
import * as repuestosService from "@/services/repuestos.service";
import { ValidationError } from "@/domain/errors";
import { errorResponse } from "@/lib/http";

export async function GET(req: NextRequest) {
  try {
    const codigo = req.nextUrl.searchParams.get("codigo");
    if (!codigo) throw new ValidationError("Falta el parámetro 'codigo'");
    const data = await repuestosService.obtenerEquivalentes(codigo);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
