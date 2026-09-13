/**
 * Lógica de negocio de repuestos. Espejo de
 * dashboard/backend/app/routers/repuestos.py.
 */
import * as marcasRepo from "@/repositories/marcas.repository";
import * as repuestosRepo from "@/repositories/repuestos.repository";
import * as sustitucionesRepo from "@/repositories/sustituciones.repository";
import * as auditoriaRepo from "@/repositories/auditoria.repository";
import { exigirPermiso, requireUsuario } from "@/services/auth.service";
import { ahoraArgentinaISO } from "@/lib/fecha";
import { ConflictError, NotFoundError, ValidationError } from "@/domain/errors";
import type { StockDeCodigo, Usuario } from "@/domain/types";

/**
 * Recorre la cadena de sustituciones (código anterior <-> nuevo, hasta
 * `saltos` niveles para cubrir reemplazos encadenados) y devuelve, para cada
 * código equivalente encontrado, sus filas de stock (puede haber más de una
 * si el código existe en más de una marca). Traducción 1:1 de
 * `buscar_equivalentes_con_stock` (repuestos.py).
 */
export async function buscarEquivalentesConStock(
  codigo: string,
  saltos = 2,
): Promise<StockDeCodigo[]> {
  const encontrados = new Set<string>([codigo]);
  let frontera = new Set<string>([codigo]);

  for (let i = 0; i < saltos; i++) {
    if (frontera.size === 0) break;
    const filas = await sustitucionesRepo.buscarSustitucionesPorCodigos([...frontera]);
    const siguiente = new Set<string>();
    for (const fila of filas) {
      for (const c of [fila.codigoAnterior, fila.codigoNuevo]) {
        if (c && !encontrados.has(c)) siguiente.add(c);
      }
    }
    for (const c of siguiente) encontrados.add(c);
    frontera = siguiente;
  }

  const equivalentes = [...encontrados].filter((c) => c !== codigo);
  if (!equivalentes.length) return [];

  const filas = await repuestosRepo.buscarRepuestosPorCodigos(equivalentes);
  const enCatalogo = new Set(filas.map((f) => f.codigo));

  const resultado: StockDeCodigo[] = filas.map((f) => ({
    codigo: f.codigo,
    nombre: f.nombre,
    marcaNombre: f.marcaNombre,
    esStockGestionado: f.esStockGestionado ?? false,
    stockActual: f.stockActual,
    stockMinimo: f.stockMinimo,
    stockFicticio: f.stockFicticio,
    precioPublico: f.precioPublico,
    precioCosto: f.precioCosto,
  }));

  for (const c of equivalentes) {
    if (!enCatalogo.has(c)) {
      resultado.push({
        codigo: c, nombre: null, marcaNombre: null, esStockGestionado: false,
        stockActual: null, stockMinimo: null, stockFicticio: false,
        precioPublico: null, precioCosto: null,
      });
    }
  }
  return resultado;
}

export function listarRepuestos(filtros: repuestosRepo.FiltrosRepuestos = {}) {
  return repuestosRepo.listarRepuestos(filtros);
}

export function conteoCategorias(marcaId?: number) {
  return repuestosRepo.conteoCategorias(marcaId);
}

export async function obtenerEquivalentes(codigoCrudo: string) {
  const codigo = codigoCrudo.trim();
  const [propio, equivalentes] = await Promise.all([
    repuestosRepo.buscarRepuestoPorCodigo(codigo),
    buscarEquivalentesConStock(codigo),
  ]);
  return { codigo, propio, equivalentes };
}

export async function obtenerRepuesto(repuestoId: number) {
  const repuesto = await repuestosRepo.buscarRepuestoPorId(repuestoId);
  if (!repuesto) throw new NotFoundError("Repuesto no encontrado");

  const [usadoEnPlanes, sustituciones, equivalentes] = await Promise.all([
    repuestosRepo.planesQueUsanRepuesto(repuestoId),
    sustitucionesRepo.buscarSustitucionesDeCodigo(repuesto.codigo),
    buscarEquivalentesConStock(repuesto.codigo),
  ]);

  return { ...repuesto, usadoEnPlanes, sustituciones, equivalentes };
}

