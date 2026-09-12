CREATE TABLE "cotizaciones_guardadas" (
	"id" serial PRIMARY KEY NOT NULL,
	"marca_id" integer NOT NULL,
	"modelo_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"marca_nombre" text NOT NULL,
	"modelo_nombre" text NOT NULL,
	"km" integer NOT NULL,
	"patente" text,
	"cliente" text,
	"total" double precision NOT NULL,
	"pvp" double precision,
	"creado_por_id" integer,
	"creado_en" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cotizaciones_guardadas" ADD CONSTRAINT "cotizaciones_guardadas_marca_id_marcas_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marcas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotizaciones_guardadas" ADD CONSTRAINT "cotizaciones_guardadas_modelo_id_modelos_id_fk" FOREIGN KEY ("modelo_id") REFERENCES "public"."modelos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotizaciones_guardadas" ADD CONSTRAINT "cotizaciones_guardadas_plan_id_planes_mantenimiento_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."planes_mantenimiento"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotizaciones_guardadas" ADD CONSTRAINT "cotizaciones_guardadas_creado_por_id_usuarios_id_fk" FOREIGN KEY ("creado_por_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cotizaciones_guardadas_patente" ON "cotizaciones_guardadas" USING btree ("patente");--> statement-breakpoint
CREATE INDEX "idx_cotizaciones_guardadas_cliente" ON "cotizaciones_guardadas" USING btree ("cliente");--> statement-breakpoint
CREATE INDEX "idx_cotizaciones_guardadas_creado_en" ON "cotizaciones_guardadas" USING btree ("creado_en");