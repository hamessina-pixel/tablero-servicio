import { NextResponse } from "next/server";
import * as planesService from "@/services/planes.service";
import { errorResponse } from "@/lib/http";
import { cacheCompartido } from "@/lib/cache";

export async function GET() {
  try {
    const data = await planesService.resumenPorModelo();
    return NextResponse.json(data, { headers: cacheCompartido(300) });
  } catch (err) {
    return errorResponse(err);
  }
}
