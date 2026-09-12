import { NextRequest, NextResponse } from "next/server";
import * as authService from "@/services/auth.service";
import { ValidationError } from "@/domain/errors";
import { errorResponse } from "@/lib/http";
import { opcionesCookieSesion, COOKIE_SESION } from "@/lib/sesion";

function validarBody(body: unknown): { usuario: string; password: string } {
  if (
    typeof body !== "object" || body === null
    || typeof (body as Record<string, unknown>).usuario !== "string"
    || typeof (body as Record<string, unknown>).password !== "string"
  ) {
    throw new ValidationError("Faltan campos: usuario, password");
  }
  return body as { usuario: string; password: string };
}

export async function POST(req: NextRequest) {
  try {
    const body = validarBody(await req.json().catch(() => null));
    const { usuario, token } = await authService.login(body.usuario, body.password);
    const res = NextResponse.json(usuario);
    res.cookies.set(COOKIE_SESION, token, opcionesCookieSesion());
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}
