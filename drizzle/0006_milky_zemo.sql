CREATE TABLE "configuracion" (
	"clave" text PRIMARY KEY NOT NULL,
	"valor" text NOT NULL,
	"actualizado_en" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plan_repuestos" ADD COLUMN "mano_obra_horas" double precision;