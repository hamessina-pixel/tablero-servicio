import { NextRequest, NextResponse } from "next/server";
import * as marcasService from "@/services/marcas.service";
import { errorResponse, parseBoolParam } from "@/lib/http";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const data = await marcasService.listarMarcas({
      conModelos: parseBoolParam(searchParams.get("conModelos")),
      incluirInactivas: parseBoolParam(searchParams.get("incluirInactivas")),
    });
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
