/**
 * Prueba el flujo de auth por HTTP real (cookies incluidas) contra el
 * servidor de `next dev` en http://localhost:3000. Usa una cuenta de prueba
 * propia, aprobada vía servicio directo con el admin real (Andy) — nunca se
 * toca la contraseña de Andy ni se necesita conocerla.
 */
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

const BASE = "http://localhost:3000";

let ok = true;
function chequear(etiqueta: string, esperado: unknown, real: unknown) {
  const iguales = JSON.stringify(esperado) === JSON.stringify(real);
  console.log(`  ${iguales ? "OK  " : "FAIL"} ${etiqueta}: esperado=${JSON.stringify(esperado)} real=${JSON.stringify(real)}`);
  if (!iguales) ok = false;
}

function extraerCookie(res: Response): string | null {
  const raw = res.headers.get("set-cookie");
  if (!raw) return null;
  const m = /session_token=([^;]*)/.exec(raw);
  return m ? `session_token=${m[1]}` : null;
}

async function main() {
  const usuariosRepo = await import("../src/repositories/usuarios.repository");
  const usuariosService = await import("../src/services/usuarios.service");
  const { db } = await import("../src/db/client");
  const { usuarios, repuestos } = await import("../src/db/schema");
  const { eq } = await import("drizzle-orm");

  const [adminReal] = await db.select().from(usuarios).where(eq(usuarios.rol, "admin")).limit(1);
  const USUARIO_TEST = `test_http_${Date.now() % 1000000}`;
  const PASSWORD = "test1234";

  console.log("== POST /api/auth/registro ==");
  const resReg = await fetch(`${BASE}/api/auth/registro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre: "Test HTTP (borrar)", usuario: USUARIO_TEST, password: PASSWORD }),
  });
  const bodyReg = await resReg.json();
  chequear("status 200", 200, resReg.status);
  chequear("pendiente true (Andy ya existe)", true, bodyReg.pendiente);
  chequear("el body NO trae el token crudo", undefined, bodyReg.token);
  const testUserId = bodyReg.usuario.id as number;

  console.log();
  console.log("== Andy aprueba por servicio directo (no hay forma HTTP sin su clave) ==");
  await usuariosService.actualizarUsuario(adminReal, testUserId, { activo: true, rol: "editor" });

  console.log();
  console.log("== POST /api/auth/login ==");
  const resLogin = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario: USUARIO_TEST, password: PASSWORD }),
  });
  const cookie = extraerCookie(resLogin);
  chequear("status 200", 200, resLogin.status);
  chequear("vino cookie de sesion", true, !!cookie);
  const bodyLogin = await resLogin.json();
  chequear("body NO trae el token crudo", undefined, bodyLogin.token);
  chequear("rol editor", "editor", bodyLogin.rol);

  console.log();
  console.log("== GET /api/auth/me con cookie ==");
  const resMe = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: cookie! } });
  chequear("status 200", 200, resMe.status);
  const bodyMe = await resMe.json();
  chequear("usuario correcto", USUARIO_TEST, bodyMe.usuario);

  console.log();
  console.log("== GET /api/auth/me SIN cookie -> 401 ==");
  const resMeSinCookie = await fetch(`${BASE}/api/auth/me`);
  chequear("status 401", 401, resMeSinCookie.status);

  console.log();
  console.log("== PUT /api/repuestos/[id] con cookie de editor -> 200 ==");
  const [repuesto] = await db.select().from(repuestos).limit(1);
  const stockOriginal = repuesto.stockActual;
  const resPut = await fetch(`${BASE}/api/repuestos/${repuesto.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookie! },
    body: JSON.stringify({ stockActual: 55 }),
  });
  chequear("status 200", 200, resPut.status);
  const bodyPut = await resPut.json();
  chequear("stock quedo en 55", 55, bodyPut.stockActual);

  console.log();
  console.log("== se degrada a lector; MISMA cookie -> 403 (el permiso se re-evalua en vivo) ==");
  await usuariosService.actualizarUsuario(adminReal, testUserId, { rol: "lector" });
  const resPutLector = await fetch(`${BASE}/api/repuestos/${repuesto.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookie! },
    body: JSON.stringify({ stockActual: 1 }),
  });
  chequear("status 403", 403, resPutLector.status);

  // Revertir el stock tocado en el repuesto real.
  await db.update(repuestos).set({ stockActual: stockOriginal }).where(eq(repuestos.id, repuesto.id));

  console.log();
  console.log("== POST /api/auth/logout ==");
  const resLogout = await fetch(`${BASE}/api/auth/logout`, { method: "POST", headers: { Cookie: cookie! } });
  chequear("status 200", 200, resLogout.status);

  console.log();
  console.log("== GET /api/auth/me con la cookie ya des-logueada -> 401 ==");
  const resMeTrasLogout = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: cookie! } });
  chequear("status 401", 401, resMeTrasLogout.status);

  console.log();
  console.log("== limpieza: Andy elimina la cuenta de prueba ==");
  await usuariosService.eliminarUsuario(adminReal, testUserId);
  const yaNoExiste = await usuariosRepo.buscarPorId(testUserId);
  chequear("cuenta de prueba eliminada", undefined, yaNoExiste);

  console.log();
  console.log(ok ? "RESULTADO: TODO OK" : "RESULTADO: HAY DIFERENCIAS - REVISAR ARRIBA");
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error("ERROR EN LA VERIFICACION:", err);
  process.exit(1);
});
