import { NextRequest, NextResponse } from "next/server";
import * as fluidosService from "@/services/fluidos.service";
import { errorResponse } from "@/lib/http";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const data = await fluidosService.listarFluidos({
      q: searchParams.get("q") ?? undefined,
      categoria: searchParams.get("categoria") ?? undefined,
    });
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
