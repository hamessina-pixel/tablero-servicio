import { NextResponse } from "next/server";
import * as dashboardService from "@/services/dashboard.service";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    const data = await dashboardService.resumen();
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
