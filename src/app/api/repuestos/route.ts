import { NextRequest, NextResponse } from "next/server";
import * as repuestosService from "@/services/repuestos.service";
import { ValidationError } from "@/domain/errors";
import { errorResponse, numeroSeguro, parseBoolParam, parseIntParamOpcional } from "@/lib/http";
import { sinCache } from "@/lib/cache";
import { usuarioActualDesde } from "@/lib/sesion";
import { sinCostoSiNoHaySesion } from "@/lib/visibilidad";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const { usuario } = await usuarioActualDesde(req);
    const data = await repuestosService.listarRepuestos({
      marcaId: parseIntParamOpcional(searchParams.get("marcaId"), "marcaId"),
      categoria: searchParams.get("categoria") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      stockBajo: parseBoolParam(searchParams.get("stockBajo")),
      soloStockGestionado: parseBoolParam(searchParams.get("soloStockGestionado")),
      page: parseIntParamOpcional(searchParams.get("page"), "page"),
      pageSize: parseIntParamOpcional(searchParams.get("pageSize"), "pageSize"),
    });
    return NextResponse.json(
      { ...data, items: data.items.map((r) => sinCostoSiNoHaySesion(r, usuario)) },
      { headers: sinCache() },
    );
  } catch (err) {
    return errorResponse(err);
  }
}

/** Ver el mismo tope en la ruta de edición: es un freno a un error de carga,
 *  no una regla del depósito. */
const MAX_UNIDADES = 1_000_000;

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
    precioPublico: numeroSeguro(b.precioPublico, "El precio público"),
    precioCosto: numeroSeguro(b.precioCosto, "El precio de costo"),
    stockActual: numeroSeguro(b.stockActual, "El stock", { max: MAX_UNIDADES }) ?? 0,
    stockMinimo: numeroSeguro(b.stockMinimo, "El stock mínimo", { max: MAX_UNIDADES }) ?? 0,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { usuario: actor } = await usuarioActualDesde(req);
    const body = validarBody(await req.json().catch(() => null));
    const data = await repuestosService.crearRepuesto(actor, body);
    return NextResponse.json(data, { headers: sinCache() });
  } catch (err) {
    return errorResponse(err);
  }
}
