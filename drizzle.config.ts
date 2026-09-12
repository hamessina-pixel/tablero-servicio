/**
 * Configuración de drizzle-kit (generar/aplicar migraciones).
 *
 * Usa DATABASE_URL_DIRECT (sin el pooler de Neon) a propósito: las migraciones
 * son DDL (crear tablas, índices) y el pooler de Neon no soporta bien
 * sesiones largas o transacciones DDL — la conexión directa es la
 * recomendada por Neon para este caso.
 */
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
if (!url) {
  throw new Error("Falta DATABASE_URL_DIRECT (o DATABASE_URL) en .env.local");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
