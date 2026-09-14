import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { configuracion } from "@/db/schema";

export async function leer(clave: string): Promise<string | undefined> {
  const [row] = await db.select().from(configuracion).where(eq(configuracion.clave, clave)).limit(1);
  return row?.valor;
}

export async function guardar(clave: string, valor: string, fecha: string): Promise<void> {
  await db
    .insert(configuracion)
    .values({ clave, valor, actualizadoEn: fecha })
    .onConflictDoUpdate({ target: configuracion.clave, set: { valor, actualizadoEn: fecha } });
}
