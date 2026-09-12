import { NextRequest, NextResponse } from "next/server";
import * as usuariosService from "@/services/usuarios.service";
import { errorResponse, requireIntParam } from "@/lib/http";
import { usuarioActualDesde } from "@/lib/sesion";

interface ActualizarUsuarioBody {
  nombre?: string;
  rol?: string;
  activo?: boolean;
  password?: string;
}

function validarBody(body: unknown): ActualizarUsuarioBody {
  const b = (body ?? {}) as Record<string, unknown>;
  const out: ActualizarUsuarioBody = {};
  if (typeof b.nombre === "string") out.nombre = b.nombre;
  if (typeof b.rol === "string") out.rol = b.rol;
  if (typeof b.activo === "boolean") out.activo = b.activo;
  if (typeof b.password === "string" && b.password) out.password = b.password;
  return out;
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/auth/usuarios/[id]">) {
  try {
    const { id } = await ctx.params;
    const { usuario: actor, token } = await usuarioActualDesde(req);
    const body = validarBody(await req.json().catch(() => null));
    const data = await usuariosService.actualizarUsuario(actor, requireIntParam(id, "id"), body, token);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/auth/usuarios/[id]">) {
  try {
    const { id } = await ctx.params;
    const { usuario: actor } = await usuarioActualDesde(req);
    await usuariosService.eliminarUsuario(actor, requireIntParam(id, "id"));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
