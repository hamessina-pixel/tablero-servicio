import { NextRequest, NextResponse } from "next/server";
import * as repuestosService from "@/services/repuestos.service";
import { errorResponse, numeroSeguro, requireIntParam } from "@/lib/http";
import { sinCache } from "@/lib/cache";
import { usuarioActualDesde } from "@/lib/sesion";
import { sinCostoSiNoHaySesion } from "@/lib/visibilidad";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/repuestos/[id]">) {
  try {
    const { id } = await ctx.params;
    const { usuario } = await usuarioActualDesde(req);
    const data = await repuestosService.obtenerRepuesto(requireIntParam(id, "id"));
    return NextResponse.json({
      ...sinCostoSiNoHaySesion(data, usuario),
      equivalentes: data.equivalentes.map((e) => sinCostoSiNoHaySesion(e, usuario)),
    }, { headers: sinCache() });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Nadie tiene un millón de unidades de una pieza en el depósito: el tope
 *  frena un número pegado mal antes de que desfigure el capital en stock. */
const MAX_UNIDADES = 1_000_000;

interface CambiosRepuestoBody {
  codigo?: string | null;
  nombre?: string | null;
  stockActual?: number | null;
  stockMinimo?: number | null;
  precioCosto?: number | null;
  precioPublico?: number | null;
  esStockGestionado?: boolean | null;
}

function validarBody(body: unknown): CambiosRepuestoBody {
  const b = (body ?? {}) as Record<string, unknown>;
  const out: CambiosRepuestoBody = {};
  if (typeof b.codigo === "string") out.codigo = b.codigo;
  if (typeof b.nombre === "string" || b.nombre === null) out.nombre = b.nombre as string | null;
  if (b.stockActual !== undefined) out.stockActual = numeroSeguro(b.stockActual, "El stock", { max: MAX_UNIDADES });
  if (b.stockMinimo !== undefined) out.stockMinimo = numeroSeguro(b.stockMinimo, "El stock mínimo", { max: MAX_UNIDADES });
  if (b.precioCosto !== undefined) out.precioCosto = numeroSeguro(b.precioCosto, "El precio de costo");
  if (b.precioPublico !== undefined) out.precioPublico = numeroSeguro(b.precioPublico, "El precio público");
  if (typeof b.esStockGestionado === "boolean" || b.esStockGestionado === null) {
    out.esStockGestionado = b.esStockGestionado as boolean | null;
  }
  return out;
}

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/repuestos/[id]">) {
  try {
    const { id } = await ctx.params;
    const { usuario: actor } = await usuarioActualDesde(req);
    const body = validarBody(await req.json().catch(() => null));
    const data = await repuestosService.actualizarRepuesto(actor, requireIntParam(id, "id"), body);
    return NextResponse.json(data, { headers: sinCache() });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/repuestos/[id]">) {
  try {
    const { id } = await ctx.params;
    const { usuario: actor } = await usuarioActualDesde(req);
    await repuestosService.eliminarRepuesto(actor, requireIntParam(id, "id"));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
