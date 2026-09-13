import { NextRequest, NextResponse } from "next/server";
import * as authService from "@/services/auth.service";
import * as usuariosService from "@/services/usuarios.service";
import { errorResponse } from "@/lib/http";
import { usuarioActualDesde } from "@/lib/sesion";
import { PERMISOS_CATALOGO } from "@/domain/roles";

// El mapa completo de rol -> permisos es material de reconocimiento para
// alguien que quiera atacar el sistema: dice exactamente qué puede hacer cada
// nivel y dónde conviene apuntar. Solo lo necesita la pantalla de Usuarios.
export async function GET(req: NextRequest) {
  try {
    const { usuario: actor } = await usuarioActualDesde(req);
    await authService.exigirPermiso(actor, "usuarios:gestionar");
    const roles = await authService.roles();
    return NextResponse.json({ roles, catalogoPermisos: PERMISOS_CATALOGO });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { usuario: actor } = await usuarioActualDesde(req);
    const body = (await req.json().catch(() => ({}))) as { rol?: string; permisos?: string[] };
    const roles = await usuariosService.actualizarPermisosDeRol(actor, body.rol ?? "", body.permisos ?? []);
    return NextResponse.json(roles);
  } catch (err) {
    return errorResponse(err);
  }
}
