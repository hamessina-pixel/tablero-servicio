/**
 * Acceso a datos de `usuarios`. Espejo de las consultas de
 * dashboard/backend/app/routers/auth.py.
 */
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { usuarios } from "@/db/schema";
import type { Usuario } from "@/domain/types";

export async function hayUsuarios(): Promise<boolean> {
  const [row] = await db.select({ id: usuarios.id }).from(usuarios).limit(1);
  return !!row;
}

export async function adminsActivos(exceptoId?: number): Promise<number> {
  const condiciones = [eq(usuarios.rol, "admin"), eq(usuarios.activo, true)];
  if (exceptoId !== undefined) condiciones.push(ne(usuarios.id, exceptoId));
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(usuarios)
    .where(and(...condiciones));
  return n;
}

export async function buscarPorUsuario(usuario: string): Promise<Usuario | undefined> {
  const [row] = await db.select().from(usuarios).where(eq(usuarios.usuario, usuario)).limit(1);
  return row;
}

export async function buscarPorId(id: number): Promise<Usuario | undefined> {
  const [row] = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
  return row;
}

export async function listar(): Promise<Usuario[]> {
  return db.select().from(usuarios).orderBy(desc(usuarios.pendiente), asc(usuarios.nombre));
}

export async function crear(datos: {
  nombre: string;
  usuario: string;
  passwordHash: string;
  passwordSalt: string;
  rol: string;
  activo: boolean;
  pendiente: boolean;
  creadoEn: string;
}): Promise<Usuario> {
  const [row] = await db.insert(usuarios).values(datos).returning();
  return row;
}

export async function actualizar(
  id: number,
  cambios: Partial<{
    nombre: string;
    rol: string;
    activo: boolean;
    pendiente: boolean;
    passwordHash: string;
    passwordSalt: string;
  }>,
): Promise<Usuario | undefined> {
  const set: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(cambios)) {
    if (v !== undefined) set[k] = v;
  }
  if (Object.keys(set).length === 0) return buscarPorId(id);
  await db.update(usuarios).set(set).where(eq(usuarios.id, id));
  return buscarPorId(id);
}

export async function actualizarUltimoAcceso(id: number, fecha: string): Promise<void> {
  await db.update(usuarios).set({ ultimoAcceso: fecha }).where(eq(usuarios.id, id));
}

export async function eliminar(id: number): Promise<void> {
  await db.delete(usuarios).where(eq(usuarios.id, id));
}
