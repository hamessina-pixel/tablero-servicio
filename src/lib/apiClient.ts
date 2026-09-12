/**
 * Cliente HTTP tipado hacia las API routes propias (mismo origen: la cookie
 * de sesión viaja sola, no hace falta `credentials: "include"`).
 */

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const texto = await res.text();
  const cuerpo = texto ? JSON.parse(texto) : null;
  if (!res.ok) {
    throw new ApiError(res.status, (cuerpo && cuerpo.error) || `Error ${res.status}`);
  }
  return cuerpo as T;
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

const get = <T,>(path: string) => req<T>(path);
const post = <T,>(path: string, body?: unknown) => req<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
const put = <T,>(path: string, body?: unknown) => req<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined });
const patch = <T,>(path: string, body?: unknown) => req<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
const del = <T,>(path: string) => req<T>(path, { method: "DELETE" });

// ---------------------------------------------------------------------------

import type {
  Fluido, Lubricacion, PlanConDetalle, PlanMantenimiento, Repuesto, ResumenDashboard,
  ResumenPorModelo, Sustitucion,
} from "@/domain/types";
import type { MarcaConConteos } from "@/repositories/marcas.repository";
import type { ModeloConMarca } from "@/repositories/modelos.repository";

export interface UsuarioPublico {
  id: number; nombre: string; usuario: string; rol: string; rolLabel: string;
  activo: boolean; pendiente: boolean; permisos: string[];
}

export const api = {
  marcas: {
    listar: (opts: { conModelos?: boolean; incluirInactivas?: boolean } = {}) =>
      get<MarcaConConteos[]>(`/api/marcas${qs(opts)}`),
  },
  modelos: {
    listar: (marcaId?: number) => get<ModeloConMarca[]>(`/api/modelos${qs({ marcaId })}`),
  },
  planes: {
    listar: (opts: { modeloId?: number; marcaId?: number; incluirPreview?: boolean } = {}) =>
      get<PlanMantenimiento[]>(`/api/planes${qs(opts)}`),
    resumen: () => get<ResumenPorModelo[]>("/api/planes/resumen"),
    buscarRepuesto: (q: string) => get(`/api/planes/buscar-repuesto${qs({ q })}`),
    obtener: (id: number) => get<PlanConDetalle>(`/api/planes/${id}`),
  },
  repuestos: {
    listar: (filtros: Record<string, string | number | boolean | undefined> = {}) =>
      get<{ items: (Repuesto & { marcaNombre: string | null })[]; total: number; page: number; pageSize: number }>(
        `/api/repuestos${qs(filtros)}`,
      ),
    conteoCategorias: (marcaId?: number) =>
      get<Record<string, number>>(`/api/repuestos/conteo-categorias${qs({ marcaId })}`),
    equivalentes: (codigo: string) => get(`/api/repuestos/equivalentes${qs({ codigo })}`),
    obtener: (id: number) => get(`/api/repuestos/${id}`),
    actualizar: (id: number, cambios: Record<string, unknown>) => put(`/api/repuestos/${id}`, cambios),
    crear: (datos: Record<string, unknown>) => post(`/api/repuestos`, datos),
    eliminar: (id: number) => del(`/api/repuestos/${id}`),
  },
  fluidos: {
    listar: (opts: { q?: string; categoria?: string } = {}) =>
      get<{ items: Fluido[]; categorias: string[] }>(`/api/fluidos${qs(opts)}`),
  },
  sustituciones: {
    listar: (opts: { q?: string; marcaId?: number; page?: number; pageSize?: number } = {}) =>
      get<{ items: (Sustitucion & { marcaNombre: string | null })[]; total: number; page: number; pageSize: number }>(
        `/api/sustituciones${qs(opts)}`,
      ),
    marcas: () => get<{ marcaId: number | null; nombre: string; total: number }[]>("/api/sustituciones/marcas"),
  },
  pedidos: {
    listar: () => get("/api/pedidos"),
    stockBajo: (marcaId?: number) => get(`/api/pedidos/stock-bajo${qs({ marcaId })}`),
    crear: (datos: { marcaId?: number; nota?: string }) => post("/api/pedidos", datos),
    obtener: (id: number) => get(`/api/pedidos/${id}`),
    eliminar: (id: number) => del(`/api/pedidos/${id}`),
  },
  lubricacion: {
    listar: (marcaId?: number) => get<Lubricacion[]>(`/api/lubricacion${qs({ marcaId })}`),
    deModelo: (modeloId: number) =>
      get<{ encontrado: boolean; modelo?: string; motivo?: string } & Partial<Lubricacion>>(
        `/api/lubricacion/modelo/${modeloId}`,
      ),
  },
  dashboard: {
    resumen: () => get<ResumenDashboard>("/api/dashboard/resumen"),
  },
  auth: {
    estado: () => get<{ hayUsuarios: boolean; primeraCuenta: boolean }>("/api/auth/estado"),
    roles: () => get<{ rol: string; label: string; descripcion: string; permisos: string[] }[]>("/api/auth/roles"),
    registro: (datos: { nombre: string; usuario: string; password: string }) =>
      post<{ primeraCuenta: boolean; pendiente: boolean; usuario: UsuarioPublico; mensaje: string }>(
        "/api/auth/registro", datos,
      ),
    login: (datos: { usuario: string; password: string }) => post<UsuarioPublico>("/api/auth/login", datos),
    logout: () => post("/api/auth/logout"),
    me: () => get<UsuarioPublico>("/api/auth/me"),
    usuarios: {
      listar: () => get<(UsuarioPublico & { creadoEn: string; ultimoAcceso: string | null })[]>("/api/auth/usuarios"),
      crear: (datos: { nombre: string; usuario: string; password: string; rol: string }) =>
        post<UsuarioPublico>("/api/auth/usuarios", datos),
      actualizar: (id: number, cambios: { nombre?: string; rol?: string; activo?: boolean; password?: string }) =>
        patch<UsuarioPublico>(`/api/auth/usuarios/${id}`, cambios),
      eliminar: (id: number) => del(`/api/auth/usuarios/${id}`),
    },
    auditoria: (page = 1, pageSize = 50) => get(`/api/auth/auditoria${qs({ page, pageSize })}`),
  },
};
