import { NextResponse } from "next/server";
import * as authService from "@/services/auth.service";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    return NextResponse.json(await authService.estado());
  } catch (err) {
    return errorResponse(err);
  }
}
