import { NextResponse } from "next/server";
import * as planesService from "@/services/planes.service";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    const data = await planesService.resumenPorModelo();
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
