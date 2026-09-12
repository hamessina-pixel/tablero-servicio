import { NextRequest, NextResponse } from "next/server";
import * as usuariosService from "@/services/usuarios.service";
import { ValidationError } from "@/domain/errors";
import { errorResponse } from "@/lib/http";
import { usuarioActualDesde } from "@/lib/sesion";

export async function GET(req: NextRequest) {
  try {
    const { usuario: actor } = await usuarioActualDesde(req);
    return NextResponse.json(await usuariosService.listarUsuarios(actor));
  } catch (err) {
    return errorResponse(err);
  }
}

interface CrearUsuarioBody {
  nombre: string;
  usuario: string;
  password: string;
  rol: string;
}

function validarBody(body: unknown): CrearUsuarioBody {
  const b = body as Record<string, unknown> | null;
  if (
    typeof b !== "object" || b === null
    || typeof b.nombre !== "string" || typeof b.usuario !== "string" || typeof b.password !== "string"
  ) {
    throw new ValidationError("Faltan campos: nombre, usuario, password");
  }
  return { nombre: b.nombre, usuario: b.usuario, password: b.password, rol: typeof b.rol === "string" ? b.rol : "editor" };
}

export async function POST(req: NextRequest) {
  try {
    const { usuario: actor } = await usuarioActualDesde(req);
    const body = validarBody(await req.json().catch(() => null));
    const data = await usuariosService.crearUsuario(actor, body);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
