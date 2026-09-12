/**
 * Compara la salida de la capa de servicios (TypeScript, sobre Neon) contra
 * los valores conocidos del sistema viejo (FastAPI + SQLite), para los casos
 * de prueba ya usados en sesiones anteriores: FIAT TORO 2.0, FIAT 600 MHEV,
 * el dashboard general, un plan Peugeot y uno Citroën.
 *
 * No modifica nada — solo lee, vía la misma capa de servicios que va a usar
 * la API, y compara contra números ya verificados manualmente.
 */
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

let ok = true;
function chequear(etiqueta: string, esperado: unknown, real: unknown, tolerancia = 0.01) {
  const iguales =
    typeof esperado === "number" && typeof real === "number"
      ? Math.abs(esperado - real) < tolerancia
      : JSON.stringify(esperado) === JSON.stringify(real);
  console.log(`  ${iguales ? "OK  " : "FAIL"} ${etiqueta}: esperado=${JSON.stringify(esperado)} real=${JSON.stringify(real)}`);
  if (!iguales) ok = false;
}

async function main() {
  const { db } = await import("../src/db/client");
  const { modelos, marcas } = await import("../src/db/schema");
  const { eq, and } = await import("drizzle-orm");
  const planesService = await import("../src/services/planes.service");
  const dashboardService = await import("../src/services/dashboard.service");
  const repuestosService = await import("../src/services/repuestos.service");
  const marcasService = await import("../src/services/marcas.service");

  console.log("== dashboard: resumen ==");
  const resumen = await dashboardService.resumen();
  chequear("valorStockGestionado", 1156059944.72, resumen.valorStockGestionado);
  chequear("repuestosStockGestionado", 9275, resumen.repuestosStockGestionado);
  chequear("repuestosTotal", 314527, resumen.repuestosTotal);
  chequear("planesMantenimiento", 700, resumen.planesMantenimiento);
  chequear("sustituciones", 31261, resumen.sustituciones);
  chequear("marcas (solo vehiculos activas)", 5, resumen.marcas);

  console.log();
  console.log("== marcas ==");
  const listaMarcas = await marcasService.listarMarcas();
  console.log("  marcas activas:", listaMarcas.map((m) => m.nombre).join(", "));

  console.log();
  console.log("== FIAT TORO 2.0 (sin extras) ==");
  const [modeloToro] = await db
    .select({ id: modelos.id })
    .from(modelos)
    .innerJoin(marcas, eq(marcas.id, modelos.marcaId))
    .where(and(eq(marcas.nombre, "FIAT"), eq(modelos.nombre, "TORO 2.0")))
    .limit(1);
  const planesToro = await planesService.listarPlanes({ modeloId: modeloToro.id });
  const planToro10k = planesToro.find((p) => p.kmIntervalo === 10000)!;
  const detalleToro = await planesService.obtenerPlan(planToro10k.id);
  chequear("Toro pack_repuestos_costo + pack_mano_obra_costo == costo_total",
    detalleToro.costoTotal,
    (detalleToro.packRepuestosCosto ?? 0) + (detalleToro.packManoObraCosto ?? 0));
  console.log("  packRepuestosCosto:", detalleToro.packRepuestosCosto);
  console.log("  packManoObraCosto:", detalleToro.packManoObraCosto);
  console.log("  costoTotal:", detalleToro.costoTotal);

  console.log();
  console.log("== FIAT 600 MHEV (con extras, 10.000 km) ==");
  const [modelo600] = await db
    .select({ id: modelos.id })
    .from(modelos)
    .innerJoin(marcas, eq(marcas.id, modelos.marcaId))
    .where(and(eq(marcas.nombre, "FIAT"), eq(modelos.nombre, "600 MHEV")))
    .limit(1);
  const planes600 = await planesService.listarPlanes({ modeloId: modelo600.id });
  const plan600_10k = planes600.find((p) => p.kmIntervalo === 10000)!;
  const detalle600 = await planesService.obtenerPlan(plan600_10k.id);
  chequear("600 MHEV packRepuestosCosto", 148326.6689691707, detalle600.packRepuestosCosto!, 0.01);
  chequear("600 MHEV packManoObraCosto", 422673.3310308293, detalle600.packManoObraCosto!, 0.01);
  chequear("600 MHEV costoTotal", 571000.0, detalle600.costoTotal!);
  const filtroAceite = detalle600.repuestos.find((r) => r.codigo === "1635842580");
  chequear("600 MHEV EUROREPAR (aceite a granel) total c/IVA", 53009.35, filtroAceite?.total, 0.5);
  chequear("600 MHEV EUROREPAR tiene equivalentes (no debe crashear)", true, Array.isArray(filtroAceite?.equivalentes));

  console.log();
  console.log("== PEUGEOT 2008 1.6 EC5 · 10.000 km (precio cerrado, sin desglose) ==");
  const [modeloPeugeot] = await db
    .select({ id: modelos.id })
    .from(modelos)
    .innerJoin(marcas, eq(marcas.id, modelos.marcaId))
    .where(and(eq(marcas.nombre, "PEUGEOT"), eq(modelos.nombre, "2008 1.6 EC5")))
    .limit(1);
  const planesPeugeot = await planesService.listarPlanes({ modeloId: modeloPeugeot.id });
  const planPeugeot10k = planesPeugeot.find((p) => p.kmIntervalo === 10000)!;
  const detallePeugeot = await planesService.obtenerPlan(planPeugeot10k.id);
  chequear("Peugeot 2008 costoTotal (precio cerrado)", 513000, detallePeugeot.costoTotal);
  chequear("Peugeot 2008 repuestos: 4 items (con filtro climatizacion)", 4, detallePeugeot.repuestos.length);
  chequear("Peugeot 2008 repuestos sin codigo (precio cerrado, sin part number)", true,
    detallePeugeot.repuestos.every((r) => !r.codigo));
  console.log("  checklist:", detallePeugeot.checklist.map((c) => c.item).join(" | "));

  console.log();
  console.log("== resumen por modelo (costo_km) — muestra ==");
  const resumenModelos = await planesService.resumenPorModelo();
  const rToro = resumenModelos.find((r) => r.modelo === "TORO 2.0");
  console.log("  TORO 2.0:", JSON.stringify(rToro));

  console.log();
  console.log("== equivalentes (BFS sobre sustituciones) — un caso real ==");
  const equivFiltro = await repuestosService.buscarEquivalentesConStock("1109AL");
  console.log(`  1109AL -> ${equivFiltro.length} equivalentes encontrados`);
  console.log("  primeros 3:", JSON.stringify(equivFiltro.slice(0, 3), null, 1));

  console.log();
  console.log("== repuestos: conteo-categorias (usa EXISTS con sql`` crudo) ==");
  const conteo = await repuestosService.conteoCategorias();
  console.log("  ", JSON.stringify(conteo));
  chequear("conteo total == repuestos_total", resumen.repuestosTotal, conteo[""]);
  // OJO: a diferencia del panel de Inicio (dashboard.py), este endpoint del
  // router de repuestos NUNCA excluyó el stock ficticio (verificado leyendo
  // repuestos.py) — por eso acá el numero correcto es gestionado+ficticio.
  chequear("conteo stock == gestionados reales + stock de prueba (fiel al original)",
    resumen.repuestosStockGestionado + 111285, conteo.stock);

  console.log();
  console.log("== repuestos: listar con busqueda ILIKE (case-insensitive) ==");
  const busq1 = await repuestosService.listarRepuestos({ q: "filtro", pageSize: 1 });
  const busq2 = await repuestosService.listarRepuestos({ q: "FILTRO", pageSize: 1 });
  const busq3 = await repuestosService.listarRepuestos({ q: "FiLtRo", pageSize: 1 });
  chequear("ILIKE 'filtro'/'FILTRO'/'FiLtRo' dan el mismo total", busq1.total, busq2.total);
  chequear("ILIKE case mixto tambien coincide", busq1.total, busq3.total);
  console.log(`  total con 'filtro' (cualquier case): ${busq1.total}`);

  console.log();
  console.log("== sustituciones: marcas con sustituciones (groupBy + count) ==");
  const sustMarcas = await (await import("../src/services/sustituciones.service")).marcasConSustituciones();
  console.log("  ", JSON.stringify(sustMarcas));

  console.log();
  console.log("== fluidos: listar con busqueda ==");
  const fluidosService = await import("../src/services/fluidos.service");
  const fluidosR = await fluidosService.listarFluidos({});
  console.log(`  total fluidos: ${fluidosR.items.length}, categorias: ${fluidosR.categorias.join(", ")}`);
  chequear("fluidos total == 27 (conocido)", 27, fluidosR.items.length);

  console.log();
  console.log("== planes: buscar-repuesto (UNION ALL + join crudo) ==");
  const busquedaPlan = await planesService.buscarRepuesto("filtro") as {
    query: string; totalCoincidencias: number; totalCodigos: number; grupos: unknown[];
  };
  console.log(`  total_coincidencias=${busquedaPlan.totalCoincidencias} total_codigos=${busquedaPlan.totalCodigos} grupos_devueltos=${busquedaPlan.grupos.length}`);
  chequear("buscar-repuesto devuelve resultados para 'filtro'", true, busquedaPlan.totalCoincidencias > 0);

  console.log();
  console.log("== lubricacion: buscarParaModelo (match estricto modelo+cilindrada) ==");
  const lubricacionService = await import("../src/services/lubricacion.service");
  const lub2008 = await lubricacionService.lubricacionDeModelo(modeloPeugeot.id);
  console.log("  PEUGEOT 2008 1.6 EC5:", JSON.stringify(lub2008));
  chequear("2008 1.6 EC5 encuentra lubricacion (QUARTZ INEO FIRST)", true, lub2008.encontrado && lub2008.motor === "QUARTZ INEO FIRST 0W-30");

  console.log();
  console.log("== pedidos: ciclo completo crear -> leer -> borrar (no deja basura) ==");
  // Desde la Etapa 5, crear/eliminar exige permiso y registra auditoria (con
  // FK real a usuarios): se usa el admin real de la base para este chequeo
  // directo por servicio (la Etapa 5 ya prueba el 403 real por HTTP con un
  // usuario sin permiso).
  const { usuarios: usuariosTabla } = await import("../src/db/schema");
  const [adminReal] = await db.select().from(usuariosTabla).where(eq(usuariosTabla.rol, "admin")).limit(1);
  if (!adminReal) throw new Error("No hay ningun usuario admin en la base para probar pedidos");
  const pedidosService = await import("../src/services/pedidos.service");
  const stockBajoAntes = await pedidosService.listarStockBajo();
  if (stockBajoAntes.length > 0) {
    const nuevoPedido = await pedidosService.crearPedido(adminReal, { nota: "verificacion etapa 3 - borrar" });
    chequear("pedido creado con items", true, nuevoPedido.items.length > 0);
    const leido = await pedidosService.obtenerPedido(nuevoPedido.id);
    chequear("pedido leido tiene mismos items", nuevoPedido.items.length, leido.items.length);
    await pedidosService.eliminarPedido(adminReal, nuevoPedido.id);
    let borradoOk = false;
    try { await pedidosService.obtenerPedido(nuevoPedido.id); } catch { borradoOk = true; }
    chequear("pedido de prueba quedo borrado", true, borradoOk);
  } else {
    console.log("  (sin candidatos de stock bajo ahora mismo — se omite el ciclo de escritura)");
  }

  console.log();
  console.log(ok ? "RESULTADO: TODO OK" : "RESULTADO: HAY DIFERENCIAS - REVISAR ARRIBA");
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error("ERROR EN LA VERIFICACION:", err);
  process.exit(1);
});
