/**
 * Acceso a datos de `auditoria`. Espejo de registrar_auditoria y
 * GET /api/auth/auditoria en dashboard/backend/app/auth.py y routers/auth.py.
 */
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { auditoria, usuarios } from "@/db/schema";

export async function registrar(datos: {
  usuarioId: number;
  accion: string;
  entidad: string;
  entidadId?: number | null;
  detalle?: string | null;
  fecha: string;
}): Promise<void> {
  await db.insert(auditoria).values({
    usuarioId: datos.usuarioId,
    accion: datos.accion,
    entidad: datos.entidad,
    entidadId: datos.entidadId ?? null,
    detalle: datos.detalle ?? null,
    fecha: datos.fecha,
  });
}

export async function anonimizarUsuario(usuarioId: number): Promise<void> {
  await db.update(auditoria).set({ usuarioId: null }).where(eq(auditoria.usuarioId, usuarioId));
}

export async function listar(page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;
  const [{ total }] = await db.select({ total: sql<number>`count(*)`.mapWith(Number) }).from(auditoria);
  const items = await db
    .select({
      id: auditoria.id,
      usuarioId: auditoria.usuarioId,
      accion: auditoria.accion,
      entidad: auditoria.entidad,
      entidadId: auditoria.entidadId,
      detalle: auditoria.detalle,
      fecha: auditoria.fecha,
      usuarioNombre: usuarios.nombre,
    })
    .from(auditoria)
    .leftJoin(usuarios, eq(usuarios.id, auditoria.usuarioId))
    .orderBy(desc(auditoria.fecha))
    .limit(pageSize)
    .offset(offset);
  return { items, total };
}
