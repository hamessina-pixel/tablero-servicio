"use client";

import { useEffect, useState } from "react";
import { api, ApiError, type UsuarioPublico } from "@/lib/apiClient";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LoginModal({
  abierto,
  modoInicial,
  onCerrar,
  onIngreso,
}: {
  abierto: boolean;
  modoInicial: "login" | "registro";
  onCerrar: (ok: boolean) => void;
  onIngreso: (usuario: UsuarioPublico) => void;
}) {
  const toast = useToast();
  const [modo, setModo] = useState<"login" | "registro">(modoInicial);
  const [primeraCuenta, setPrimeraCuenta] = useState(false);
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setModo(modoInicial);
    setNombre(""); setUsuario(""); setPassword(""); setPassword2("");
    api.auth.estado().then((estado) => {
      setPrimeraCuenta(estado.primeraCuenta);
      if (estado.primeraCuenta) setModo("registro");
    }).catch(() => {});
  }, [abierto, modoInicial]);

  if (!abierto) return null;

  const esRegistro = modo === "registro";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      if (esRegistro) {
        if (!nombre || !usuario || !password) { toast("Completá todos los campos", "error"); return; }
        if (password !== password2) { toast("Las contraseñas no coinciden", "error"); return; }
        const res = await api.auth.registro({ nombre, usuario, password });
        if (res.primeraCuenta) {
          onIngreso(res.usuario);
          toast(`Listo, ${res.usuario.nombre}. Sos el administrador.`, "success");
          onCerrar(true);
        } else {
          toast(res.mensaje, "success");
          setModo("login"); setPassword(""); setPassword2("");
        }
        return;
      }
      if (!usuario || !password) { toast("Completá usuario y contraseña", "error"); return; }
      const data = await api.auth.login({ usuario, password });
      onIngreso(data);
      toast(`Hola, ${data.nombre}`, "success");
      onCerrar(true);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Ocurrió un error", "error");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[3px] p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(false); }}
    >
      <div className="w-full max-w-[380px] rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)]">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            {esRegistro ? (primeraCuenta ? "Crear la primera cuenta" : "Crear cuenta nueva") : "Iniciar sesión"}
          </h2>
          <button
            type="button"
            onClick={() => onCerrar(false)}
            className="rounded-full p-1 text-xl leading-none text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
          >
            &times;
          </button>
        </div>
        <p className="mb-4 text-[13px] text-[var(--text-secondary)]">
          {esRegistro
            ? primeraCuenta
              ? <>Todavía no hay ninguna cuenta en el sistema. Esta primera queda como <strong>administrador</strong> y entra en el acto.</>
              : "La cuenta queda pendiente hasta que un administrador la habilite y le asigne el nivel de acceso."
            : "Necesitás iniciar sesión para editar."}
        </p>

        <form onSubmit={submit} className="space-y-3">
          {esRegistro && (
            <Campo label="Nombre y apellido">
              <Input autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
            </Campo>
          )}
          <Campo label="Usuario">
            <Input autoComplete="username" value={usuario} onChange={(e) => setUsuario(e.target.value)}
                   autoFocus={!esRegistro} />
          </Campo>
          <Campo label="Contraseña">
            <Input type="password" autoComplete={esRegistro ? "new-password" : "current-password"}
                   value={password} onChange={(e) => setPassword(e.target.value)} />
          </Campo>
          {esRegistro && (
            <Campo label="Repetir contraseña">
              <Input type="password" autoComplete="new-password"
                     value={password2} onChange={(e) => setPassword2(e.target.value)} />
            </Campo>
          )}

          <div className="flex items-center justify-between pt-2">
            {!primeraCuenta ? (
              <button
                type="button"
                onClick={() => setModo(esRegistro ? "login" : "registro")}
                className="border-0 bg-transparent p-0 text-[13px] text-[var(--brand)] underline"
              >
                {esRegistro ? "Ya tengo cuenta" : "Crear cuenta nueva"}
              </button>
            ) : <span />}
            <div className="flex gap-2">
              <Button type="button" onClick={() => onCerrar(false)}>Cancelar</Button>
              <Button type="submit" variante="primary" disabled={enviando}>
                {esRegistro ? "Crear cuenta" : "Entrar"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[12.5px] font-semibold text-[var(--text-secondary)]">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
