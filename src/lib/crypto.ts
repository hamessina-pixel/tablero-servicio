/**
 * Hash de contraseñas y de tokens de sesión. Espejo BYTE A BYTE de
 * dashboard/backend/app/auth.py (hash_password, verificar_password,
 * _hash_token) — es imprescindible que sea compatible: los `password_hash` /
 * `password_salt` de la tabla `usuarios` ya migrada vienen calculados por el
 * sistema viejo, y si el algoritmo no coincide exactamente, todas las cuentas
 * existentes (Andy, el admin real) quedan sin poder loguearse.
 *
 * PBKDF2-HMAC-SHA256, 200.000 iteraciones, dklen 32 bytes — ese "32" es el
 * default de `hashlib.pbkdf2_hmac` en Python cuando no se pasa `dklen`
 * (usa el tamaño del digest de sha256), así que hay que fijarlo a mano acá
 * porque Node no tiene ese mismo default implícito.
 */
import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const PBKDF2_ITERACIONES = 200_000;
const PBKDF2_DKLEN_BYTES = 32;

function derivar(password: string, saltHex: string): string {
  return pbkdf2Sync(password, Buffer.from(saltHex, "hex"), PBKDF2_ITERACIONES, PBKDF2_DKLEN_BYTES, "sha256")
    .toString("hex");
}

export function hashPassword(password: string, saltExistente?: string): { hash: string; salt: string } {
  const salt = saltExistente ?? randomBytes(16).toString("hex");
  return { hash: derivar(password, salt), salt };
}

export function verificarPassword(password: string, hash: string, salt: string): boolean {
  const calculado = Buffer.from(derivar(password, salt), "hex");
  const esperado = Buffer.from(hash, "hex");
  if (calculado.length !== esperado.length) return false;
  return timingSafeEqual(calculado, esperado);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Token de sesión opaco — equivalente en fuerza a `secrets.token_urlsafe(32)`
 *  (32 bytes de azar, base64url sin padding). No necesita ser byte-compatible
 *  con el sistema viejo: cada login genera un token nuevo. */
export function generarTokenSesion(): string {
  return randomBytes(32).toString("base64url");
}
