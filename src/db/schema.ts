/**
 * Esquema Drizzle — traducción 1:1 de dashboard/backend/app/db/schema.sql (SQLite).
 *
 * Fidelidad ante todo: los campos que en SQLite son TEXT siguen siendo `text`
 * acá, incluidos los que parecen fechas (fecha_lista, vigencia, fecha_vigencia)
 * — vienen de catálogos de terceros en formatos no uniformes ("07.09.2026",
 * "edición 2025 · consultada 10/09/2026") y forzarlos a `timestamp` ahora
 * rompería filas reales sin haber verificado cada formato contra los datos.
 * Los campos de fecha que sí genera el propio sistema (creado_en, expira_en,
 * fecha de auditoría) quedan como candidatos a `timestamp` en una etapa
 * posterior, una vez confirmado con datos reales — no se tocan acá.
 *
 * Los flags 0/1 de SQLite (activa, es_stock_gestionado, etc.) sí pasan a
 * `boolean`: es una traducción segura, sin ambigüedad de formato.
 */
import {
  pgTable, serial, integer, text, doublePrecision, boolean, uniqueIndex, index,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Marcas y modelos
// ---------------------------------------------------------------------------

export const marcas = pgTable("marcas", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull().unique(),
  slug: text("slug"),
  orden: integer("orden").default(100),
  color: text("color"),
  grupoCatalogo: text("grupo_catalogo"),
  esVehiculos: boolean("es_vehiculos").default(true),
  activa: boolean("activa").default(true),
});

export const modelos = pgTable("modelos", {
  id: serial("id").primaryKey(),
  marcaId: integer("marca_id").notNull().references(() => marcas.id),
  nombre: text("nombre").notNull(),
}, (t) => ({
  marcaNombreUnico: uniqueIndex("modelos_marca_nombre_unico").on(t.marcaId, t.nombre),
}));

// ---------------------------------------------------------------------------
// Repuestos y fluidos
// ---------------------------------------------------------------------------

export const repuestos = pgTable("repuestos", {
  id: serial("id").primaryKey(),
  codigo: text("codigo").notNull(),
  nombre: text("nombre"),
  marcaId: integer("marca_id").references(() => marcas.id),
  // 'catalogo' | 'plan' | 'stock' | 'accesorio' | 'manual' | 'multimarca'
  categoria: text("categoria"),
  precioPublico: doublePrecision("precio_publico"),
  precioCosto: doublePrecision("precio_costo"),
  descuentoPct: doublePrecision("descuento_pct"),
  fechaLista: text("fecha_lista"),
  esStockGestionado: boolean("es_stock_gestionado").default(false),
  stockActual: integer("stock_actual").default(0),
  stockMinimo: integer("stock_minimo").default(0),
  // Unidades de prueba, no contadas en el depósito real (ver stock_ficticio.py).
  stockFicticio: boolean("stock_ficticio").notNull().default(false),
  fuente: text("fuente"),
}, (t) => ({
  marcaCodigoUnico: uniqueIndex("repuestos_marca_codigo_unico").on(t.marcaId, t.codigo),
  codigoIdx: index("idx_repuestos_codigo").on(t.codigo),
  nombreIdx: index("idx_repuestos_nombre").on(t.nombre),
}));

export const fluidos = pgTable("fluidos", {
  id: serial("id").primaryKey(),
  marcaId: integer("marca_id").references(() => marcas.id),
  codigoMarca: text("codigo_marca"),
  codigoPuma: text("codigo_puma"),
  nombre: text("nombre"),
  categoria: text("categoria"),
  usoAplicacion: text("uso_aplicacion"),
  presentacion: text("presentacion"),
  litrosPorEnvase: doublePrecision("litros_por_envase"),
  precioConcesionario: doublePrecision("precio_concesionario"),
  precioPublico: doublePrecision("precio_publico"),
  precioLitro: doublePrecision("precio_litro"),
  fechaLista: text("fecha_lista"),
}, (t) => ({
  codigoMarcaIdx: index("idx_fluidos_codigo_marca").on(t.codigoMarca),
  codigoPumaIdx: index("idx_fluidos_codigo_puma").on(t.codigoPuma),
}));

// ---------------------------------------------------------------------------
// Planes de mantenimiento (cotizador)
// ---------------------------------------------------------------------------

export const planesMantenimiento = pgTable("planes_mantenimiento", {
  id: serial("id").primaryKey(),
  modeloId: integer("modelo_id").notNull().references(() => modelos.id),
  kmIntervalo: integer("km_intervalo").notNull(),
  manoObraHoras: doublePrecision("mano_obra_horas"),
  manoObraCosto: doublePrecision("mano_obra_costo"),
  totalRepuestos: doublePrecision("total_repuestos"),
  totalFluidos: doublePrecision("total_fluidos"),
  costoTotal: doublePrecision("costo_total"),
  precioSugerido: doublePrecision("precio_sugerido"),
  esFlatRate: boolean("es_flat_rate").default(false),
  notas: text("notas"),
  // Desglose del pack de tarifa plana: el total del pack es FIJO (viene de la
  // terminal, nunca se toca); estas dos columnas dicen de qué se compone.
  packRepuestosCosto: doublePrecision("pack_repuestos_costo"),
  packManoObraCosto: doublePrecision("pack_mano_obra_costo"),
}, (t) => ({
  modeloKmUnico: uniqueIndex("planes_modelo_km_unico").on(t.modeloId, t.kmIntervalo),
  modeloIdx: index("idx_planes_modelo").on(t.modeloId),
}));

