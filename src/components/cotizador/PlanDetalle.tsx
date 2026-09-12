"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Donut } from "@/components/ui/Donut";
import { money, horasATiempo } from "@/lib/format";
import type { ItemDePlanConStock, PlanConDetalle, StockDeCodigo } from "@/domain/types";

const FIAT_BASICO_KEYWORDS = ["filtro de aceite", "filtro de aire", "filtro de combustible", "filtro de climatiz"];
const FIAT_BASICO_EXCLUYE = ["transmisi"];
const RE_VISCOSIDAD_ACEITE = /\d+w-?\d+/i;
function esRepuestoBasicoFiat(nombre: string | null): boolean {
  const n = (nombre || "").toLowerCase();
  if (FIAT_BASICO_EXCLUYE.some((k) => n.includes(k))) return false;
  if (FIAT_BASICO_KEYWORDS.some((k) => n.includes(k))) return true;
  return RE_VISCOSIDAD_ACEITE.test(n);
}
const FIAT_FLUIDO_EXTRA_KEYWORDS = ["diferencial", "transmisi", "transferencia"];
function esFluidoExtraFiat(nombre: string | null, producto: string | null | undefined): boolean {
  if (producto === "FLUÍDOS") return false;
  const n = (nombre || "").toLowerCase();
  return FIAT_FLUIDO_EXTRA_KEYWORDS.some((k) => n.includes(k));
}

function Tip({ label, texto }: { label: string; texto: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <span
      className="relative inline-block cursor-help border-b border-dotted border-[var(--text-muted)]"
      onMouseEnter={() => setAbierto(true)}
      onMouseLeave={() => setAbierto(false)}
    >
      {label}
      {abierto && (
        <span className="absolute bottom-full left-1/2 z-20 mb-1.5 w-56 -translate-x-1/2 rounded-[var(--radius-sm)]
                          bg-[var(--brand-deep)] p-2 text-[11.5px] font-normal normal-case text-white shadow-[var(--shadow-lg)]">
          {texto}
        </span>
      )}
    </span>
  );
}

function StockDot({ item }: { item: ItemDePlanConStock | StockDeCodigo }) {
  const gestionado = "esStockGestionado" in item && item.esStockGestionado;
  if (!gestionado) {
    const tieneCodigo = "codigo" in item ? item.codigo : ("producto" in item ? item.producto : null);
    const motivo = !tieneCodigo
      ? "La marca publica este service como precio cerrado y no informa el número de pieza, así que no hay código con el cual consultar el stock"
      : "Este código no está bajo control de stock";
    return <Badge tono="neutral" title={motivo}>sin datos</Badge>;
  }
  const hay = (item.stockActual || 0) > 0;
  return <Badge tono={hay ? "good" : "critical"} dot>{hay ? `${item.stockActual} en stock` : "sin stock"}</Badge>;
}

