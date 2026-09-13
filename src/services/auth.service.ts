/**
 * Login, sesiones y permisos de edición. Espejo de
 * dashboard/backend/app/auth.py y routers/auth.py.
 *
 * Solo protege ESCRIBIR (crear/editar/borrar repuestos y pedidos): leer sigue
 * siendo libre. No hay usuario de fábrica: la primera cuenta se crea desde la
 * propia pantalla de login y queda como administrador. Después de esa
 * primera, el alta pública cae en "pendiente de aprobación".
 */
import * as usuariosRepo from "@/repositories/usuarios.repository";
import * as sesionesRepo from "@/repositories/sesiones.repository";
import { hashPassword, hashToken, verificarPassword, generarTokenSesion } from "@/lib/crypto";
import { ahoraArgentinaISO, argentinaISOEnDias, argentinaISOEnMinutos } from "@/lib/fecha";
import { labelDeRol, ROL_POR_DEFECTO } from "@/domain/roles";
import { permisosDe, rolesConPermisos, tienePermiso } from "@/services/permisos.service";
import { ConflictError, ForbiddenError, UnauthorizedError, ValidationError } from "@/domain/errors";
import type { Usuario } from "@/domain/types";

const MIN_LARGO_PASSWORD = 8;
export const SESION_DIAS = 30;

/** Tras esta cantidad de fallos seguidos, la cuenta queda en pausa. Es un
 *  taller: el margen es holgado para no trabar a alguien que se equivoca
 *  tipeando, pero corta en seco un ataque por diccionario. */
const MAX_INTENTOS_FALLIDOS = 8;
const MINUTOS_BLOQUEO = 15;

/** Salt de descarte para gastar el mismo tiempo de CPU cuando el usuario no
 *  existe. Sin esto, un login inexistente responde en ~1 ms y uno existente en
 *  ~100 ms (las 200.000 iteraciones de PBKDF2), y esa diferencia sola permite
 *  averiguar qué nombres de usuario son válidos. */
const SALT_DESCARTE = "0".repeat(32);

export function validarPassword(password: string): void {
  if (password.length < MIN_LARGO_PASSWORD) {
    throw new ValidationError(`La contraseña debe tener al menos ${MIN_LARGO_PASSWORD} caracteres`);
  }
}

export interface UsuarioPublico {
  id: number;
  nombre: string;
  usuario: string;
  rol: string;
  rolLabel: string;
  activo: boolean;
  pendiente: boolean;
  permisos: string[];
}

/** Versión del usuario segura para mandar al frontend (sin hash/salt). Manda
 *  también los permisos calculados: el frontend esconde botones con esta
 *  lista en vez de repetir la tabla de roles del backend. */
export async function usuarioPublico(row: Usuario): Promise<UsuarioPublico> {
  return {
    id: row.id,
    nombre: row.nombre,
    usuario: row.usuario,
    rol: row.rol,
    rolLabel: labelDeRol(row.rol),
    activo: row.activo,
    pendiente: row.pendiente,
    permisos: [...(await permisosDe(row.rol))].sort(),
  };
}

export async function estado() {
  const hay = await usuariosRepo.hayUsuarios();
  return { hayUsuarios: hay, primeraCuenta: !hay };
}

export function roles() {
  return rolesConPermisos();
}

async function abrirSesion(usuarioId: number): Promise<string> {
  const token = generarTokenSesion();
  const creadaEn = ahoraArgentinaISO();
  const expiraEn = argentinaISOEnDias(SESION_DIAS);
  await sesionesRepo.crearSesion(usuarioId, hashToken(token), creadaEn, expiraEn);
  await usuariosRepo.actualizarUltimoAcceso(usuarioId, creadaEn);
  return token;
}

