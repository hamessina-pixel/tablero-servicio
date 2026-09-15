import { NextRequest, NextResponse } from "next/server";
import * as authService from "@/services/auth.service";
import { errorResponse } from "@/lib/http";
import { sinCache } from "@/lib/cache";
import { COOKIE_SESION } from "@/lib/sesion";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_SESION)?.value;
    const data = await authService.me(token);
    return NextResponse.json(data, { headers: sinCache() });
  } catch (err) {
    return errorResponse(err);
  }
}
