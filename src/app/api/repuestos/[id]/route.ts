import { NextRequest, NextResponse } from "next/server";
import * as repuestosService from "@/services/repuestos.service";
import { errorResponse, requireIntParam } from "@/lib/http";
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
    });
  } catch (err) {
    return errorResponse(err);
  }
}

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
  if (typeof b.stockActual === "number" || b.stockActual === null) out.stockActual = b.stockActual as number | null;
  if (typeof b.stockMinimo === "number" || b.stockMinimo === null) out.stockMinimo = b.stockMinimo as number | null;
  if (typeof b.precioCosto === "number" || b.precioCosto === null) out.precioCosto = b.precioCosto as number | null;
  if (typeof b.precioPublico === "number" || b.precioPublico === null) out.precioPublico = b.precioPublico as number | null;
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
    return NextResponse.json(data);
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
