import type { NextRequest } from "next/server";
import { resolverUsuarioActual, SESION_DIAS } from "@/services/auth.service";

export const COOKIE_SESION = "session_token";

/** Cómo setear la cookie de sesión en login/registro (primera cuenta).
 *
 * `secure` queda condicionado al entorno a propósito: el sistema viejo la
 * ponía en `false` fijo porque el taller sirve por HTTP plano en la LAN — acá
 * eso puede cambiar (el nuevo stack corre sobre Neon en la nube y en algún
 * momento se sirve por HTTPS), así que en producción va `secure: true` y en
 * desarrollo local (`next dev` sobre http://localhost) sigue en `false`,
 * porque una cookie `secure` no se guarda sobre HTTP.
 */
export function opcionesCookieSesion() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: SESION_DIAS * 24 * 3600,
    path: "/",
  };
}

export async function usuarioActualDesde(req: NextRequest) {
  const token = req.cookies.get(COOKIE_SESION)?.value;
  const usuario = await resolverUsuarioActual(token);
  return { token, usuario };
}
