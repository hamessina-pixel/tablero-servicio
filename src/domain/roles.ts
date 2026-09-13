/**
 * Niveles de acceso: los 4 roles (admin, editor, ventas, lector) son fijos,
 * pero QUÉ PERMISO tiene cada uno ya NO es fijo acá — es editable desde la
 * pantalla de Usuarios y vive en la tabla `permisos_rol` (ver
 * services/permisos.service.ts). Este archivo solo guarda:
 *   - los nombres de rol válidos y su etiqueta/descripción,
 *   - el catálogo de permisos que existen en el código (cada uno lo chequea
 *     algún servicio puntual, p.ej. "precios:editar" en repuestos.service),
 *   - los valores por defecto, usados solo para sembrar la tabla la primera
 *     vez (migración) — después de eso, la tabla manda.
 */
export const ROLES = {
  admin: {
    label: "Administrador",
    descripcion: "Acceso total: además de todo lo del editor, gestiona usuarios y ve la auditoría.",
  },
  editor: {
    label: "Editor",
    descripcion: "Catálogo completo: crear, editar y eliminar repuestos, precios, stock y pedidos.",
  },
  ventas: {
    label: "Ventas / Mostrador",
    descripcion: "Ajusta stock y genera pedidos de compra. No toca precios ni da de alta o baja repuestos.",
  },
  lector: {
    label: "Consulta",
    descripcion: "Solo ver: cotizador, catálogo, stock y pedidos. No puede modificar nada.",
  },
} as const;

export type Rol = keyof typeof ROLES;

export const ROL_POR_DEFECTO: Rol = "lector";

/** Catálogo de permisos que el código realmente chequea en algún lado. La
 *  pantalla de Usuarios arma los checkboxes a partir de esta lista — el
 *  admin no puede inventar un permiso nuevo, solo asignar/quitar estos. */
export const PERMISOS_CATALOGO = [
  { permiso: "stock:editar", label: "Editar stock" },
  { permiso: "precios:editar", label: "Editar precios" },
  { permiso: "repuestos:crear", label: "Crear repuestos y editar código/nombre" },
  { permiso: "repuestos:eliminar", label: "Eliminar repuestos" },
  { permiso: "pedidos:crear", label: "Generar pedidos de compra" },
  { permiso: "pedidos:eliminar", label: "Eliminar pedidos de compra" },
  { permiso: "exportar:excel", label: "Exportar a Excel" },
  { permiso: "usuarios:gestionar", label: "Gestionar usuarios" },
  { permiso: "auditoria:ver", label: "Ver auditoría" },
] as const;

/** Solo para la siembra inicial de `permisos_rol` (una vez, en la migración).
 *  Después de sembrado, la tabla es la única fuente de verdad. */
export const PERMISOS_POR_DEFECTO: Record<Rol, string[]> = {
  admin: [
    "stock:editar", "precios:editar", "repuestos:crear", "repuestos:eliminar",
    "pedidos:crear", "pedidos:eliminar", "usuarios:gestionar", "auditoria:ver", "exportar:excel",
  ],
  editor: [
    "stock:editar", "precios:editar", "repuestos:crear", "repuestos:eliminar",
    "pedidos:crear", "pedidos:eliminar", "exportar:excel",
  ],
  ventas: ["stock:editar", "pedidos:crear"],
  lector: [],
};

export function rolValido(rol: string): rol is Rol {
  return rol in ROLES;
}

export function labelDeRol(rol: string): string {
  return rolValido(rol) ? ROLES[rol].label : rol;
}

export interface UsuarioConRol {
  rol: string;
}
