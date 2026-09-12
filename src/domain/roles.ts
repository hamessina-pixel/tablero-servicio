/**
 * Niveles de acceso. Espejo EXACTO de dashboard/backend/app/auth.py (ROLES).
 *
 * Un rol es un conjunto de permisos con nombre. Se chequea por permiso y no
 * por rol ("precios:editar" en vez de "if rol === 'editor'"), así sumar un
 * nivel más adelante es agregar una entrada acá y nada más.
 *
 * El orden del objeto es de mayor a menor: así se muestra en la pantalla de
 * usuarios y así se ordena la tabla — se preserva iterando con Object.entries
 * (los objetos JS preservan el orden de inserción para claves string).
 */
export const ROLES = {
  admin: {
    label: "Administrador",
    descripcion: "Acceso total: además de todo lo del editor, gestiona usuarios y ve la auditoría.",
    permisos: new Set([
      "stock:editar", "precios:editar", "repuestos:crear", "repuestos:eliminar",
      "pedidos:crear", "pedidos:eliminar", "usuarios:gestionar", "auditoria:ver",
    ]),
  },
  editor: {
    label: "Editor",
    descripcion: "Catálogo completo: crear, editar y eliminar repuestos, precios, stock y pedidos.",
    permisos: new Set([
      "stock:editar", "precios:editar", "repuestos:crear", "repuestos:eliminar",
      "pedidos:crear", "pedidos:eliminar",
    ]),
  },
  ventas: {
    label: "Ventas / Mostrador",
    descripcion: "Ajusta stock y genera pedidos de compra. No toca precios ni da de alta o baja repuestos.",
    permisos: new Set(["stock:editar", "pedidos:crear"]),
  },
  lector: {
    label: "Consulta",
    descripcion: "Solo ver: cotizador, catálogo, stock y pedidos. No puede modificar nada.",
    permisos: new Set<string>(),
  },
} as const;

export type Rol = keyof typeof ROLES;

export const ROL_POR_DEFECTO: Rol = "lector";

export function rolValido(rol: string): rol is Rol {
  return rol in ROLES;
}

export function permisosDe(rol: string | null | undefined): ReadonlySet<string> {
  if (rol && rolValido(rol)) return ROLES[rol].permisos;
  return new Set();
}

export function labelDeRol(rol: string): string {
  return rolValido(rol) ? ROLES[rol].label : rol;
}

/** Los niveles de acceso, listos para dibujar el selector del frontend. */
export function rolesPublicos() {
  return (Object.entries(ROLES) as [Rol, (typeof ROLES)[Rol]][]).map(([rol, datos]) => ({
    rol,
    label: datos.label,
    descripcion: datos.descripcion,
    permisos: [...datos.permisos].sort(),
  }));
}

export interface UsuarioConRol {
  rol: string;
}

export function tienePermiso(usuario: UsuarioConRol | null | undefined, permiso: string): boolean {
  return Boolean(usuario) && permisosDe(usuario?.rol).has(permiso);
}
