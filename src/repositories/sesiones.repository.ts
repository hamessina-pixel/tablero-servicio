/**
 * Acceso a datos de `sesiones`. Espejo de crear_sesion/invalidar_sesion/
 * get_current_user en dashboard/backend/app/auth.py.
 */
import { and, eq, gt, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { sesiones, usuarios } from "@/db/schema";
import { ahoraArgentinaISO } from "@/lib/fecha";
import type { Usuario } from "@/domain/types";

export async function crearSesion(
  usuarioId: number,
  tokenHash: string,
  creadaEn: string,
  expiraEn: string,
): Promise<void> {
  await db.insert(sesiones).values({ usuarioId, tokenHash, creadaEn, expiraEn });
}

/** Usuario activo cuya sesión (por token hasheado) todavía no venció.
 *  Espejo de get_current_user: JOIN sesiones+usuarios, expira_en > ahora,
 *  usuario activo. */
export async function usuarioDeSesionVigente(tokenHash: string): Promise<Usuario | undefined> {
  const [row] = await db
    .select({
      id: usuarios.id,
      nombre: usuarios.nombre,
      usuario: usuarios.usuario,
      passwordHash: usuarios.passwordHash,
      passwordSalt: usuarios.passwordSalt,
      rol: usuarios.rol,
      activo: usuarios.activo,
      pendiente: usuarios.pendiente,
      creadoEn: usuarios.creadoEn,
      ultimoAcceso: usuarios.ultimoAcceso,
      intentosFallidos: usuarios.intentosFallidos,
      bloqueadoHasta: usuarios.bloqueadoHasta,
    })
    .from(sesiones)
    .innerJoin(usuarios, eq(usuarios.id, sesiones.usuarioId))
    .where(
      and(
        eq(sesiones.tokenHash, tokenHash),
        gt(sesiones.expiraEn, ahoraArgentinaISO()),
        eq(usuarios.activo, true),
      ),
    )
    .limit(1);
  return row;
}

export async function invalidarPorTokenHash(tokenHash: string): Promise<void> {
  await db.delete(sesiones).where(eq(sesiones.tokenHash, tokenHash));
}

/** Borra todas las sesiones de un usuario — se usa al cambiar la contraseña,
 *  para que un token robado deje de servir en el acto (ver auth.service). Si
 *  el propio admin se cambia la clave a sí mismo, se puede excluir su token
 *  actual para no auto-desloguearlo. */
export async function invalidarTodasDeUsuario(usuarioId: number, exceptoTokenHash?: string): Promise<void> {
  const condiciones = [eq(sesiones.usuarioId, usuarioId)];
  if (exceptoTokenHash) condiciones.push(ne(sesiones.tokenHash, exceptoTokenHash));
  await db.delete(sesiones).where(and(...condiciones));
}

export async function invalidarTodasDe(usuarioId: number): Promise<void> {
  await db.delete(sesiones).where(eq(sesiones.usuarioId, usuarioId));
}
