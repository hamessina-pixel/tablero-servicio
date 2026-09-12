import { NextRequest, NextResponse } from "next/server";
import * as authService from "@/services/auth.service";
import { ValidationError } from "@/domain/errors";
import { errorResponse } from "@/lib/http";
import { opcionesCookieSesion, COOKIE_SESION } from "@/lib/sesion";

interface RegistroBody {
  nombre: string;
  usuario: string;
  password: string;
}

function validarBody(body: unknown): RegistroBody {
  if (
    typeof body !== "object" || body === null
    || typeof (body as Record<string, unknown>).nombre !== "string"
    || typeof (body as Record<string, unknown>).usuario !== "string"
    || typeof (body as Record<string, unknown>).password !== "string"
  ) {
    throw new ValidationError("Faltan campos: nombre, usuario, password");
  }
  return body as RegistroBody;
}

export async function POST(req: NextRequest) {
  try {
    const body = validarBody(await req.json().catch(() => null));
    const { token, ...resultadoPublico } = await authService.registro(body);
    const res = NextResponse.json(resultadoPublico);
    // El token va SOLO en la cookie httpOnly, nunca en el body: si además
    // viajara en el JSON, cualquier XSS en la página podría leerlo — es
    // exactamente lo que httpOnly está pensado para evitar.
    if (token) res.cookies.set(COOKIE_SESION, token, opcionesCookieSesion());
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}
