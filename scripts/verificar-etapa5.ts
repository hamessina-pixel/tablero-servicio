/**
 * Verifica Auth de punta a punta: permisos, sesiones, y el fix de seguridad
 * (revocar sesiones al cambiar contraseña). Usa cuentas de prueba propias
 * (creadas y borradas en esta misma corrida) — nunca toca la cuenta real de
 * Andy (admin) ni su contraseña.
 */
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

let ok = true;
function chequear(etiqueta: string, esperado: unknown, real: unknown) {
  const iguales = JSON.stringify(esperado) === JSON.stringify(real);
  console.log(`  ${iguales ? "OK  " : "FAIL"} ${etiqueta}: esperado=${JSON.stringify(esperado)} real=${JSON.stringify(real)}`);
  if (!iguales) ok = false;
}
async function esperarError(fn: () => Promise<unknown>, tipoEsperado: string, etiqueta: string) {
  try {
    await fn();
    chequear(etiqueta, tipoEsperado, "NO_LANZO_ERROR");
  } catch (err) {
    chequear(etiqueta, tipoEsperado, (err as Error).name);
  }
}

async function main() {
  const { db } = await import("../src/db/client");
  const { usuarios, sesiones, auditoria } = await import("../src/db/schema");
  const { eq } = await import("drizzle-orm");
  const authService = await import("../src/services/auth.service");
  const usuariosService = await import("../src/services/usuarios.service");
  const repuestosService = await import("../src/services/repuestos.service");
  const sesionesRepo = await import("../src/repositories/sesiones.repository");
  const usuariosRepo = await import("../src/repositories/usuarios.repository");

  const NOMBRE_TEST = "Test Etapa 5 (borrar)";
  const USUARIO_TEST = `test_etapa5_${Date.now() % 1000000}`;

  console.log("== estado / roles ==");
  const estado = await authService.estado();
  chequear("ya hay usuarios (Andy existe)", true, estado.hayUsuarios);
  chequear("no es la primera cuenta", false, estado.primeraCuenta);
  const roles = authService.roles();
  const admin = roles.find((r) => r.rol === "admin")!;
  chequear("admin tiene 8 permisos", 8, admin.permisos.length);

  const [adminReal] = await db.select().from(usuarios).where(eq(usuarios.rol, "admin")).limit(1);
  if (!adminReal) throw new Error("No hay ningun admin real en la base — no se puede probar");
  console.log(`  admin real de la base: "${adminReal.nombre}" (id=${adminReal.id})`);

  console.log();
  console.log("== registro: cuenta nueva con Andy ya existente -> pendiente ==");
  const registro = await authService.registro({ nombre: NOMBRE_TEST, usuario: USUARIO_TEST, password: "test1234" });
  chequear("primeraCuenta false (Andy ya existe)", false, registro.primeraCuenta);
  chequear("pendiente true", true, registro.pendiente);
  const testUserId = registro.usuario.id;

  console.log();
  console.log("== login antes de ser aprobada -> rechazado ==");
  await esperarError(
    () => authService.login(USUARIO_TEST, "test1234"),
    "ForbiddenError",
    "login con cuenta pendiente",
  );

  console.log();
  console.log("== Andy aprueba la cuenta como 'editor' ==");
  await usuariosService.actualizarUsuario(adminReal, testUserId, { activo: true, rol: "editor" });
  const testUserEditor = await usuariosRepo.buscarPorId(testUserId);
  chequear("quedo activa", true, testUserEditor!.activo);
  chequear("quedo con rol editor", "editor", testUserEditor!.rol);

  console.log();
  console.log("== login ya aprobada ==");
  const { usuario: sesionUsuario, token: tokenEditor } = await authService.login(USUARIO_TEST, "test1234");
  chequear("rol en la sesion", "editor", sesionUsuario.rol);
  chequear("permisos de editor (6)", 6, sesionUsuario.permisos.length);

  const resuelto = await authService.resolverUsuarioActual(tokenEditor);
  chequear("resolverUsuarioActual encuentra la sesion", USUARIO_TEST, resuelto?.usuario);

  console.log();
  console.log("== permisos: editor puede tocar stock de un repuesto ==");
  const { repuestos: repuestosTabla } = await import("../src/db/schema");
  const [unRepuestoOriginal] = await db.select().from(repuestosTabla).limit(1);
  const stockOriginal = unRepuestoOriginal.stockActual;
  const actualizado = await repuestosService.actualizarRepuesto(
    testUserEditor!, unRepuestoOriginal.id, { stockActual: 77 },
  );
  chequear("stock quedo en 77", 77, actualizado?.stockActual);

  const [auditEditor] = await db
    .select()
    .from(auditoria)
    .where(eq(auditoria.usuarioId, testUserId))
    .orderBy((await import("drizzle-orm")).desc(auditoria.id))
    .limit(1);
  chequear("quedo auditado (accion=editar, entidad=repuesto)", "editar/repuesto", `${auditEditor?.accion}/${auditEditor?.entidad}`);

  console.log();
  console.log("== permisos: sin sesion (401) y con sesion de lector (403) ==");
  await esperarError(
    () => repuestosService.actualizarRepuesto(null, unRepuestoOriginal.id, { stockActual: 1 }),
    "UnauthorizedError",
    "actor null -> 401",
  );
  await usuariosService.actualizarUsuario(adminReal, testUserId, { rol: "lector" });
  const testUserLector = await usuariosRepo.buscarPorId(testUserId);
  await esperarError(
    () => repuestosService.actualizarRepuesto(testUserLector!, unRepuestoOriginal.id, { stockActual: 1 }),
    "ForbiddenError",
    "lector intentando editar stock -> 403",
  );

  // Revertir el stock del repuesto real que se toco arriba, para no dejar
  // contaminado un dato que no es de prueba.
  await db.update(repuestosTabla).set({ stockActual: stockOriginal }).where(eq(repuestosTabla.id, unRepuestoOriginal.id));
  const restaurado = await db.select().from(repuestosTabla).where(eq(repuestosTabla.id, unRepuestoOriginal.id)).limit(1);
  chequear("stock del repuesto real quedo restaurado", stockOriginal, restaurado[0].stockActual);

  console.log();
  console.log("== FIX DE SEGURIDAD: cambiar contraseña revoca sesiones ==");
  // Se promueve el usuario de prueba a admin (nunca se toca a Andy) para
  // poder probar el caso "el propio admin se cambia la clave a si mismo".
  await usuariosService.actualizarUsuario(adminReal, testUserId, { rol: "admin" });
  const testUserAdmin = (await usuariosRepo.buscarPorId(testUserId))!;

  // Sesion A: la que "esta usando" ahora mismo (se excluye del cierre).
  const { token: tokenSesionA } = await authService.login(USUARIO_TEST, "test1234");
  // Sesion B: otro navegador logueado con la misma cuenta.
  const { token: tokenSesionB } = await authService.login(USUARIO_TEST, "test1234");

  await usuariosService.actualizarUsuario(
    testUserAdmin, testUserId, { password: "otraClave5678" }, tokenSesionA,
  );

  const sigueA = await authService.resolverUsuarioActual(tokenSesionA);
  const sigueB = await authService.resolverUsuarioActual(tokenSesionB);
  chequear("sesion A (la propia, excluida) SIGUE viva", true, !!sigueA);
  chequear("sesion B (otro navegador) quedo REVOCADA", null, sigueB);

  console.log();
  console.log("== admin no puede desactivarse/eliminarse a si mismo ==");
  await esperarError(
    () => usuariosService.actualizarUsuario(testUserAdmin, testUserId, { activo: false }),
    "ValidationError",
    "desactivar la propia cuenta",
  );
  await esperarError(
    () => usuariosService.eliminarUsuario(testUserAdmin, testUserId),
    "ValidationError",
    "eliminar la propia cuenta",
  );

  console.log();
  console.log("== conteo de admins activos excluyendo uno ==");
  const activosExcluyendoTest = await usuariosRepo.adminsActivos(testUserId);
  chequear("queda 1 admin activo (Andy) al excluir al de prueba", 1, activosExcluyendoTest);

  console.log();
  console.log("== limpieza: Andy elimina la cuenta de prueba ==");
  await usuariosService.eliminarUsuario(adminReal, testUserId);
  const yaNoExiste = await usuariosRepo.buscarPorId(testUserId);
  chequear("la cuenta de prueba quedo eliminada", undefined, yaNoExiste);
  const sesionesRestantes = await db.select().from(sesiones).where(eq(sesiones.usuarioId, testUserId));
  chequear("sin sesiones colgadas", 0, sesionesRestantes.length);
  const auditANonima = await db.select().from(auditoria).where(eq(auditoria.usuarioId, testUserId));
  chequear("auditoria del usuario borrado quedo anonimizada (0 filas con ese id)", 0, auditANonima.length);

  console.log();
  console.log(ok ? "RESULTADO: TODO OK" : "RESULTADO: HAY DIFERENCIAS - REVISAR ARRIBA");
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error("ERROR EN LA VERIFICACION:", err);
  process.exit(1);
});
