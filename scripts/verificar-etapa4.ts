/**
 * Prueba las API routes de Next.js por HTTP real (no llamando a los servicios
 * directamente) contra el servidor de `next dev` ya levantado en
 * http://localhost:3000. Mismos casos de prueba que en verificar-etapa3.ts,
 * ahora atravesando routing + parseo de query params + serialización JSON.
 */
export {}; // fuerza scope de módulo: sin esto, tsc trata el archivo como script
           // global y sus `const` de nivel superior chocan con los de otros scripts.

const BASE = "http://localhost:3000";

let ok = true;
function chequear(etiqueta: string, esperado: unknown, real: unknown, tolerancia = 0.01) {
  const iguales =
    typeof esperado === "number" && typeof real === "number"
      ? Math.abs(esperado - real) < tolerancia
      : JSON.stringify(esperado) === JSON.stringify(real);
  console.log(`  ${iguales ? "OK  " : "FAIL"} ${etiqueta}: esperado=${JSON.stringify(esperado)} real=${JSON.stringify(real)}`);
  if (!iguales) ok = false;
}

async function get(path: string) {
  const res = await fetch(BASE + path);
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function main() {
  console.log("== GET /api/dashboard/resumen ==");
  const dash = await get("/api/dashboard/resumen");
  chequear("status 200", 200, dash.status);
  chequear("valorStockGestionado", 1156059944.72, dash.body.valorStockGestionado);
  chequear("repuestosTotal", 314527, dash.body.repuestosTotal);
  chequear("planesMantenimiento", 700, dash.body.planesMantenimiento);

  console.log();
  console.log("== GET /api/marcas ==");
  const marcasR = await get("/api/marcas");
  chequear("status 200", 200, marcasR.status);
  chequear("6 marcas", 6, marcasR.body.length);
  const fiat = marcasR.body.find((m: { nombre: string }) => m.nombre === "FIAT");
  console.log("  FIAT:", JSON.stringify(fiat));

  console.log();
  console.log("== GET /api/modelos?marcaId=<FIAT> ==");
  const modelosFiat = await get(`/api/modelos?marcaId=${fiat.id}`);
  chequear("status 200", 200, modelosFiat.status);
  const toro = modelosFiat.body.find((m: { nombre: string }) => m.nombre === "TORO 2.0");
  chequear("TORO 2.0 existe", true, !!toro);

  console.log();
  console.log("== GET /api/planes?modeloId=<TORO> ==");
  const planesToro = await get(`/api/planes?modeloId=${toro.id}`);
  const planToro10k = planesToro.body.find((p: { kmIntervalo: number }) => p.kmIntervalo === 10000);
  console.log();
  console.log("== GET /api/planes/[id] — FIAT TORO 2.0 · 10.000 km ==");
  const detalleToro = await get(`/api/planes/${planToro10k.id}`);
  chequear("status 200", 200, detalleToro.status);
  chequear("packRepuestosCosto + packManoObraCosto == costoTotal",
    detalleToro.body.costoTotal,
    detalleToro.body.packRepuestosCosto + detalleToro.body.packManoObraCosto);
  console.log("  ", JSON.stringify({
    packRepuestosCosto: detalleToro.body.packRepuestosCosto,
    packManoObraCosto: detalleToro.body.packManoObraCosto,
    costoTotal: detalleToro.body.costoTotal,
  }));

  console.log();
  console.log("== GET /api/planes/[id] — un id inexistente (debe dar 404, no 500) ==");
  const noExiste = await get("/api/planes/999999999");
  chequear("status 404", 404, noExiste.status);
  console.log("  body:", JSON.stringify(noExiste.body));

  console.log();
  console.log("== GET /api/planes/[id] — un id no numerico (debe dar 400, no 500) ==");
  const idInvalido = await get("/api/planes/abc");
  chequear("status 400", 400, idInvalido.status);
  console.log("  body:", JSON.stringify(idInvalido.body));

  console.log();
  console.log("== GET /api/repuestos?q=filtro (ILIKE por HTTP) ==");
  const busq = await get("/api/repuestos?q=filtro&pageSize=1");
  chequear("status 200", 200, busq.status);
  chequear("total 1801 (mismo que via servicio directo)", 1801, busq.body.total);

  console.log();
  console.log("== GET /api/repuestos/conteo-categorias ==");
  const conteo = await get("/api/repuestos/conteo-categorias");
  chequear("total 314527", 314527, conteo.body[""]);

  console.log();
  console.log("== GET /api/repuestos/equivalentes?codigo=1109AL ==");
  const equiv = await get("/api/repuestos/equivalentes?codigo=1109AL");
  chequear("status 200", 200, equiv.status);
  chequear("6 equivalentes", 6, equiv.body.equivalentes.length);

  console.log();
  console.log("== GET /api/repuestos/equivalentes SIN codigo (debe dar 400) ==");
  const equivSinCodigo = await get("/api/repuestos/equivalentes");
  chequear("status 400", 400, equivSinCodigo.status);

  console.log();
  console.log("== GET /api/fluidos ==");
  const fluidosR = await get("/api/fluidos");
  chequear("27 fluidos", 27, fluidosR.body.items.length);

  console.log();
  console.log("== GET /api/sustituciones/marcas ==");
  const sustMarcas = await get("/api/sustituciones/marcas");
  console.log("  ", JSON.stringify(sustMarcas.body));

  console.log();
  console.log("== GET /api/planes/resumen ==");
  const resumenPlanes = await get("/api/planes/resumen");
  const rToro = resumenPlanes.body.find((r: { modelo: string }) => r.modelo === "TORO 2.0");
  console.log("  TORO 2.0:", JSON.stringify(rToro));

  console.log();
  console.log("== GET /api/planes/buscar-repuesto?q=filtro ==");
  const buscarRep = await get("/api/planes/buscar-repuesto?q=filtro");
  chequear("hay coincidencias", true, buscarRep.body.totalCoincidencias > 0);

  console.log();
  console.log("== GET /api/lubricacion/modelo/[id] — Peugeot 2008 1.6 EC5 ==");
  const marcasAll = await get("/api/marcas");
  const peugeot = marcasAll.body.find((m: { nombre: string }) => m.nombre === "PEUGEOT");
  const modelosPeugeot = await get(`/api/modelos?marcaId=${peugeot.id}`);
  const modelo2008 = modelosPeugeot.body.find((m: { nombre: string }) => m.nombre === "2008 1.6 EC5");
  const lub = await get(`/api/lubricacion/modelo/${modelo2008.id}`);
  chequear("motor QUARTZ INEO FIRST", "QUARTZ INEO FIRST 0W-30", lub.body.motor);

  console.log();
  console.log("== GET /api/pedidos y /api/pedidos/stock-bajo ==");
  const pedidosR = await get("/api/pedidos");
  chequear("status 200", 200, pedidosR.status);
  const stockBajoR = await get("/api/pedidos/stock-bajo");
  chequear("134 con stock bajo (numero conocido)", 134, stockBajoR.body.length);

  console.log();
  console.log(ok ? "RESULTADO: TODO OK" : "RESULTADO: HAY DIFERENCIAS - REVISAR ARRIBA");
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error("ERROR EN LA VERIFICACION:", err);
  process.exit(1);
});
