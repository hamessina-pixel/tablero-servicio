"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

interface UsuarioFila {
  id: number; nombre: string; usuario: string; rol: string; rolLabel: string;
  activo: boolean; pendiente: boolean; creadoEn: string; ultimoAcceso: string | null;
}
interface RolInfo { rol: string; label: string; descripcion: string; permisos: string[]; }
interface PermisoInfo { permiso: string; label: string; }

export default function UsuariosPage() {
  const { usuario: yo, esAdmin } = useAuth();

  if (!esAdmin) {
    return <p className="text-[13px] text-[var(--text-muted)]">Esta sección es solo para administradores.</p>;
  }
  return <UsuariosAdmin yoId={yo!.id} />;
}

function UsuariosAdmin({ yoId }: { yoId: number }) {
  const toast = useToast();
  const [usuarios, setUsuarios] = useState<UsuarioFila[]>([]);
  const [roles, setRoles] = useState<RolInfo[]>([]);
  const [catalogoPermisos, setCatalogoPermisos] = useState<PermisoInfo[]>([]);
  const [modal, setModal] = useState<{ modo: "crear" } | { modo: "editar"; u: UsuarioFila; aprobar: boolean } | null>(null);

  function recargar() { api.auth.usuarios.listar().then(setUsuarios); }
  function recargarRoles() { api.auth.roles().then((d) => { setRoles(d.roles); setCatalogoPermisos(d.catalogoPermisos); }); }
  useEffect(() => { recargar(); recargarRoles(); }, []);

  const pendientes = usuarios.filter((u) => u.pendiente);

  async function eliminar(u: UsuarioFila) {
    const msg = u.pendiente
      ? `¿Rechazar la solicitud de cuenta de "${u.nombre}"?`
      : `¿Eliminar la cuenta de "${u.nombre}"? No se puede deshacer.`;
    if (!confirm(msg)) return;
    try {
      await api.auth.usuarios.eliminar(u.id);
      toast("Usuario eliminado", "success");
      recargar();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No se pudo eliminar", "error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">Usuarios</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">Altas, permisos y aprobación de cuentas.</p>
        </div>
        <Button variante="primary" onClick={() => setModal({ modo: "crear" })}>+ Nuevo usuario</Button>
      </div>

      {pendientes.length > 0 && (
        <div className="rounded-[var(--radius-md)] p-3.5 text-[12.5px]" style={{ background: "var(--cz-bg-warning)", color: "var(--cz-text-warning)" }}>
          Hay {pendientes.length} solicitud{pendientes.length > 1 ? "es" : ""} de cuenta esperando aprobación.
        </div>
      )}

      <Card className="!p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-2 py-3 font-semibold">Usuario</th>
                <th className="px-2 py-3 font-semibold">Nivel de acceso</th>
                <th className="px-2 py-3 font-semibold">Estado</th>
                <th className="px-2 py-3 font-semibold">Último acceso</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-2.5">{u.nombre}{u.id === yoId && " (vos)"}</td>
                  <td className="px-2 py-2.5">{u.usuario}</td>
                  <td className="px-2 py-2.5">{u.rolLabel}</td>
                  <td className="px-2 py-2.5">
                    {u.pendiente
                      ? <Badge tono="warning">pendiente</Badge>
                      : u.activo ? <Badge tono="good">activo</Badge> : <Badge tono="neutral">inactivo</Badge>}
                  </td>
                  <td className="px-2 py-2.5 text-[var(--text-muted)]">{u.ultimoAcceso ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      {u.pendiente && (
                        <Button tamano="sm" variante="primary" onClick={() => setModal({ modo: "editar", u, aprobar: true })}>Aprobar</Button>
                      )}
                      <Button tamano="sm" onClick={() => setModal({ modo: "editar", u, aprobar: false })}>Editar</Button>
                      {u.id !== yoId && <Button tamano="sm" variante="danger" onClick={() => eliminar(u)}>Eliminar</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ValorHoraCard />

      <Card>
        <CardTitle>Niveles de acceso</CardTitle>
        <p className="mb-2 mt-1 text-[12px] text-[var(--text-muted)]">
          Qué puede hacer cada nivel — tocá los permisos y guardá para cambiarlo.
        </p>
        <div className="mt-2 flex flex-col gap-4">
          {roles.map((r) => (
            <RolPermisosEditor key={r.rol} rol={r} catalogo={catalogoPermisos} onGuardado={recargarRoles} />
          ))}
        </div>
      </Card>

      {modal?.modo === "crear" && (
        <UsuarioFormModal roles={roles} onCerrar={() => setModal(null)} onGuardado={recargar} />
      )}
      {modal?.modo === "editar" && (
        <UsuarioFormModal roles={roles} usuario={modal.u} aprobar={modal.aprobar} onCerrar={() => setModal(null)} onGuardado={recargar} />
      )}
    </div>
  );
}

function UsuarioFormModal({
  roles, usuario, aprobar = false, onCerrar, onGuardado,
}: {
  roles: RolInfo[];
  usuario?: UsuarioFila;
  aprobar?: boolean;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const toast = useToast();
  const esNuevo = !usuario;
  const [nombre, setNombre] = useState(usuario?.nombre ?? "");
  const [nombreUsuario, setNombreUsuario] = useState(usuario?.usuario ?? "");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState(aprobar ? "lector" : (usuario?.rol ?? "editor"));
  const [activo, setActivo] = useState(usuario?.activo ?? true);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);
    try {
      if (esNuevo) {
        if (!nombre || !nombreUsuario || !password) { toast("Completá todos los campos", "error"); return; }
        await api.auth.usuarios.crear({ nombre, usuario: nombreUsuario, password, rol });
        toast("Usuario creado", "success");
      } else {
        const cambios: { nombre?: string; rol?: string; activo?: boolean; password?: string } = { nombre, rol, activo };
        if (password) cambios.password = password;
        await api.auth.usuarios.actualizar(usuario!.id, cambios);
        toast("Usuario actualizado", "success");
      }
      onGuardado();
      onCerrar();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No se pudo guardar", "error");
    } finally {
      setGuardando(false);
    }
  }

  const rolInfo = roles.find((r) => r.rol === rol);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[3px]"
         onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="w-full max-w-[420px] rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)]">
        <h2 className="mb-1 text-lg font-bold">{aprobar ? "Aprobar cuenta" : esNuevo ? "Nuevo usuario" : "Editar usuario"}</h2>
        {aprobar && <p className="mb-3 text-[12.5px] text-[var(--text-secondary)]">Elegí el nivel de acceso para habilitar esta cuenta.</p>}
        <div className="flex flex-col gap-3">
          <Campo label="Nombre y apellido"><Input value={nombre} onChange={(e) => setNombre(e.target.value)} /></Campo>
          {esNuevo && <Campo label="Usuario"><Input value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} /></Campo>}
          <Campo label={esNuevo ? "Contraseña" : "Nueva contraseña (opcional)"}>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Campo>
          <Campo label="Nivel de acceso">
            <Select value={rol} onChange={(e) => setRol(e.target.value)}>
              {roles.map((r) => <option key={r.rol} value={r.rol}>{r.label}</option>)}
            </Select>
            {rolInfo && <p className="mt-1 text-[11.5px] text-[var(--text-muted)]">{rolInfo.descripcion}</p>}
          </Campo>
          {!esNuevo && (
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
              Cuenta activa
            </label>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button variante="primary" onClick={guardar} disabled={guardando}>Guardar</Button>
        </div>
      </div>
    </div>
  );
}

/** Cuánto se cobra la hora de taller. Lo usa el cotizador para pasar a pesos
 *  las horas cargadas en cada repuesto. */
function ValorHoraCard() {
  const toast = useToast();
  const { puede } = useAuth();
  const [valor, setValor] = useState<string>("");
  const [empresa, setEmpresa] = useState<string>("");
  const [guardado, setGuardado] = useState<{ valorHora: number; empresa: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const puedeHora = puede("servicios:editar");
  const puedeEmpresa = puede("usuarios:gestionar");

  useEffect(() => {
    api.configuracion.obtener().then((c) => {
      setGuardado(c); setValor(String(c.valorHora)); setEmpresa(c.empresa);
    });
  }, []);

  async function guardar() {
    const n = Number(valor.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) { toast("El valor de la hora tiene que ser mayor a 0", "error"); return; }
    if (!empresa.trim()) { toast("Escribí el nombre del taller", "error"); return; }
    setGuardando(true);
    try {
      const r = await api.configuracion.actualizar({
        ...(puedeHora && n !== guardado?.valorHora ? { valorHora: n } : {}),
        ...(puedeEmpresa && empresa.trim() !== guardado?.empresa ? { empresa: empresa.trim() } : {}),
      });
      setGuardado(r);
      toast("Configuración actualizada", "success");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No se pudo guardar", "error");
    } finally {
      setGuardando(false);
    }
  }

  const cambio = guardado != null
    && (Number(valor.replace(",", ".")) !== guardado.valorHora || empresa.trim() !== guardado.empresa);

  return (
    <Card>
      <CardTitle>Configuración del taller</CardTitle>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-[12px] font-semibold text-[var(--text-secondary)]">
          Nombre del taller o concesionario
          <Input
            className="mt-1"
            value={empresa}
            disabled={!puedeEmpresa}
            placeholder="Ej.: SEPRIO"
            onChange={(e) => setEmpresa(e.target.value)}
          />
          <span className="mt-1 block text-[11px] font-normal text-[var(--text-muted)]">
            Solo el nombre: encabeza Inicio en grande, con “Panel de Servicio” debajo.
          </span>
        </label>
        <label className="block text-[12px] font-semibold text-[var(--text-secondary)]">
          Valor de la hora de taller
          <Input
            type="number"
            className="mt-1"
            value={valor}
            disabled={!puedeHora}
            onChange={(e) => setValor(e.target.value)}
          />
          <span className="mt-1 block text-[11px] font-normal text-[var(--text-muted)]">
            Con esto el cotizador pasa a pesos las horas cargadas en cada repuesto.
          </span>
        </label>
      </div>
      {cambio && (puedeHora || puedeEmpresa) && (
        <div className="mt-3">
          <Button variante="primary" tamano="sm" onClick={guardar} disabled={guardando}>Guardar cambios</Button>
        </div>
      )}
    </Card>
  );
}

function RolPermisosEditor({
  rol, catalogo, onGuardado,
}: {
  rol: RolInfo;
  catalogo: PermisoInfo[];
  onGuardado: () => void;
}) {
  const toast = useToast();
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set(rol.permisos));
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { setSeleccion(new Set(rol.permisos)); }, [rol.permisos]);

  const cambio = seleccion.size !== rol.permisos.length || rol.permisos.some((p) => !seleccion.has(p));

  function alternar(permiso: string) {
    setSeleccion((prev) => {
      const copia = new Set(prev);
      if (copia.has(permiso)) copia.delete(permiso); else copia.add(permiso);
      return copia;
    });
  }

  async function guardar() {
    setGuardando(true);
    try {
      await api.auth.actualizarPermisosDeRol(rol.rol, [...seleccion]);
      toast(`Permisos de "${rol.label}" actualizados`, "success");
      onGuardado();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No se pudo guardar", "error");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-3.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="font-bold">{rol.label}</span>
        {cambio && (
          <Button tamano="sm" variante="primary" onClick={guardar} disabled={guardando}>Guardar</Button>
        )}
      </div>
      <p className="mb-2.5 text-[12px] text-[var(--text-muted)]">{rol.descripcion}</p>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {catalogo.map((p) => (
          <label key={p.permiso} className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={seleccion.has(p.permiso)} onChange={() => alternar(p.permiso)} />
            {p.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[12px] font-semibold text-[var(--text-secondary)]">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
