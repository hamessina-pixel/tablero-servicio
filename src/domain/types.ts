/**
 * Tipos de dominio. Los tipos "de fila" (Marca, Repuesto, etc.) se infieren
 * directamente del esquema Drizzle — una sola fuente de verdad, sin duplicar
 * columnas a mano. Los tipos compuestos (los que arma la capa de servicios
 * combinando varias tablas) se declaran acá.
 */
import type {
  marcas, modelos, repuestos, fluidos, planesMantenimiento, planRepuestos,
  planFluidos, planChecklist, flagsCalidadDatos, sustituciones, pedidosCompra,
  pedidoItems, lubricacion, usuarios, sesiones, auditoria,
} from "@/db/schema";

export type Marca = typeof marcas.$inferSelect;
export type Modelo = typeof modelos.$inferSelect;
export type Repuesto = typeof repuestos.$inferSelect;
export type Fluido = typeof fluidos.$inferSelect;
export type PlanMantenimiento = typeof planesMantenimiento.$inferSelect;
export type PlanRepuesto = typeof planRepuestos.$inferSelect;
export type PlanFluido = typeof planFluidos.$inferSelect;
export type PlanChecklistItem = typeof planChecklist.$inferSelect;
export type FlagCalidadDatos = typeof flagsCalidadDatos.$inferSelect;
export type Sustitucion = typeof sustituciones.$inferSelect;
export type PedidoCompra = typeof pedidosCompra.$inferSelect;
export type PedidoItem = typeof pedidoItems.$inferSelect;
export type Lubricacion = typeof lubricacion.$inferSelect;
export type Usuario = typeof usuarios.$inferSelect;
export type Sesion = typeof sesiones.$inferSelect;
export type Auditoria = typeof auditoria.$inferSelect;

/**
 * Fila de stock resuelta para un código (propio o equivalente/sustituto).
 * Espejo de lo que devolvía `buscar_equivalentes_con_stock` en el backend
 * viejo (dashboard/backend/app/routers/repuestos.py) — se usa tanto para el
 * propio repuesto como para cada equivalente encontrado en la cadena de
 * sustituciones, y también como relleno "no encontrado" cuando el código
 * equivalente no existe en ningún catálogo.
 */
export interface StockDeCodigo {
  codigo: string;
  nombre: string | null;
  marcaNombre: string | null;
  esStockGestionado: boolean;
  stockActual: number | null;
  stockMinimo: number | null;
  stockFicticio: boolean;
  precioPublico: number | null;
  precioCosto: number | null;
}

/** Ítem de un plan (repuesto o fluido) ya enriquecido con su stock en vivo y
 *  sus equivalentes — lo que el Cotizador necesita para pintar la fila. */
export interface ItemDePlanConStock {
  nombre: string | null;
  codigo?: string | null;
  producto?: string | null;
  cantidad?: number | null;
  litros?: number | null;
  precioUnitario?: number | null;
  total: number | null;
  esStockGestionado: boolean;
  stockActual: number | null;
  stockMinimo: number | null;
  precioPublico: number | null;
  precioCosto: number | null;
  equivalentes: StockDeCodigo[];
}

export interface PlanConDetalle extends PlanMantenimiento {
  modeloNombre: string;
  marcaNombre: string;
  marcaId: number;
  repuestos: ItemDePlanConStock[];
  fluidos: ItemDePlanConStock[];
  checklist: PlanChecklistItem[];
  flag: { item: string | null; nota: string | null } | null;
}

export interface ResumenPorModelo {
  modeloId: number;
  modelo: string;
  marca: string;
  costoTotal: number;
  pvpTotal: number;
  repTotal: number;
  fluTotal: number;
  moTotal: number;
  maxServicio: number;
  costoKm: number;
}

export interface GrupoBusquedaRepuesto {
  codigo: string | null;
  nombre: string | null;
  usos: { marca: string; modelo: string; kmIntervalo: number }[];
}

export interface ResumenDashboard {
  marcas: number;
  modelos: number;
  repuestosTotal: number;
  repuestosStockGestionado: number;
  repuestosStockBajo: number;
  fluidos: number;
  planesMantenimiento: number;
  sustituciones: number;
  valorStockGestionado: number;
  repuestosPorMarca: { marca: string; repuestos: number }[];
  modelosPorMarca: { marca: string; modelos: number }[];
  costoPorKmTop: { modelo: string; marca: string; costoPorKm: number }[];
}
