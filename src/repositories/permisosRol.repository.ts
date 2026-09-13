/** Acceso a datos de `permisos_rol` — qué permiso tiene cada rol. */
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { permisosRol } from "@/db/schema";

export async function listarTodos(): Promise<Record<string, string[]>> {
  const filas = await db.select().from(permisosRol);
  const mapa: Record<string, string[]> = {};
  for (const f of filas) (mapa[f.rol] ??= []).push(f.permiso);
  return mapa;
}

export async function reemplazarPermisosDeRol(rol: string, permisos: string[]) {
  await db.transaction(async (tx) => {
    await tx.delete(permisosRol).where(eq(permisosRol.rol, rol));
    if (permisos.length) {
      await tx.insert(permisosRol).values(permisos.map((permiso) => ({ rol, permiso })));
    }
  });
}

export async function hayFilas(): Promise<boolean> {
  const [row] = await db.select({ id: permisosRol.id }).from(permisosRol).limit(1);
  return Boolean(row);
}

export async function sembrarSiVacio(porDefecto: Record<string, string[]>) {
  if (await hayFilas()) return;
  const filas = Object.entries(porDefecto).flatMap(([rol, permisos]) => permisos.map((permiso) => ({ rol, permiso })));
  if (filas.length) await db.insert(permisosRol).values(filas);
}
