import * as auditoriaRepo from "@/repositories/auditoria.repository";
import { requireAdmin } from "@/services/auth.service";
import type { Usuario } from "@/domain/types";

/**
 * El original protege este endpoint con `require_admin` (permiso
 * "usuarios:gestionar"), NO con el permiso "auditoria:ver" que también existe
 * en la tabla de roles — se replica igual: en la práctica no cambia nada,
 * porque ningún rol tiene "auditoria:ver" sin tener también
 * "usuarios:gestionar" (solo admin tiene los dos).
 */
export async function listarAuditoria(actor: Usuario | null, pageCrudo: number, pageSizeCrudo: number) {
  requireAdmin(actor);
  const page = Math.max(pageCrudo, 1);
  const pageSize = Math.min(Math.max(pageSizeCrudo, 1), 200);
  const { items, total } = await auditoriaRepo.listar(page, pageSize);
  return { items, total, page, pageSize };
}
