"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError, type UsuarioPublico } from "@/lib/apiClient";
import { useToast } from "@/components/Toast";
import { LoginModal } from "@/components/LoginModal";

interface AuthContextValor {
  usuario: UsuarioPublico | null;
  cargando: boolean;
  puede: (permiso: string) => boolean;
  esAdmin: boolean;
  login: (usuario: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refrescar: () => Promise<void>;
  /** Si ya hay sesión, resuelve enseguida. Si no, abre el modal de login y
   *  resuelve cuando el usuario entra o cancela — para gatear una acción de
   *  escritura sin armar una pantalla de login aparte. */
  requireAuth: () => Promise<boolean>;
  /** Igual que requireAuth, pero además chequea el permiso puntual: si entró
   *  con una cuenta que no alcanza, avisa por toast en vez de dejar que el
   *  servidor devuelva un 403 seco al guardar. */
  requirePermiso: (permiso: string) => Promise<boolean>;
  abrirRegistro: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValor | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioPublico | null>(null);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState<{ abierto: boolean; modo: "login" | "registro" }>({
    abierto: false, modo: "login",
  });
  const resolverModal = useRef<((ok: boolean) => void) | null>(null);
  const toast = useToast();

  const refrescar = useCallback(async () => {
    try {
      setUsuario(await api.auth.me());
    } catch {
      setUsuario(null);
    }
  }, []);

  useEffect(() => {
    refrescar().finally(() => setCargando(false));
  }, [refrescar]);

  const login = useCallback(async (usr: string, password: string) => {
    const data = await api.auth.login({ usuario: usr, password });
    setUsuario(data);
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout().catch(() => {});
    setUsuario(null);
    toast("Sesión cerrada");
  }, [toast]);

  const puede = useCallback((permiso: string) => Boolean(usuario?.permisos.includes(permiso)), [usuario]);
  const esAdmin = puede("usuarios:gestionar");

  const abrirModal = useCallback((modo: "login" | "registro"): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverModal.current = resolve;
      setModal({ abierto: true, modo });
    });
  }, []);

  const cerrarModal = useCallback((ok: boolean) => {
    setModal((m) => ({ ...m, abierto: false }));
    resolverModal.current?.(ok);
    resolverModal.current = null;
  }, []);

  const requireAuth = useCallback((): Promise<boolean> => {
    if (usuario) return Promise.resolve(true);
    return abrirModal("login");
  }, [usuario, abrirModal]);

  const abrirRegistro = useCallback((): Promise<boolean> => {
    if (usuario) return Promise.resolve(true);
    return abrirModal("registro");
  }, [usuario, abrirModal]);

  const requirePermiso = useCallback(async (permiso: string): Promise<boolean> => {
    const entro = await requireAuth();
    if (!entro) return false;
    // usuario puede no estar actualizado en este closure justo después del
    // login (setState es async) — se relee de la respuesta más reciente vía
    // api.me() para no arriesgar un falso negativo.
    const actual = await api.auth.me().catch(() => null);
    if (!actual?.permisos.includes(permiso)) {
      toast(`Tu nivel de acceso (${actual?.rolLabel ?? ""}) no permite hacer esto`, "error");
      return false;
    }
    return true;
  }, [requireAuth, toast]);

  const valor = useMemo(
    () => ({
      usuario, cargando, puede, esAdmin, login, logout, refrescar, requireAuth, requirePermiso, abrirRegistro,
    }),
    [usuario, cargando, puede, esAdmin, login, logout, refrescar, requireAuth, requirePermiso, abrirRegistro],
  );

  return (
    <AuthContext.Provider value={valor}>
      {children}
      <LoginModal
        abierto={modal.abierto}
        modoInicial={modal.modo}
        onCerrar={cerrarModal}
        onIngreso={(u) => { setUsuario(u); }}
      />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValor {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() tiene que usarse dentro de <AuthProvider>");
  return ctx;
}

export { ApiError };