export async function actualizarRepuesto(
  actor: Usuario | null,
  repuestoId: number,
  cambios: {
    codigo?: string | null;
    nombre?: string | null;
    stockActual?: number | null;
    stockMinimo?: number | null;
    precioCosto?: number | null;
    precioPublico?: number | null;
    esStockGestionado?: boolean | null;
  },
) {
  // Permiso por campo, como el original: Ventas puede corregir stock pero no
  // tocar precios. Un campo ausente significa "no lo cambies", así que solo
  // se exige el permiso de lo que realmente vino con valor.
  const usuario = requireUsuario(actor);
  if (cambios.precioCosto != null || cambios.precioPublico != null) {
    await exigirPermiso(usuario, "precios:editar");
  }
  if (cambios.stockActual != null || cambios.stockMinimo != null || cambios.esStockGestionado != null) {
    await exigirPermiso(usuario, "stock:editar");
  }
  // Código y nombre son la identidad del repuesto en el catálogo: mismo
  // permiso que dar de alta o de baja un repuesto, no el de precios/stock.
  if (cambios.codigo !== undefined || cambios.nombre !== undefined) {
    await exigirPermiso(usuario, "repuestos:crear");
  }

  const existente = await repuestosRepo.buscarRepuestoPorId(repuestoId);
  if (!existente) throw new NotFoundError("Repuesto no encontrado");

  if (cambios.codigo != null) {
    const codigo = cambios.codigo.trim();
    if (!codigo) throw new ValidationError("El código no puede quedar vacío");
    if (codigo !== existente.codigo) {
      const yaExiste = await repuestosRepo.existeOtroConCodigo(existente.marcaId, codigo, repuestoId);
      if (yaExiste) throw new ConflictError("Ya existe un repuesto con ese código para esta marca");
    }
    cambios = { ...cambios, codigo };
  }

  const actualizado = await repuestosRepo.actualizarRepuesto(repuestoId, cambios);
  await auditoriaRepo.registrar({
    usuarioId: usuario.id, accion: "editar", entidad: "repuesto", entidadId: repuestoId,
    fecha: ahoraArgentinaISO(),
  });
  return actualizado;
}

/**
 * Registra una sustitución verificada en el portal de piezas de la terminal
 * (Fiat LinkEntry u homólogo): deja asentada la equivalencia código anterior
 * -> nuevo en `sustituciones` (para que la búsqueda de equivalentes la
 * encuentre), y actualiza el repuesto con el código y precios nuevos.
 */
export async function registrarSustitucionFiat(
  actor: Usuario | null,
  repuestoId: number,
  datos: {
    codigoNuevo: string;
    precioPublico?: number | null;
    precioCosto?: number | null;
  },
) {
  const usuario = await exigirPermiso(actor, "repuestos:crear");
  if (datos.precioPublico != null || datos.precioCosto != null) {
    await exigirPermiso(usuario, "precios:editar");
  }

  const existente = await repuestosRepo.buscarRepuestoPorId(repuestoId);
  if (!existente) throw new NotFoundError("Repuesto no encontrado");

  const codigoNuevo = datos.codigoNuevo.trim();
  if (!codigoNuevo) throw new ValidationError("El código nuevo no puede quedar vacío");
  if (codigoNuevo === existente.codigo) {
    throw new ValidationError("El código nuevo es igual al actual");
  }
  const yaExiste = await repuestosRepo.existeOtroConCodigo(existente.marcaId, codigoNuevo, repuestoId);
  if (yaExiste) throw new ConflictError("Ya existe un repuesto con ese código para esta marca");

  await sustitucionesRepo.crearSustitucion({
    marcaId: existente.marcaId,
    codigoAnterior: existente.codigo,
    codigoNuevo,
    clase: "S",
  });

  const actualizado = await repuestosRepo.actualizarRepuesto(repuestoId, {
    codigo: codigoNuevo,
    precioPublico: datos.precioPublico ?? undefined,
    precioCosto: datos.precioCosto ?? undefined,
  });

  await auditoriaRepo.registrar({
    usuarioId: usuario.id, accion: "sustituir", entidad: "repuesto", entidadId: repuestoId,
    detalle: `${existente.codigo} -> ${codigoNuevo}`, fecha: ahoraArgentinaISO(),
  });

  return actualizado;
}

export async function crearRepuesto(
  actor: Usuario | null,
  datos: {
    codigo: string;
    nombre: string | null;
    marcaId: number;
    categoria: string | null;
    precioPublico: number | null;
    precioCosto: number | null;
    stockActual: number | null;
    stockMinimo: number | null;
  },
) {
  const usuario = await exigirPermiso(actor, "repuestos:crear");

  const marca = await marcasRepo.buscarMarcaPorId(datos.marcaId);
  if (!marca) throw new ValidationError("marca_id inválido");

  const existente = await repuestosRepo.buscarStockPorMarcaYCodigo(datos.marcaId, datos.codigo);
  if (existente) throw new ConflictError("Ya existe un repuesto con ese código para esa marca");

  const creado = await repuestosRepo.crearRepuesto(datos);
  await auditoriaRepo.registrar({
    usuarioId: usuario.id, accion: "crear", entidad: "repuesto", entidadId: creado.id,
    detalle: datos.codigo, fecha: ahoraArgentinaISO(),
  });
  return creado;
}

export async function eliminarRepuesto(actor: Usuario | null, repuestoId: number) {
  const usuario = await exigirPermiso(actor, "repuestos:eliminar");
  const existente = await repuestosRepo.buscarRepuestoPorId(repuestoId);
  if (!existente) throw new NotFoundError("Repuesto no encontrado");
  await repuestosRepo.eliminarRepuesto(repuestoId);
  await auditoriaRepo.registrar({
    usuarioId: usuario.id, accion: "eliminar", entidad: "repuesto", entidadId: repuestoId,
    fecha: ahoraArgentinaISO(),
  });
}
