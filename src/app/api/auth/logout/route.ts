import { NextRequest, NextResponse } from "next/server";
import * as authService from "@/services/auth.service";
import { errorResponse } from "@/lib/http";
import { COOKIE_SESION } from "@/lib/sesion";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_SESION)?.value;
    await authService.logout(token);
    const res = NextResponse.json({ ok: true });
    // Con path explícito: se seteó con path "/" al loguear, y el borrado solo
    // "pega" si coincide path/dominio con el original.
    res.cookies.set(COOKIE_SESION, "", { path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}
