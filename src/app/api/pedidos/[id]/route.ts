import { NextRequest, NextResponse } from "next/server";
import * as pedidosService from "@/services/pedidos.service";
import { errorResponse, requireIntParam } from "@/lib/http";
import { usuarioActualDesde } from "@/lib/sesion";

export async function GET(_req: Request, ctx: RouteContext<"/api/pedidos/[id]">) {
  try {
    const { id } = await ctx.params;
    const data = await pedidosService.obtenerPedido(requireIntParam(id, "id"));
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/pedidos/[id]">) {
  try {
    const { id } = await ctx.params;
    const { usuario: actor } = await usuarioActualDesde(req);
    await pedidosService.eliminarPedido(actor, requireIntParam(id, "id"));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
