CREATE TABLE "auditoria" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" integer,
	"accion" text NOT NULL,
	"entidad" text NOT NULL,
	"entidad_id" integer,
	"detalle" text,
	"fecha" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flags_calidad_datos" (
	"id" serial PRIMARY KEY NOT NULL,
	"modelo_id" integer NOT NULL,
	"km_intervalo" integer NOT NULL,
	"item" text,
	"nota" text
);
--> statement-breakpoint
CREATE TABLE "fluidos" (
	"id" serial PRIMARY KEY NOT NULL,
	"marca_id" integer,
	"codigo_marca" text,
	"codigo_puma" text,
	"nombre" text,
	"categoria" text,
	"uso_aplicacion" text,
	"presentacion" text,
	"litros_por_envase" double precision,
	"precio_concesionario" double precision,
	"precio_publico" double precision,
	"precio_litro" double precision,
	"fecha_lista" text
);
--> statement-breakpoint
CREATE TABLE "lubricacion" (
	"id" serial PRIMARY KEY NOT NULL,
	"marca_id" integer NOT NULL,
	"modelo_patron" text NOT NULL,
	"cilindradas" text,
	"motor" text,
	"trans_manual" text,
	"trans_automatica" text,
	"diferencial" text,
	"frenos" text,
	"refrigerante" text,
	"fuente" text,
	"vigencia" text
);
--> statement-breakpoint
CREATE TABLE "marcas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"slug" text,
	"orden" integer DEFAULT 100,
	"color" text,
	"grupo_catalogo" text,
	"es_vehiculos" boolean DEFAULT true,
	"activa" boolean DEFAULT true,
	CONSTRAINT "marcas_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "modelos" (
	"id" serial PRIMARY KEY NOT NULL,
	"marca_id" integer NOT NULL,
	"nombre" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedido_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"pedido_id" integer NOT NULL,
	"repuesto_id" integer,
	"codigo" text,
	"nombre" text,
	"marca_nombre" text,
	"stock_actual" integer,
	"stock_minimo" integer,
	"cantidad_a_pedir" integer,
	"precio_unitario" double precision,
	"total_estimado" double precision
);
--> statement-breakpoint
CREATE TABLE "pedidos_compra" (
	"id" serial PRIMARY KEY NOT NULL,
	"fecha" text NOT NULL,
	"nota" text
);
--> statement-breakpoint
CREATE TABLE "plan_checklist" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"item" text,
	"accion" text
);
--> statement-breakpoint
CREATE TABLE "plan_fluidos" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"fluido_id" integer,
	"nombre" text,
	"producto" text,
	"litros" double precision,
	"total" double precision
);
--> statement-breakpoint
CREATE TABLE "plan_repuestos" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"repuesto_id" integer,
	"nombre" text,
	"codigo" text,
	"cantidad" double precision,
	"precio_unitario" double precision,
	"total" double precision
);
--> statement-breakpoint
CREATE TABLE "planes_mantenimiento" (
	"id" serial PRIMARY KEY NOT NULL,
	"modelo_id" integer NOT NULL,
	"km_intervalo" integer NOT NULL,
	"mano_obra_horas" double precision,
	"mano_obra_costo" double precision,
	"total_repuestos" double precision,
	"total_fluidos" double precision,
	"costo_total" double precision,
	"precio_sugerido" double precision,
	"es_flat_rate" boolean DEFAULT false,
	"notas" text,
	"pack_repuestos_costo" double precision,
	"pack_mano_obra_costo" double precision
);
--> statement-breakpoint
CREATE TABLE "repuestos" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" text NOT NULL,
	"nombre" text,
	"marca_id" integer,
	"categoria" text,
	"precio_publico" double precision,
	"precio_costo" double precision,
	"descuento_pct" double precision,
	"fecha_lista" text,
	"es_stock_gestionado" boolean DEFAULT false,
	"stock_actual" integer DEFAULT 0,
	"stock_minimo" integer DEFAULT 0,
	"stock_ficticio" boolean DEFAULT false NOT NULL,
	"fuente" text
);
--> statement-breakpoint
CREATE TABLE "sesiones" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" integer NOT NULL,
	"token_hash" text NOT NULL,
	"creada_en" text NOT NULL,
	"expira_en" text NOT NULL,
	CONSTRAINT "sesiones_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "sustituciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"marca_id" integer,
	"codigo_anterior" text,
	"codigo_nuevo" text,
	"clase" text,
	"tipo_intercambio" text,
	"cantidad_minima" double precision,
	"fecha_vigencia" text
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"usuario" text NOT NULL,
	"password_hash" text NOT NULL,
	"password_salt" text NOT NULL,
	"rol" text DEFAULT 'lector' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"pendiente" boolean DEFAULT false NOT NULL,
	"creado_en" text NOT NULL,
	"ultimo_acceso" text,
	CONSTRAINT "usuarios_usuario_unique" UNIQUE("usuario")
);
--> statement-breakpoint
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flags_calidad_datos" ADD CONSTRAINT "flags_calidad_datos_modelo_id_modelos_id_fk" FOREIGN KEY ("modelo_id") REFERENCES "public"."modelos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fluidos" ADD CONSTRAINT "fluidos_marca_id_marcas_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marcas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lubricacion" ADD CONSTRAINT "lubricacion_marca_id_marcas_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marcas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modelos" ADD CONSTRAINT "modelos_marca_id_marcas_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marcas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido_items" ADD CONSTRAINT "pedido_items_pedido_id_pedidos_compra_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos_compra"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido_items" ADD CONSTRAINT "pedido_items_repuesto_id_repuestos_id_fk" FOREIGN KEY ("repuesto_id") REFERENCES "public"."repuestos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_checklist" ADD CONSTRAINT "plan_checklist_plan_id_planes_mantenimiento_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."planes_mantenimiento"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_fluidos" ADD CONSTRAINT "plan_fluidos_plan_id_planes_mantenimiento_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."planes_mantenimiento"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_fluidos" ADD CONSTRAINT "plan_fluidos_fluido_id_fluidos_id_fk" FOREIGN KEY ("fluido_id") REFERENCES "public"."fluidos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_repuestos" ADD CONSTRAINT "plan_repuestos_plan_id_planes_mantenimiento_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."planes_mantenimiento"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_repuestos" ADD CONSTRAINT "plan_repuestos_repuesto_id_repuestos_id_fk" FOREIGN KEY ("repuesto_id") REFERENCES "public"."repuestos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planes_mantenimiento" ADD CONSTRAINT "planes_mantenimiento_modelo_id_modelos_id_fk" FOREIGN KEY ("modelo_id") REFERENCES "public"."modelos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repuestos" ADD CONSTRAINT "repuestos_marca_id_marcas_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marcas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sustituciones" ADD CONSTRAINT "sustituciones_marca_id_marcas_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marcas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_auditoria_fecha" ON "auditoria" USING btree ("fecha");--> statement-breakpoint
CREATE INDEX "idx_flags_modelo_km" ON "flags_calidad_datos" USING btree ("modelo_id","km_intervalo");--> statement-breakpoint
CREATE INDEX "idx_fluidos_codigo_marca" ON "fluidos" USING btree ("codigo_marca");--> statement-breakpoint
CREATE INDEX "idx_fluidos_codigo_puma" ON "fluidos" USING btree ("codigo_puma");--> statement-breakpoint
CREATE UNIQUE INDEX "lubricacion_marca_modelo_cil_unico" ON "lubricacion" USING btree ("marca_id","modelo_patron","cilindradas");--> statement-breakpoint
CREATE INDEX "idx_lubricacion_marca" ON "lubricacion" USING btree ("marca_id");--> statement-breakpoint
CREATE UNIQUE INDEX "modelos_marca_nombre_unico" ON "modelos" USING btree ("marca_id","nombre");--> statement-breakpoint
CREATE INDEX "idx_pedido_items_pedido" ON "pedido_items" USING btree ("pedido_id");--> statement-breakpoint
CREATE INDEX "idx_plan_checklist_plan" ON "plan_checklist" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_plan_fluidos_plan" ON "plan_fluidos" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_plan_repuestos_plan" ON "plan_repuestos" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_plan_repuestos_repuesto" ON "plan_repuestos" USING btree ("repuesto_id");--> statement-breakpoint
CREATE UNIQUE INDEX "planes_modelo_km_unico" ON "planes_mantenimiento" USING btree ("modelo_id","km_intervalo");--> statement-breakpoint
CREATE INDEX "idx_planes_modelo" ON "planes_mantenimiento" USING btree ("modelo_id");--> statement-breakpoint
CREATE UNIQUE INDEX "repuestos_marca_codigo_unico" ON "repuestos" USING btree ("marca_id","codigo");--> statement-breakpoint
CREATE INDEX "idx_repuestos_codigo" ON "repuestos" USING btree ("codigo");--> statement-breakpoint
CREATE INDEX "idx_repuestos_nombre" ON "repuestos" USING btree ("nombre");--> statement-breakpoint
CREATE INDEX "idx_sesiones_token" ON "sesiones" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_sustituciones_anterior" ON "sustituciones" USING btree ("codigo_anterior");--> statement-breakpoint
CREATE INDEX "idx_sustituciones_nuevo" ON "sustituciones" USING btree ("codigo_nuevo");