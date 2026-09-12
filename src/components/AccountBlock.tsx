"use client";

import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";

export function AccountBlock() {
  const { usuario, requireAuth, abrirRegistro, logout } = useAuth();

  if (!usuario) {
    return (
      <div className="flex flex-col gap-1.5">
        <Button variante="primary" tamano="sm" className="w-full" onClick={() => requireAuth()}>
          Iniciar sesión
        </Button>
        <Button tamano="sm" className="w-full !border-[var(--sidebar-ink)]/20 !text-[var(--sidebar-ink)]"
                onClick={() => abrirRegistro()}>
          Crear cuenta nueva
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0 text-xs">
        <div className="truncate font-bold text-[var(--sidebar-ink-active)]">{usuario.nombre}</div>
        <div className="truncate text-[var(--sidebar-ink)]">{usuario.rolLabel}</div>
      </div>
      <Button tamano="sm" className="!border-[var(--sidebar-ink)]/20 !bg-transparent !text-[var(--sidebar-ink)]" onClick={() => logout()}>
        Salir
      </Button>
    </div>
  );
}
