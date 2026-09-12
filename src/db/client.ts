/**
 * Cliente Drizzle sobre el driver WebSocket de Neon (`neon-serverless`, con
 * `Pool`) y no el driver HTTP (`neon-http`).
 *
 * Motivo: `neon-http` manda cada consulta como un request HTTP independiente
 * y NO soporta `db.transaction()` — confirmado en la práctica: crear un
 * pedido con sus ítems (dos INSERT que tienen que confirmarse juntos o
 * ninguno) tira "No transactions support in neon-http driver". Cualquier
 * escritura de más de una tabla en esta app necesita esa atomicidad, así
 * que el driver por WebSocket es la base correcta desde ahora, no un ajuste
 * posterior.
 *
 * El runtime de producción (funciones serverless de Vercel) puede correr en
 * una versión de Node menor a 22, donde no existe el `WebSocket` global — por
 * eso se fija explícitamente `ws` como implementación, tal como recomienda la
 * documentación de Neon para entornos serverless.
 */
import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "Falta DATABASE_URL. Copiá .env.local.example a .env.local y completá la " +
    "connection string de Neon (la que tiene '-pooler' en el host).",
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });
