/**
 * Errores de dominio. La capa de servicios los lanza; la capa de rutas (API)
 * los traduce al código HTTP correspondiente — así el servicio no sabe nada
 * de HTTP, y la ruta no repite mensajes de negocio.
 */
export class NotFoundError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ValidationError";
  }
}

export class ConflictError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ConflictError";
  }
}

export class ForbiddenError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ForbiddenError";
  }
}

/** No hay sesión (401) — distinto de ForbiddenError (403: hay sesión pero el
 *  nivel de acceso no alcanza). El frontend necesita distinguir "entrá" de
 *  "no podés". */
export class UnauthorizedError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "UnauthorizedError";
  }
}
