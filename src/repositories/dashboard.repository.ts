/**
 * Acceso a datos para el panel de Inicio. Espejo EXACTO de
 * dashboard/backend/app/routers/dashboard.py — incluidas las exclusiones de
 * stock_ficticio (unidades de prueba, ver stock_ficticio.py) del valor de
 * stock y de las tarjetas de stock del panel: esos números son plata real.
 */
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

/** Las tablas que este panel puede contar. El nombre de la tabla no se puede
 *  pasar como parámetro de SQL, va interpolado con `sql.raw`, así que se
 *  acepta solo de esta lista: si mañana alguien llama a `contarFilas` con algo
 *  que venga de la URL, corta acá y no en la base. */
const TABLAS_CONTABLES = [
  "marcas", "modelos", "repuestos", "fluidos", "planes_mantenimiento", "sustituciones",
] as const;

type TablaContable = (typeof TABLAS_CONTABLES)[number];

export async function contarFilas(tabla: TablaContable, whereSql?: ReturnType<typeof sql>) {
  if (!TABLAS_CONTABLES.includes(tabla)) throw new Error(`Tabla no permitida: ${tabla}`);
  const query = whereSql
    ? sql`SELECT COUNT(*)::int AS n FROM ${sql.raw(tabla)} WHERE ${whereSql}`
    : sql`SELECT COUNT(*)::int AS n FROM ${sql.raw(tabla)}`;
  const { rows } = await db.execute(query);
  return Number(rows[0].n);
}

export async function resumenDashboard() {
  const [
    marcasVehiculos, modelos, repuestosTotal, stockGestionado, stockBajo,
    fluidos, planes, sustituciones,
  ] = await Promise.all([
    contarFilas("marcas", sql`es_vehiculos = true AND activa = true`),
    contarFilas("modelos"),
    contarFilas("repuestos"),
    contarFilas("repuestos", sql`es_stock_gestionado = true AND stock_ficticio = false`),
    contarFilas(
      "repuestos",
      sql`es_stock_gestionado = true AND stock_ficticio = false AND stock_actual < stock_minimo`,
    ),
    contarFilas("fluidos"),
    contarFilas("planes_mantenimiento"),
    contarFilas("sustituciones"),
  ]);

  const { rows: valorRows } = await db.execute(sql`
    SELECT COALESCE(SUM(stock_actual * precio_costo), 0) AS v
      FROM repuestos
     WHERE es_stock_gestionado = true AND stock_ficticio = false
       AND stock_actual > 0 AND precio_costo > 0
  `);
  const valorStockGestionado = Number(valorRows[0].v);

  const { rows: valorPorMarca } = await db.execute(sql`
    SELECT ma.nombre AS marca, COALESCE(SUM(r.stock_actual * r.precio_costo), 0) AS valor
      FROM marcas ma LEFT JOIN repuestos r
        ON r.marca_id = ma.id AND r.es_stock_gestionado = true AND r.stock_ficticio = false
           AND r.stock_actual > 0 AND r.precio_costo > 0
     GROUP BY ma.id, ma.nombre
     ORDER BY valor DESC
  `);

  const { rows: porMarca } = await db.execute(sql`
    SELECT ma.nombre AS marca, COUNT(r.id)::int AS repuestos
      FROM marcas ma LEFT JOIN repuestos r ON r.marca_id = ma.id
     GROUP BY ma.id, ma.nombre ORDER BY ma.nombre
  `);

  const { rows: modelosPorMarca } = await db.execute(sql`
    SELECT ma.nombre AS marca, COUNT(mo.id)::int AS modelos
      FROM marcas ma LEFT JOIN modelos mo ON mo.marca_id = ma.id
     GROUP BY ma.id, ma.nombre ORDER BY ma.nombre
  `);

  const { rows: topCostoKm } = await db.execute(sql`
    SELECT mo.nombre AS modelo, ma.nombre AS marca,
           AVG(pm.costo_total * 1.0 / NULLIF(pm.km_intervalo, 0)) AS costo_por_km
      FROM planes_mantenimiento pm
      JOIN modelos mo ON mo.id = pm.modelo_id
      JOIN marcas ma ON ma.id = mo.marca_id
     WHERE pm.costo_total IS NOT NULL AND pm.km_intervalo > 0
     GROUP BY mo.id, mo.nombre, ma.nombre
     ORDER BY costo_por_km DESC
     LIMIT 8
  `);

  return {
    marcas: marcasVehiculos,
    modelos,
    repuestosTotal,
    repuestosStockGestionado: stockGestionado,
    repuestosStockBajo: stockBajo,
    fluidos,
    planesMantenimiento: planes,
    sustituciones,
    valorStockGestionado,
    valorStockPorMarca: valorPorMarca as Array<{ marca: string; valor: number | string }>,
    repuestosPorMarca: porMarca as Array<{ marca: string; repuestos: number }>,
    modelosPorMarca: modelosPorMarca as Array<{ marca: string; modelos: number }>,
    costoPorKmTop: topCostoKm as Array<{ modelo: string; marca: string; costo_por_km: number | null }>,
  };
}
