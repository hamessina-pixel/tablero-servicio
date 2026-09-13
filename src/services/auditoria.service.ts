import * as auditoriaRepo from "@/repositories/auditoria.repository";
import { exigirPermiso } from "@/services/auth.service";
import type { Usuario } from "@/domain/types";

/**
 * Protegido por el permiso "auditoria:ver" puntual (no por "usuarios:gestionar"
 * a secas): ahora que los permisos por rol son editables desde Usuarios, un
 * admin puede darle "auditoria:ver" a un rol que no gestiona usuarios.
 */
export async function listarAuditoria(actor: Usuario | null, pageCrudo: number, pageSizeCrudo: number) {
  await exigirPermiso(actor, "auditoria:ver");
  const page = Math.max(pageCrudo, 1);
  const pageSize = Math.min(Math.max(pageSizeCrudo, 1), 200);
  const { items, total } = await auditoriaRepo.listar(page, pageSize);
  return { items, total, page, pageSize };
}
