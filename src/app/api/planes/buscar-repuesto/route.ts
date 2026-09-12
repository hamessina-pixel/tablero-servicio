import { NextRequest, NextResponse } from "next/server";
import * as planesService from "@/services/planes.service";
import { ValidationError } from "@/domain/errors";
import { errorResponse } from "@/lib/http";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q");
    if (q == null) throw new ValidationError("Falta el parámetro 'q'");
    const data = await planesService.buscarRepuesto(q);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
