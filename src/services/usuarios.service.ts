/**
 * Gestión de usuarios (alta, edición, baja) — todo detrás de "usuarios:gestionar".
 * Espejo de dashboard/backend/app/routers/auth.py (crear_usuario,
 * actualizar_usuario, eliminar_usuario, listar_usuarios).
 */
import * as usuariosRepo from "@/repositories/usuarios.repository";
import * as sesionesRepo from "@/repositories/sesiones.repository";
import * as auditoriaRepo from "@/repositories/auditoria.repository";
import { hashPassword, hashToken } from "@/lib/crypto";
import { ahoraArgentinaISO } from "@/lib/fecha";
import { rolValido } from "@/domain/roles";
import { requireAdmin, usuarioPublico, validarPassword } from "@/services/auth.service";
import { ConflictError, NotFoundError, ValidationError } from "@/domain/errors";
import type { Usuario } from "@/domain/types";

export async function listarUsuarios(actor: Usuario | null) {
  requireAdmin(actor);
  const rows = await usuariosRepo.listar();
  return rows.map((r) => ({
    ...usuarioPublico(r),
    creadoEn: r.creadoEn,
    ultimoAcceso: r.ultimoAcceso,
  }));
}

export async function crearUsuario(
  actor: Usuario | null,
  datos: { nombre: string; usuario: string; password: string; rol: string },
) {
  requireAdmin(actor);
  if (!rolValido(datos.rol)) throw new ValidationError("Nivel de acceso inválido");
  validarPassword(datos.password);

  const existe = await usuariosRepo.buscarPorUsuario(datos.usuario.trim());
  if (existe) throw new ConflictError("Ya existe un usuario con ese nombre de usuario");

  const { hash, salt } = hashPassword(datos.password);
  const row = await usuariosRepo.crear({
    nombre: datos.nombre.trim(),
    usuario: datos.usuario.trim(),
    passwordHash: hash,
    passwordSalt: salt,
    rol: datos.rol,
    activo: true,
    pendiente: false,
    creadoEn: ahoraArgentinaISO(),
  });
  return usuarioPublico(row);
}

export async function actualizarUsuario(
  actor: Usuario | null,
  usuarioId: number,
  cambios: { nombre?: string; rol?: string; activo?: boolean; password?: string },
  tokenCrudoDelActor?: string,
) {
  const admin = requireAdmin(actor);
  const existente = await usuariosRepo.buscarPorId(usuarioId);
  if (!existente) throw new NotFoundError("Usuario no encontrado");

  if (cambios.rol !== undefined && !rolValido(cambios.rol)) throw new ValidationError("Nivel de acceso inválido");
  if (cambios.activo === false && usuarioId === admin.id) {
    throw new ValidationError("No podés desactivar tu propia cuenta");
  }

  // Quedarse sin ningún administrador activo deja el sistema sin forma de
  // gestionar usuarios: no hay alta pública que devuelva permisos.
  const bajaDeAdmin = existente.rol === "admin" && existente.activo && (
    (cambios.rol !== undefined && cambios.rol !== "admin") || cambios.activo === false
  );
  if (bajaDeAdmin) {
    const activos = await usuariosRepo.adminsActivos(usuarioId);
    if (activos === 0) {
      throw new ValidationError("Es el único administrador activo: nombrá otro antes de cambiarle el nivel");
    }
  }

  let passwordHash: string | undefined;
  let passwordSalt: string | undefined;
  if (cambios.password) {
    validarPassword(cambios.password);
    const h = hashPassword(cambios.password);
    passwordHash = h.hash;
    passwordSalt = h.salt;
  }

  // Habilitar una cuenta (activo=true) es justamente aprobar la solicitud.
  const pendiente = cambios.activo ? false : undefined;

  const row = await usuariosRepo.actualizar(usuarioId, {
    nombre: cambios.nombre,
    rol: cambios.rol,
    activo: cambios.activo,
    pendiente,
    passwordHash,
    passwordSalt,
  });

  // FIX DE SEGURIDAD (hallado auditando este mismo proyecto): el sistema
  // viejo no revocaba las sesiones abiertas al cambiar la contraseña — una
  // cookie robada seguía sirviendo hasta 30 días después del reset. Acá sí:
  // cambiar la clave cierra todas las sesiones de esa cuenta. Si el admin se
  // la cambia a sí mismo, se excluye su propio token actual para no
  // auto-desloguearlo en el mismo pedido que hizo el cambio.
  if (cambios.password) {
    const exceptoTokenHash = usuarioId === admin.id && tokenCrudoDelActor
      ? hashToken(tokenCrudoDelActor)
      : undefined;
    await sesionesRepo.invalidarTodasDeUsuario(usuarioId, exceptoTokenHash);
  }

  return usuarioPublico(row!);
}

export async function eliminarUsuario(actor: Usuario | null, usuarioId: number) {
  const admin = requireAdmin(actor);
  if (usuarioId === admin.id) throw new ValidationError("No podés eliminar tu propia cuenta");

  const existente = await usuariosRepo.buscarPorId(usuarioId);
  if (!existente) throw new NotFoundError("Usuario no encontrado");

  if (existente.rol === "admin" && existente.activo) {
    const activos = await usuariosRepo.adminsActivos(usuarioId);
    if (activos === 0) throw new ValidationError("Es el único administrador activo: no se puede eliminar");
  }

  // La auditoría guarda usuario_id: se deja en NULL en vez de borrar el
  // historial, así el registro de quién tocó qué no se pierde.
  await auditoriaRepo.anonimizarUsuario(usuarioId);
  await sesionesRepo.invalidarTodasDe(usuarioId);
  await usuariosRepo.eliminar(usuarioId);
}