export const planRepuestos = pgTable("plan_repuestos", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => planesMantenimiento.id),
  repuestoId: integer("repuesto_id").references(() => repuestos.id),
  nombre: text("nombre"),
  codigo: text("codigo"),
  cantidad: doublePrecision("cantidad"),
  precioUnitario: doublePrecision("precio_unitario"),
  total: doublePrecision("total"),
}, (t) => ({
  planIdx: index("idx_plan_repuestos_plan").on(t.planId),
  repuestoIdx: index("idx_plan_repuestos_repuesto").on(t.repuestoId),
}));

export const planFluidos = pgTable("plan_fluidos", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => planesMantenimiento.id),
  fluidoId: integer("fluido_id").references(() => fluidos.id),
  nombre: text("nombre"),
  producto: text("producto"),
  litros: doublePrecision("litros"),
  total: doublePrecision("total"),
}, (t) => ({
  planIdx: index("idx_plan_fluidos_plan").on(t.planId),
}));

export const planChecklist = pgTable("plan_checklist", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => planesMantenimiento.id),
  item: text("item"),
  accion: text("accion"),
}, (t) => ({
  planIdx: index("idx_plan_checklist_plan").on(t.planId),
}));

export const flagsCalidadDatos = pgTable("flags_calidad_datos", {
  id: serial("id").primaryKey(),
  modeloId: integer("modelo_id").notNull().references(() => modelos.id),
  kmIntervalo: integer("km_intervalo").notNull(),
  item: text("item"),
  nota: text("nota"),
}, (t) => ({
  modeloKmIdx: index("idx_flags_modelo_km").on(t.modeloId, t.kmIntervalo),
}));

// ---------------------------------------------------------------------------
// Sustituciones (equivalencias entre códigos)
// ---------------------------------------------------------------------------

export const sustituciones = pgTable("sustituciones", {
  id: serial("id").primaryKey(),
  marcaId: integer("marca_id").references(() => marcas.id),
  codigoAnterior: text("codigo_anterior"),
  codigoNuevo: text("codigo_nuevo"),
  // S sustitución | A alternativa | M múltiple | T transformación
  clase: text("clase"),
  tipoIntercambio: text("tipo_intercambio"),
  cantidadMinima: doublePrecision("cantidad_minima"),
  fechaVigencia: text("fecha_vigencia"),
}, (t) => ({
  anteriorIdx: index("idx_sustituciones_anterior").on(t.codigoAnterior),
  nuevoIdx: index("idx_sustituciones_nuevo").on(t.codigoNuevo),
}));

// ---------------------------------------------------------------------------
// Pedidos de compra
// ---------------------------------------------------------------------------

export const pedidosCompra = pgTable("pedidos_compra", {
  id: serial("id").primaryKey(),
  fecha: text("fecha").notNull(),
  nota: text("nota"),
});

export const pedidoItems = pgTable("pedido_items", {
  id: serial("id").primaryKey(),
  pedidoId: integer("pedido_id").notNull().references(() => pedidosCompra.id),
  repuestoId: integer("repuesto_id").references(() => repuestos.id),
  codigo: text("codigo"),
  nombre: text("nombre"),
  marcaNombre: text("marca_nombre"),
  stockActual: integer("stock_actual"),
  stockMinimo: integer("stock_minimo"),
  cantidadAPedir: integer("cantidad_a_pedir"),
  precioUnitario: doublePrecision("precio_unitario"),
  totalEstimado: doublePrecision("total_estimado"),
}, (t) => ({
  pedidoIdx: index("idx_pedido_items_pedido").on(t.pedidoId),
}));

// ---------------------------------------------------------------------------
// Lubricación (guía TotalEnergies por modelo/cilindrada)
// ---------------------------------------------------------------------------

export const lubricacion = pgTable("lubricacion", {
  id: serial("id").primaryKey(),
  marcaId: integer("marca_id").notNull().references(() => marcas.id),
  modeloPatron: text("modelo_patron").notNull(),
  cilindradas: text("cilindradas"),
  motor: text("motor"),
  transManual: text("trans_manual"),
  transAutomatica: text("trans_automatica"),
  diferencial: text("diferencial"),
  frenos: text("frenos"),
  refrigerante: text("refrigerante"),
  fuente: text("fuente"),
  vigencia: text("vigencia"),
}, (t) => ({
  marcaModeloCilUnico: uniqueIndex("lubricacion_marca_modelo_cil_unico")
    .on(t.marcaId, t.modeloPatron, t.cilindradas),
  marcaIdx: index("idx_lubricacion_marca").on(t.marcaId),
}));

// ---------------------------------------------------------------------------
// Usuarios, sesiones y auditoría
// ---------------------------------------------------------------------------

export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  usuario: text("usuario").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  // admin | editor | ventas | lector
  rol: text("rol").notNull().default("lector"),
  activo: boolean("activo").notNull().default(true),
  pendiente: boolean("pendiente").notNull().default(false),
  creadoEn: text("creado_en").notNull(),
  ultimoAcceso: text("ultimo_acceso"),
});

export const sesiones = pgTable("sesiones", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").notNull().references(() => usuarios.id),
  tokenHash: text("token_hash").notNull().unique(),
  creadaEn: text("creada_en").notNull(),
  expiraEn: text("expira_en").notNull(),
}, (t) => ({
  tokenIdx: index("idx_sesiones_token").on(t.tokenHash),
}));

export const auditoria = pgTable("auditoria", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").references(() => usuarios.id),
  // 'crear' | 'editar' | 'eliminar'
  accion: text("accion").notNull(),
  // 'repuesto' | 'pedido'
  entidad: text("entidad").notNull(),
  entidadId: integer("entidad_id"),
  detalle: text("detalle"),
  fecha: text("fecha").notNull(),
}, (t) => ({
  fechaIdx: index("idx_auditoria_fecha").on(t.fecha),
}));
