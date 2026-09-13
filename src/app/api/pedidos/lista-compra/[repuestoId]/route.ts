import { NextRequest, NextResponse } from "next/server";
import * as pedidosService from "@/services/pedidos.service";
import { errorResponse, requireIntParam } from "@/lib/http";
import { usuarioActualDesde } from "@/lib/sesion";

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/pedidos/lista-compra/[repuestoId]">) {
  try {
    const { repuestoId } = await ctx.params;
    const { usuario: actor } = await usuarioActualDesde(req);
    await pedidosService.quitarDeListaCompra(actor, requireIntParam(repuestoId, "repuestoId"));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
