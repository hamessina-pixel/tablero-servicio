CREATE TABLE "permisos_rol" (
	"id" serial PRIMARY KEY NOT NULL,
	"rol" text NOT NULL,
	"permiso" text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "permisos_rol_unico" ON "permisos_rol" USING btree ("rol","permiso");--> statement-breakpoint
CREATE INDEX "idx_permisos_rol_rol" ON "permisos_rol" USING btree ("rol");