export async function registro(datos: { nombre: string; usuario: string; password: string }) {
  const nombre = datos.nombre.trim();
  const usuario = datos.usuario.trim();
  if (!nombre || !usuario) throw new ValidationError("Completá nombre y usuario");
  if (usuario.length < 3) throw new ValidationError("El nombre de usuario debe tener al menos 3 caracteres");
  validarPassword(datos.password);

  const existente = await usuariosRepo.buscarPorUsuario(usuario);
  if (existente) throw new ConflictError("Ya existe una cuenta con ese nombre de usuario");

  const primera = !(await usuariosRepo.hayUsuarios());
  const { hash, salt } = hashPassword(datos.password);
  const row = await usuariosRepo.crear({
    nombre, usuario, passwordHash: hash, passwordSalt: salt,
    rol: primera ? "admin" : ROL_POR_DEFECTO,
    activo: primera, pendiente: !primera, creadoEn: ahoraArgentinaISO(),
  });

  if (primera) {
    const token = await abrirSesion(row.id);
    return {
      primeraCuenta: true, pendiente: false, usuario: await usuarioPublico(row),
      mensaje: "Cuenta de administrador creada. Ya estás dentro.", token,
    };
  }
  return {
    primeraCuenta: false, pendiente: true, usuario: await usuarioPublico(row),
    mensaje: "Cuenta creada. Un administrador tiene que habilitarla antes de que puedas entrar.",
    token: null as string | null,
  };
}

export async function login(usuarioCrudo: string, password: string) {
  const row = await usuariosRepo.buscarPorUsuario(usuarioCrudo.trim());

  if (!row) {
    // Se deriva igual contra un salt de descarte para que el tiempo de
    // respuesta no delate que el usuario no existe.
    hashPassword(password, SALT_DESCARTE);
    throw new UnauthorizedError("Usuario o contraseña incorrectos");
  }

  if (row.bloqueadoHasta && row.bloqueadoHasta > ahoraArgentinaISO()) {
    throw new ForbiddenError(
      `Demasiados intentos fallidos. Probá de nuevo en unos minutos o pedile a un administrador que te reactive`,
    );
  }

  if (!verificarPassword(password, row.passwordHash, row.passwordSalt)) {
    const fallidos = await usuariosRepo.sumarIntentoFallido(row.id);
    if (fallidos >= MAX_INTENTOS_FALLIDOS) {
      await usuariosRepo.bloquearHasta(row.id, argentinaISOEnMinutos(MINUTOS_BLOQUEO));
    }
    throw new UnauthorizedError("Usuario o contraseña incorrectos");
  }

  await usuariosRepo.limpiarIntentos(row.id);

  if (!row.activo) {
    // La contraseña era correcta: decirle por qué no entra evita que vuelva a
    // intentar diez veces creyendo que se equivocó de clave.
    if (row.pendiente) throw new ForbiddenError("Tu cuenta todavía no fue habilitada por un administrador");
    throw new ForbiddenError("Tu cuenta está desactivada. Pedile a un administrador que la reactive");
  }
  const token = await abrirSesion(row.id);
  return { usuario: await usuarioPublico(row), token };
}

export async function logout(tokenCrudo: string | undefined): Promise<void> {
  if (tokenCrudo) await sesionesRepo.invalidarPorTokenHash(hashToken(tokenCrudo));
}

/** Espejo de get_current_user: resuelve el usuario a partir del token crudo
 *  de la cookie, o null si no hay sesión vigente. */
export async function resolverUsuarioActual(tokenCrudo: string | undefined): Promise<Usuario | null> {
  if (!tokenCrudo) return null;
  const row = await sesionesRepo.usuarioDeSesionVigente(hashToken(tokenCrudo));
  return row ?? null;
}

export async function me(tokenCrudo: string | undefined): Promise<UsuarioPublico> {
  const usuario = await resolverUsuarioActual(tokenCrudo);
  if (!usuario) throw new UnauthorizedError("No hay sesión activa");
  return usuarioPublico(usuario);
}


// ---------------------------------------------------------------------------
// Guardas de permiso, para que las use CUALQUIER servicio (repuestos, pedidos,
// usuarios...) — así el control de acceso vive en una sola parte y no se
// puede olvidar en una ruta nueva.
// ---------------------------------------------------------------------------

export function requireUsuario(usuario: Usuario | null): Usuario {
  if (!usuario) throw new UnauthorizedError("Iniciá sesión para hacer esto");
  return usuario;
}

/** Devuelve 401 si no hay sesión y 403 si la hay pero el nivel no alcanza —
 *  el frontend necesita distinguir "entrá" de "no podés". */
export async function exigirPermiso(usuario: Usuario | null, permiso: string): Promise<Usuario> {
  const u = requireUsuario(usuario);
  if (!(await tienePermiso(u, permiso))) {
    throw new ForbiddenError(`Tu nivel de acceso (${labelDeRol(u.rol)}) no permite hacer esto`);
  }
  return u;
}

export async function requireAdmin(usuario: Usuario | null): Promise<Usuario> {
  return exigirPermiso(usuario, "usuarios:gestionar");
}
