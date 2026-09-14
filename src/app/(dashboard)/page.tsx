"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { useMarcas } from "@/components/MarcasProvider";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BarChart } from "@/components/ui/BarChart";
import { Button } from "@/components/ui/Button";
import { money, compactNumber, number } from "@/lib/format";
import type { ResumenDashboard, ResumenPorModelo } from "@/domain/types";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function fechaLarga(d: Date) {
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

function saludo(d: Date) {
  const h = d.getHours();
  if (h < 13) return "Buen día";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

export default function InicioPage() {
  const router = useRouter();
  const { colorMarca, cargando: cargandoMarcas } = useMarcas();
  const { usuario } = useAuth();
  const [r, setR] = useState<ResumenDashboard | null>(null);
  const [planes, setPlanes] = useState<ResumenPorModelo[]>([]);
  const [sinAcceso, setSinAcceso] = useState(false);
  const [ahora, setAhora] = useState<Date | null>(null);

  // Se vuelve a pedir al entrar o salir: el resumen del negocio pide sesión, y
  // si no se reintenta, alguien que se loguea desde acá se queda mirando el
  // cartel de "iniciá sesión" hasta recargar a mano.
  useEffect(() => {
    setSinAcceso(false);
    api.dashboard.resumen().then(setR).catch(() => { setR(null); setSinAcceso(true); });
    api.planes.resumen().then(setPlanes);
    // La fecha se arma en el navegador: si se calcula al renderizar en el
    // servidor, la hora del hosting no es la del taller.
    setAhora(new Date());
  }, [usuario?.id]);

  const costoKmPorMarca = (() => {
    const mapa = new Map<string, { suma: number; n: number }>();
    for (const p of planes) {
      const e = mapa.get(p.marca) ?? { suma: 0, n: 0 };
      e.suma += p.costoKm; e.n += 1;
      mapa.set(p.marca, e);
    }
    return [...mapa.entries()]
      .map(([marca, e]) => ({ marca, promedio: e.n ? e.suma / e.n : 0 }))
      .sort((a, b) => b.promedio - a.promedio);
  })();

  if (sinAcceso) {
    return (
      <div className="flex flex-col gap-5">
        <Portada empresa="Panel de Servicio" ahora={ahora} nombre={null} />
        <Card>
          <CardTitle>Accesos rápidos</CardTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => router.push("/repuestos")}>Buscar un repuesto</Button>
            <Button onClick={() => router.push("/cotizador")}>Ir al cotizador</Button>
            <Button onClick={() => router.push("/sustituciones")}>Ver sustituciones</Button>
          </div>
        </Card>
        <Card>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Iniciá sesión para ver el resumen del negocio: valor del stock, faltantes y trabajo del día.
          </p>
        </Card>
      </div>
    );
  }

  if (!r || cargandoMarcas) {
    return <div className="py-16 text-center text-[13px] text-[var(--text-muted)]">Cargando…</div>;
  }

  const pendientes = [
    r.repuestosStockBajo > 0 && {
      texto: `${number(r.repuestosStockBajo)} código${r.repuestosStockBajo > 1 ? "s" : ""} por debajo del mínimo`,
      accion: "Ver faltantes", ir: "/repuestos?stockBajo=1", tono: "critical" as const,
    },
    r.enListaCompra > 0 && {
      texto: `${number(r.enListaCompra)} repuesto${r.enListaCompra > 1 ? "s" : ""} esperando en la lista de compra`,
      accion: "Armar pedido", ir: "/pedidos", tono: "warning" as const,
    },
    r.cuentasPendientes > 0 && {
      texto: `${number(r.cuentasPendientes)} cuenta${r.cuentasPendientes > 1 ? "s" : ""} esperando aprobación`,
      accion: "Revisar", ir: "/usuarios", tono: "warning" as const,
    },
  ].filter(Boolean) as { texto: string; accion: string; ir: string; tono: "critical" | "warning" }[];

  return (
    <div className="flex flex-col gap-5">
      <Portada empresa={r.empresa} ahora={ahora} nombre={usuario?.nombre ?? null} />

      {/* Lo que requiere una decisión hoy va antes que cualquier número. */}
      {pendientes.length > 0 && (
        <div className="flex flex-col gap-2">
          {pendientes.map((p, i) => (
            <div key={i}
                 className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] px-4 py-3"
                 style={{
                   background: p.tono === "critical" ? "var(--cz-bg-warning)" : "var(--surface-raised)",
                   borderLeft: `3px solid ${p.tono === "critical" ? "var(--status-critical)" : "var(--status-warning)"}`,
                 }}>
              <span className="text-[13px] font-semibold">{p.texto}</span>
              <Button tamano="sm" onClick={() => router.push(p.ir)}>{p.accion}</Button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
        {/* El número que manda: cuánta plata hay inmovilizada en el depósito. */}
        <Card>
          <CardTitle>Capital inmovilizado en repuestos</CardTitle>
          <p className="mt-2 text-[30px] font-extrabold leading-none tracking-tight">
            {money(r.valorStockGestionado)}
          </p>
          <p className="mt-1.5 text-[12px] text-[var(--text-muted)]">
            {number(r.repuestosStockGestionado)} códigos con control de stock, a costo de reposición sin IVA
          </p>
          <div className="mt-4">
            <BarChart
              rows={r.valorStockPorMarca.map((x) => ({
                label: x.marca, value: x.valor, color: colorMarca(x.marca), valueLabel: money(x.valor),
              }))}
            />
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Mini label="Cotizaciones del mes" valor={number(r.cotizacionesDelMes)} />
            <Mini label="Repuestos en catálogo" valor={compactNumber(r.repuestosTotal)} />
            <Mini label="Modelos con plan" valor={number(r.modelos)} />
            <Mini label="Equivalencias" valor={compactNumber(r.sustituciones)} />
          </div>

          <Card className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Últimas cotizaciones</CardTitle>
              <Button tamano="sm" onClick={() => router.push("/cotizador?tab=historial")}>Ver todas</Button>
            </div>
            {r.ultimasCotizaciones.length === 0 ? (
              <p className="mt-3 text-[12.5px] text-[var(--text-muted)]">Todavía no se guardó ninguna cotización.</p>
            ) : (
              <div className="mt-2 flex flex-col">
                {r.ultimasCotizaciones.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 border-b border-[var(--border)] py-1.5 text-[12.5px] last:border-0">
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-semibold">{c.patente || c.cliente || `${c.marca} ${c.modelo}`}</span>
                      <span className="text-[var(--text-muted)]"> · {c.modelo} {Math.round(c.km / 1000)}k</span>
                    </span>
                    <span className="whitespace-nowrap font-semibold">{money(c.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {r.faltantesCriticos.length > 0 && (
        <Card>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Lo que más falta</CardTitle>
              <p className="text-[12px] text-[var(--text-muted)]">Códigos más lejos de su stock mínimo</p>
            </div>
            <Button tamano="sm" onClick={() => router.push("/repuestos?stockBajo=1")}>Ver todos</Button>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[12.5px]">
              <tbody>
                {r.faltantesCriticos.map((f, i) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2 pr-3 font-mono">{f.codigo}</td>
                    <td className="py-2 pr-3">{f.nombre}</td>
                    <td className="py-2 pr-3 text-[var(--text-muted)]">{f.marca}</td>
                    <td className="py-2 text-right">
                      <Badge tono="critical" dot>{f.stockActual} / {f.stockMinimo}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <CardTitle>Costo de mantenimiento por kilómetro</CardTitle>
            <p className="text-[12px] text-[var(--text-muted)]">
              Promedio de los planes cargados de cada marca — sirve para comparar qué sale más caro de mantener
            </p>
          </div>
          <Button tamano="sm" onClick={() => router.push("/cotizador?tab=comparador")}>Comparar</Button>
        </div>
        <BarChart
          rows={costoKmPorMarca.map((x) => ({
            label: x.marca, value: x.promedio, color: colorMarca(x.marca), valueLabel: money(x.promedio),
          }))}
        />
      </Card>
    </div>
  );
}

/** Encabezado del sistema: de quién es el taller, qué día es y quién entró. */
function Portada({ empresa, ahora, nombre }: { empresa: string; ahora: Date | null; nombre: string | null }) {
  return (
    <div
      className="rounded-[var(--radius-lg)] px-5 py-5"
      style={{
        background: "linear-gradient(135deg, var(--brand-soft), transparent 70%)",
        borderLeft: "3px solid var(--brand)",
      }}
    >
      <h1 className="text-[26px] font-extrabold leading-tight tracking-tight">{empresa}</h1>
      <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
        {nombre ? `${saludo(ahora ?? new Date())}, ${nombre.split(" ")[0]}.` : "Panel de servicio y repuestos."}
        {ahora && <span className="text-[var(--text-muted)]"> {fechaLarga(ahora)}</span>}
      </p>
    </div>
  );
}

function Mini({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--surface-raised)] px-3.5 py-3">
      <p className="text-[19px] font-extrabold leading-none">{valor}</p>
      <p className="mt-1.5 text-[11.5px] leading-tight text-[var(--text-muted)]">{label}</p>
    </div>
  );
}
