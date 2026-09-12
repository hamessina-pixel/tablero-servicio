"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { AccountBlock } from "@/components/AccountBlock";

const GRUPOS: { label: string; items: { label: string; href: string; icon: string }[] }[] = [
  { label: "Servicio", items: [{ label: "Cotizador", href: "/cotizador", icon: "🧮" }] },
  { label: "General", items: [{ label: "Inicio", href: "/", icon: "🏠" }] },
  {
    label: "Inventario",
    items: [
      { label: "Repuestos & Stock", href: "/repuestos", icon: "⚙️" },
      { label: "Fluidos", href: "/fluidos", icon: "🧴" },
      { label: "Sustituciones", href: "/sustituciones", icon: "⇄" },
      { label: "Pedidos de compra", href: "/pedidos", icon: "📦" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { esAdmin } = useAuth();

  return (
    <aside
      className="no-print sticky top-0 flex h-screen w-64 shrink-0 flex-col gap-6 overflow-y-auto p-5 text-[13.5px]"
      style={{ background: `linear-gradient(180deg, var(--sidebar-bg), var(--sidebar-bg-2))` }}
    >
      <div className="flex items-center gap-2 px-1">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: "var(--brand)", boxShadow: "0 0 0 4px var(--brand-glow)" }}
        />
        <span className="text-[15px] font-extrabold text-[var(--sidebar-ink-active)]">Panel de Servicio</span>
      </div>

      <nav className="flex flex-1 flex-col gap-5">
        {GRUPOS.map((grupo) => (
          <div key={grupo.label}>
            <div className="mb-1.5 px-2 text-[10.5px] font-bold uppercase tracking-[.08em] text-[var(--sidebar-ink)] opacity-70">
              {grupo.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {grupo.items.map((item) => {
                const activo = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2
                                transition-transform duration-[var(--t-fast)] hover:translate-x-[3px]
                                ${activo
                                  ? "font-bold text-[var(--sidebar-ink-active)]"
                                  : "text-[var(--sidebar-ink)] hover:bg-white/5"}`}
                    style={activo ? { background: "var(--sidebar-active-bg)" } : undefined}
                  >
                    {activo && (
                      <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full"
                            style={{ background: "var(--brand)" }} />
                    )}
                    <span aria-hidden>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {esAdmin && (
          <div>
            <div className="mb-1.5 px-2 text-[10.5px] font-bold uppercase tracking-[.08em] text-[var(--sidebar-ink)] opacity-70">
              Administración
            </div>
            <Link
              href="/usuarios"
              className={`flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 transition-transform
                          duration-[var(--t-fast)] hover:translate-x-[3px]
                          ${pathname.startsWith("/usuarios")
                            ? "font-bold text-[var(--sidebar-ink-active)]"
                            : "text-[var(--sidebar-ink)] hover:bg-white/5"}`}
              style={pathname.startsWith("/usuarios") ? { background: "var(--sidebar-active-bg)" } : undefined}
            >
              <span aria-hidden>👤</span>
              Usuarios
            </Link>
          </div>
        )}
      </nav>

      <div className="mt-auto">
        <AccountBlock />
      </div>

      <div className="border-t border-white/10 pt-3 text-[10.5px] leading-relaxed text-[var(--sidebar-ink)] opacity-60">
        Base de datos en la nube (Neon · Postgres)
        <br />
        BAIC · ARCFOX · FIAT · PEUGEOT · CITROEN
      </div>
    </aside>
  );
}
