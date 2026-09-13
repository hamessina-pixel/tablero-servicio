CREATE TABLE "lista_compra" (
	"id" serial PRIMARY KEY NOT NULL,
	"repuesto_id" integer NOT NULL,
	"agregado_en" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lista_compra" ADD CONSTRAINT "lista_compra_repuesto_id_repuestos_id_fk" FOREIGN KEY ("repuesto_id") REFERENCES "public"."repuestos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lista_compra_repuesto_unico" ON "lista_compra" USING btree ("repuesto_id");