function EquivalentesDetalle({ equivalentes }: { equivalentes: StockDeCodigo[] }) {
  const conCatalogo = equivalentes.filter((e) => e.marcaNombre);
  if (!conCatalogo.length) return null;
  return (
    <details className="mt-1 text-[11.5px]">
      <summary className="cursor-pointer text-[var(--brand)]">
        ⇄ {conCatalogo.length} código{conCatalogo.length > 1 ? "s" : ""} equivalente{conCatalogo.length > 1 ? "s" : ""}
      </summary>
      <table className="mt-1.5 w-full text-[11.5px]">
        <thead>
          <tr className="text-left text-[var(--text-muted)]">
            <th className="pr-2 font-medium">Código</th><th className="pr-2 font-medium">Marca</th><th className="font-medium">Stock</th>
          </tr>
        </thead>
        <tbody>
          {conCatalogo.map((e, i) => (
            <tr key={i}>
              <td className="pr-2 font-mono">{e.codigo}</td>
              <td className="pr-2">{e.marcaNombre}</td>
              <td><StockDot item={e} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

function avisoTarifaPlana(marca: string, plan: PlanConDetalle): string {
  const detalle = plan.notas && /No incluye:/i.test(plan.notas)
    ? plan.notas.split("No incluye:")[1]?.split("·")[0]?.trim()
    : null;
  if (detalle) {
    return `${marca} publica este service como precio cerrado con IVA (repuestos originales y mano de obra adentro): ` +
      `informa qué trabajos entran, no con qué número de pieza ni a qué costo cada uno, así que el desglose por ` +
      `repuesto no se puede abrir. Quedan afuera del pack y se cotizan aparte: ${detalle}`;
  }
  return `${marca} vende el mantenimiento base (aceite de motor + filtros) como tarifa plana por visita; los ` +
    `repuestos y fluidos adicionales de cada service y la mano de obra extra se suman aparte.`;
}

export function PlanDetalle({
  plan,
  marcaNombre,
  lub,
  adj,
  onGuardarHistorial,
}: {
  plan: PlanConDetalle;
  marcaNombre: string;
  lub: LubricacionResultado | null;
  adj: (v: number | null | undefined) => number;
  onGuardarHistorial?: () => void;
}) {
  const imprimir = () => window.print();

  if (plan.esFlatRate && !plan.repuestos.length && !plan.fluidos.length && plan.checklist.length) {
    return (
      <div className="flex flex-col gap-4">
        <Aviso texto={avisoTarifaPlana(marcaNombre, plan)} />
        <Card>
          <CardTitle>Qué incluye este mantenimiento</CardTitle>
          <ul className="mt-2 list-disc pl-5 text-[13px] leading-[1.9]">
            {plan.checklist.map((c, i) => <li key={i}>{c.item}</li>)}
          </ul>
        </Card>
        <BloqueLubricacion lub={lub} />
        <TotalRow label="Precio del service al público" valor={money(adj(plan.precioSugerido))} />
        <Acciones
          onGuardar={onGuardarHistorial}
          onImprimir={imprimir}
          onExportar={() => exportarExcelCotizacion(plan, marcaNombre, adj)}
          onEnviarWhatsApp={() => window.open(`https://wa.me/?text=${encodeURIComponent(mensajeWhatsApp(plan, marcaNombre, money(adj(plan.precioSugerido))))}`, "_blank")}
        />
      </div>
    );
  }

  if (plan.esFlatRate) {
    const tienePackDesglosado = plan.packRepuestosCosto != null && plan.packManoObraCosto != null;
    const packRepuestos = adj(plan.packRepuestosCosto || 0);
    const packManoObra = adj(plan.packManoObraCosto || 0);
    const packPrice = tienePackDesglosado ? packRepuestos + packManoObra : adj(plan.costoTotal ?? plan.precioSugerido ?? 0);
    const extraRepuestos = adj(plan.totalRepuestos || 0);
    const extraFluidos = adj(plan.totalFluidos || 0);
    const manoObraExtra = adj(plan.manoObraCosto || 0);
    const tieneExtras = (plan.manoObraHoras || 0) > 0;
    const precioPublicado = !tienePackDesglosado && plan.costoTotal != null
      ? adj(plan.costoTotal) + extraRepuestos + extraFluidos + manoObraExtra
      : null;
    const noPrice = !plan.precioSugerido && precioPublicado == null;
    const mostrarResumen = tienePackDesglosado || plan.costoTotal != null || extraRepuestos > 0 || extraFluidos > 0 || tieneExtras;

    let notas: string[] = [];
    try { notas = JSON.parse(plan.notas || "[]"); } catch {}
    const confirmar = notas.filter((n) => n.startsWith("Precio a confirmar:"));
    const otras = notas.filter((n) => !n.startsWith("Precio a confirmar:"));

    return (
      <div className="flex flex-col gap-4">
        <Aviso texto={avisoTarifaPlana(marcaNombre, plan)} />
        {confirmar.length > 0 && <Aviso texto={confirmar.join(" · ")} tono="warning" />}

        {plan.checklist.length > 0 && (
          <Card>
            <CardTitle>Qué incluye este mantenimiento</CardTitle>
            <ul className="mt-2 list-disc pl-5 text-[13px] leading-[1.9]">
              {plan.checklist.map((c, i) => <li key={i}>{c.item}</li>)}
            </ul>
          </Card>
        )}

        <Card>
          <CardTitle>Repuestos</CardTitle>
          <TablaItems
            filas={plan.repuestos}
            campoCodigo="codigo"
            esBasico={(r) => esRepuestoBasicoFiat(r.nombre)}
            adj={adj}
          />
        </Card>
        <Card>
          <CardTitle>Fluidos</CardTitle>
          <TablaItems
            filas={plan.fluidos}
            campoCodigo="producto"
            esBasico={(f) => !esFluidoExtraFiat(f.nombre, f.producto)}
            adj={adj}
          />
        </Card>

        {otras.length > 0 && (
          <Card>
            <CardTitle>Condiciones adicionales</CardTitle>
            <div className="mt-2 flex flex-col gap-1 text-[12px] text-[var(--text-secondary)]">
              {otras.map((n, i) => <div key={i}>• {n}</div>)}
            </div>
          </Card>
        )}

        <BloqueLubricacion lub={lub} />

        {mostrarResumen && (
          <Card>
            <CardTitle>Resumen del precio</CardTitle>
            <div className="mt-2 flex flex-col gap-1.5 text-[13px]">
              {tienePackDesglosado ? (
                <>
                  <LineaResumen label={<Tip label="Repuestos del pack c/IVA" texto="Costo de reposición con IVA (21%)" />} valor={money(packRepuestos)} />
                  <LineaResumen
                    label={<Tip label={`Mano de obra del pack (${horasATiempo(packManoObra / 250000)})`}
                                texto={`Diferencia entre el precio fijo del pack y el costo de sus repuestos, a ${money(250000)} la hora`} />}
                    valor={money(packManoObra)}
                  />
                </>
              ) : (
                <LineaResumen label="Pack (aceite de motor + filtros)" valor={money(packPrice)} />
              )}
              {extraRepuestos > 0 && (
                <LineaResumen label={<Tip label="Repuestos adicionales c/IVA" texto="Costo de reposición con IVA (21%)" />} valor={money(extraRepuestos)} />
              )}
              {extraFluidos > 0 && (
                <LineaResumen label={<Tip label="Fluidos adicionales c/IVA" texto="Costo de reposición con IVA (21%)" />} valor={money(extraFluidos)} />
              )}
              {tieneExtras && (
                <LineaResumen label={`Mano de obra adicional (${horasATiempo(plan.manoObraHoras)})`} valor={money(manoObraExtra)} />
              )}
            </div>
          </Card>
        )}

        {noPrice ? (
          <TotalRow label="Precio" valor="Consultar al concesionario" tono="warning" />
        ) : (
          <TotalRow
            label={<Tip label="Precio del service c/IVA" texto={`Precio final del pack publicado por ${marcaNombre}, con IVA incluido`} />}
            valor={money(precioPublicado != null ? precioPublicado : adj(plan.precioSugerido))}
          />
        )}
        <Acciones
          onGuardar={onGuardarHistorial}
          onImprimir={imprimir}
          onExportar={() => exportarExcelCotizacion(plan, marcaNombre, adj)}
          onEnviarWhatsApp={noPrice ? undefined : () => window.open(
            `https://wa.me/?text=${encodeURIComponent(mensajeWhatsApp(plan, marcaNombre, money(precioPublicado != null ? precioPublicado : adj(plan.precioSugerido))))}`,
            "_blank",
          )}
        />
      </div>
    );
  }

  // Plan normal (BAIC / ARCFOX): donut de composición.
  const crep = adj(plan.totalRepuestos || 0);
  const cflu = adj(plan.totalFluidos || 0);
  const cmo = adj(plan.manoObraCosto || 0);
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardTitle>Composición del costo</CardTitle>
        <div className="mt-3">
          <Donut
            formatMoneda={money}
            segmentos={[
              { label: "Repuestos", value: crep, color: "var(--cz-slice-rep)" },
              { label: "Fluidos", value: cflu, color: "var(--cz-slice-flu)" },
              { label: "Mano de obra", value: cmo, color: "var(--cz-slice-mo)", etiqueta: `Mano de obra (${horasATiempo(plan.manoObraHoras)})` },
            ]}
          />
        </div>
      </Card>
      <Card>
        <CardTitle>Repuestos</CardTitle>
        <TablaItems filas={plan.repuestos} campoCodigo="codigo" esBasico={() => false} adj={adj} />
      </Card>
      <Card>
        <CardTitle>Fluidos</CardTitle>
        <TablaItems filas={plan.fluidos} campoCodigo="producto" esBasico={() => false} adj={adj} />
      </Card>
      {plan.checklist.length > 0 && (
        <Card>
          <CardTitle>Checklist</CardTitle>
          <ul className="mt-2 list-disc pl-5 text-[13px] leading-[1.9]">
            {plan.checklist.map((c, i) => <li key={i}>{c.item}</li>)}
          </ul>
        </Card>
      )}
      <BloqueLubricacion lub={lub} />
      <TotalRow label="Costo total del servicio" valor={money(crep + cflu + cmo)} />
      {plan.precioSugerido != null && <TotalRow label="Precio sugerido al público" valor={money(adj(plan.precioSugerido))} />}
      <Acciones
        onGuardar={onGuardarHistorial}
        onImprimir={imprimir}
        onExportar={() => exportarExcelCotizacion(plan, marcaNombre, adj)}
        onEnviarWhatsApp={() => window.open(
          `https://wa.me/?text=${encodeURIComponent(mensajeWhatsApp(plan, marcaNombre, plan.precioSugerido != null ? money(adj(plan.precioSugerido)) : money(crep + cflu + cmo)))}`,
          "_blank",
        )}
      />
    </div>
  );
}

function Aviso({ texto, tono = "info" }: { texto: string; tono?: "info" | "warning" }) {
  return (
    <div
      className="flex items-start gap-2 rounded-[var(--radius-md)] p-3.5 text-[12.5px] leading-relaxed"
      style={{
        background: tono === "info" ? "var(--cz-bg-accent)" : "var(--cz-bg-warning)",
        color: tono === "info" ? "var(--text-secondary)" : "var(--cz-text-warning)",
      }}
    >
      <span>ⓘ</span>
      <span>{texto}</span>
    </div>
  );
}

function precioCelda(basico: boolean, total: number | null, adj: (v: number | null | undefined) => number) {
  if (total) {
    return basico
      ? <span className="text-[var(--text-muted)]" title="Costo real con IVA. Ya está adentro del precio del pack: no se suma aparte">{money(adj(total))}</span>
      : <span>{money(adj(total))}</span>;
  }
  if (basico) {
    return <span className="text-[var(--text-muted)]" title="Entra en el pack. La marca no publica el costo de esta pieza por separado">Incluido</span>;
  }
  return <span style={{ color: "var(--cz-text-warning)" }}>A confirmar</span>;
}

function TablaItems({
  filas, campoCodigo, esBasico, adj,
}: {
  filas: ItemDePlanConStock[];
  campoCodigo: "codigo" | "producto";
  esBasico: (item: ItemDePlanConStock) => boolean;
  adj: (v: number | null | undefined) => number;
}) {
  if (!filas.length) {
    return <p className="py-2 text-[13px] text-[var(--text-muted)]">No requiere {campoCodigo === "codigo" ? "repuestos" : "fluidos"}.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-[13px]">
        <thead>
          <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            <th className="py-2 pr-2 font-semibold">{campoCodigo === "codigo" ? "Repuesto" : "Fluido"}</th>
            <th className="py-2 pr-2 font-semibold">{campoCodigo === "codigo" ? "Código" : "Producto"}</th>
            <th className="py-2 pr-2 text-center font-semibold">Cant.</th>
            <th className="py-2 pr-2 font-semibold">Stock</th>
            <th className="py-2 text-right font-semibold">Total c/IVA</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => {
            const codigo = campoCodigo === "codigo" ? f.codigo : f.producto;
            const basico = esBasico(f);
            return (
              <tr key={i} className="border-b border-[var(--border)] last:border-0">
                <td className="py-2 pr-2">{f.nombre}</td>
                <td className="py-2 pr-2 font-mono text-[var(--text-muted)]">
                  {codigo || (
                    <span
                      title={campoCodigo === "codigo"
                        ? "La marca publica este service como precio cerrado: informa qué se cambia, no con qué número de pieza"
                        : "El plan no nombra el producto; el aceite que corresponde a este modelo está en el recuadro de Lubricación, más abajo"}
                    >
                      {campoCodigo === "codigo" ? "sin código de la marca" : "ver Lubricación recomendada"}
                    </span>
                  )}
                  {codigo && <EquivalentesDetalle equivalentes={f.equivalentes} />}
                </td>
                <td className="py-2 pr-2 text-center">{campoCodigo === "codigo" ? f.cantidad : (f.litros ?? "—")}</td>
                <td className="py-2 pr-2"><StockDot item={f} /></td>
                <td className="py-2 text-right">{precioCelda(basico, f.total, adj)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LineaResumen({ label, valor }: { label: React.ReactNode; valor: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="font-semibold">{valor}</span>
    </div>
  );
}

function TotalRow({ label, valor, tono = "brand" }: { label: React.ReactNode; valor: string; tono?: "brand" | "warning" }) {
  return (
    <div
      className="flex items-center justify-between rounded-[var(--radius-md)] px-4 py-3.5"
      style={{
        background: tono === "brand"
          ? "linear-gradient(135deg, var(--brand-soft), transparent)"
          : "var(--cz-bg-warning)",
        borderLeft: `3px solid ${tono === "brand" ? "var(--brand)" : "var(--status-warning)"}`,
      }}
    >
      <span className="text-[13px] font-semibold" style={{ color: tono === "warning" ? "var(--cz-text-warning)" : "var(--text-secondary)" }}>
        {label}
      </span>
      <span className="text-[19px] font-extrabold" style={{ color: tono === "warning" ? "var(--cz-text-warning)" : "var(--text-primary)" }}>
        {valor}
      </span>
    </div>
  );
}

function exportarExcelCotizacion(
  plan: PlanConDetalle,
  marcaNombre: string,
  adj: (v: number | null | undefined) => number,
) {
  import("xlsx").then((XLSX) => {
    const filas = [
      ...plan.repuestos.map((r) => ({
        Tipo: "Repuesto", Nombre: r.nombre, Código: r.codigo ?? "", Cantidad: r.cantidad,
        "Total c/IVA": r.total != null ? adj(r.total) : "",
      })),
      ...plan.fluidos.map((f) => ({
        Tipo: "Fluido", Nombre: f.nombre, Código: f.producto ?? "", Cantidad: f.litros ?? "",
        "Total c/IVA": f.total != null ? adj(f.total) : "",
      })),
    ];
    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cotización");
    XLSX.writeFile(wb, `Cotizacion_${marcaNombre}.xlsx`.replace(/\s+/g, "_"));
  });
}

function mensajeWhatsApp(plan: PlanConDetalle, marcaNombre: string, precioTexto: string): string {
  const lineas = [
    `*Cotización de mantenimiento*`,
    `${marcaNombre} ${plan.modeloNombre} · ${Math.round(plan.kmIntervalo / 1000)}.000 km`,
    "",
  ];
  if (plan.checklist.length) {
    lineas.push("Incluye:");
    for (const c of plan.checklist.slice(0, 10)) lineas.push(`• ${c.item}`);
    lineas.push("");
  }
  lineas.push(`*Precio: ${precioTexto}*`);
  return lineas.join("\n");
}

function Acciones({
  onGuardar, onImprimir, onExportar, onEnviarWhatsApp,
}: {
  onGuardar?: () => void;
  onImprimir: () => void;
  onExportar?: () => void;
  onEnviarWhatsApp?: () => void;
}) {
  return (
    <div className="no-print flex flex-wrap gap-2">
      {onGuardar && <Button onClick={onGuardar}>Guardar en historial</Button>}
      {onExportar && <Button onClick={onExportar}>Exportar a Excel</Button>}
      {onEnviarWhatsApp && <Button onClick={onEnviarWhatsApp}>Enviar por WhatsApp</Button>}
      <Button onClick={onImprimir}>Imprimir / PDF</Button>
    </div>
  );
}

export interface LubricacionResultado {
  encontrado: boolean;
  modelo?: string;
  motivo?: string;
  motor?: string | null;
  transManual?: string | null;
  transAutomatica?: string | null;
  diferencial?: string | null;
  frenos?: string | null;
  refrigerante?: string | null;
}

function BloqueLubricacion({ lub }: { lub: LubricacionResultado | null }) {
  if (!lub) return null;
  if (!lub.encontrado) {
    return (
      <Card>
        <CardTitle>Lubricación</CardTitle>
        <p className="mt-1.5 text-[12.5px] text-[var(--text-muted)]">{lub.motivo}</p>
      </Card>
    );
  }
  const filas = [
    ["Aceite de motor", lub.motor],
    ["Caja manual", lub.transManual],
    ["Caja automática", lub.transAutomatica],
    ["Diferencial", lub.diferencial],
    ["Líquido de frenos", lub.frenos],
    ["Refrigerante", lub.refrigerante],
  ].filter(([, v]) => v);
  return (
    <Card>
      <CardTitle>Lubricación recomendada</CardTitle>
      <div className="mt-2 flex flex-col gap-1.5 text-[13px]">
        {filas.map(([label, valor], i) => (
          <div key={i} className="flex items-center justify-between border-b border-[var(--border)] py-1 last:border-0">
            <span className="text-[var(--text-secondary)]">{label}</span>
            <span className="font-semibold">{valor}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-[var(--text-muted)]">
        Guía de Lubricantes TotalEnergies Argentina 2025. Indica qué producto corresponde, no cuántos litros. Ante una duda, consultá el manual del vehículo.
      </p>
    </Card>
  );
}
