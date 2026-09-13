/**
 * Permisos por rol: dinámicos (tabla `permisos_rol`), editables por un
 * administrador desde la pantalla de Usuarios — a diferencia de los roles
 * en sí (fijos, ver domain/roles.ts).
 *
 * Se cachea en memoria del proceso porque se consulta en CADA chequeo de
 * permiso (una vez por escritura); se invalida al guardar un cambio. En un
 * entorno serverless esto solo ahorra dentro de una misma instancia tibia —
 * peor caso, vuelve a leer de la base, nunca sirve un dato viejo entre
 * instancias porque cada una parte con la cache vacía.
 */
import * as permisosRepo from "@/repositories/permisosRol.repository";
import { PERMISOS_CATALOGO, PERMISOS_POR_DEFECTO, ROLES, rolValido, type Rol } from "@/domain/roles";
import { ValidationError } from "@/domain/errors";

let cache: Record<string, Set<string>> | null = null;

async function mapaPermisos(): Promise<Record<string, Set<string>>> {
  if (cache) return cache;
  await permisosRepo.sembrarSiVacio(PERMISOS_POR_DEFECTO);
  const filas = await permisosRepo.listarTodos();
  const mapa: Record<string, Set<string>> = {};
  for (const rol of Object.keys(ROLES)) mapa[rol] = new Set(filas[rol] ?? []);
  cache = mapa;
  return mapa;
}

function invalidarCache() {
  cache = null;
}

export async function permisosDe(rol: string | null | undefined): Promise<ReadonlySet<string>> {
  if (!rol || !rolValido(rol)) return new Set();
  const mapa = await mapaPermisos();
  return mapa[rol] ?? new Set();
}

export async function tienePermiso(usuario: { rol: string } | null | undefined, permiso: string): Promise<boolean> {
  if (!usuario) return false;
  const permisos = await permisosDe(usuario.rol);
  return permisos.has(permiso);
}

/** Para la pantalla de Usuarios: catálogo + qué tiene cada rol hoy. */
export async function rolesConPermisos() {
  const mapa = await mapaPermisos();
  return (Object.entries(ROLES) as [Rol, (typeof ROLES)[Rol]][]).map(([rol, datos]) => ({
    rol,
    label: datos.label,
    descripcion: datos.descripcion,
    permisos: [...(mapa[rol] ?? new Set())].sort(),
  }));
}

export function catalogoPermisos() {
  return PERMISOS_CATALOGO;
}

const PERMISOS_VALIDOS: ReadonlySet<string> = new Set(PERMISOS_CATALOGO.map((p) => p.permiso));

/** El chequeo de "usuarios:gestionar" lo hace el caller (services/usuarios),
 *  no este archivo — así auth.service (que expone exigirPermiso) puede
 *  importar de acá sin ciclo. */
export async function actualizarPermisosDeRol(rol: string, permisos: string[]) {
  if (!rolValido(rol)) throw new ValidationError("Nivel de acceso inválido");
  const invalidos = permisos.filter((p) => !PERMISOS_VALIDOS.has(p));
  if (invalidos.length) throw new ValidationError(`Permiso inválido: ${invalidos.join(", ")}`);

  // Un admin no puede sacarse a sí mismo (ni a nadie del rol admin) la
  // posibilidad de gestionar usuarios: dejaría el sistema sin forma de
  // volver a asignar permisos.
  if (rol === "admin" && !permisos.includes("usuarios:gestionar")) {
    throw new ValidationError("El rol Administrador no puede perder el permiso de gestionar usuarios");
  }

  await permisosRepo.reemplazarPermisosDeRol(rol, permisos);
  invalidarCache();
}
