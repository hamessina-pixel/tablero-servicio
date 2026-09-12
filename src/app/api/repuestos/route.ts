import { NextRequest, NextResponse } from "next/server";
import * as repuestosService from "@/services/repuestos.service";
import { ValidationError } from "@/domain/errors";
import { errorResponse, parseBoolParam, parseIntParamOpcional } from "@/lib/http";
import { usuarioActualDesde } from "@/lib/sesion";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const data = await repuestosService.listarRepuestos({
      marcaId: parseIntParamOpcional(searchParams.get("marcaId"), "marcaId"),
      categoria: searchParams.get("categoria") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      stockBajo: parseBoolParam(searchParams.get("stockBajo")),
      soloStockGestionado: parseBoolParam(searchParams.get("soloStockGestionado")),
      page: parseIntParamOpcional(searchParams.get("page"), "page"),
      pageSize: parseIntParamOpcional(searchParams.get("pageSize"), "pageSize"),
    });
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}

interface CrearRepuestoBody {
  codigo: string;
  nombre: string | null;
  marcaId: number;
  categoria: string | null;
  precioPublico: number | null;
  precioCosto: number | null;
  stockActual: number | null;
  stockMinimo: number | null;
}

function validarBody(body: unknown): CrearRepuestoBody {
  const b = body as Record<string, unknown> | null;
  if (typeof b !== "object" || b === null || typeof b.codigo !== "string" || typeof b.marcaId !== "number") {
    throw new ValidationError("Faltan campos: codigo, marcaId");
  }
  return {
    codigo: b.codigo,
    nombre: typeof b.nombre === "string" ? b.nombre : null,
    marcaId: b.marcaId,
    categoria: typeof b.categoria === "string" ? b.categoria : "stock",
    precioPublico: typeof b.precioPublico === "number" ? b.precioPublico : null,
    precioCosto: typeof b.precioCosto === "number" ? b.precioCosto : null,
    stockActual: typeof b.stockActual === "number" ? b.stockActual : 0,
    stockMinimo: typeof b.stockMinimo === "number" ? b.stockMinimo : 0,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { usuario: actor } = await usuarioActualDesde(req);
    const body = validarBody(await req.json().catch(() => null));
    const data = await repuestosService.crearRepuesto(actor, body);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
