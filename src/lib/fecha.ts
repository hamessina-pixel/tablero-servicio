/**
 * Fecha/hora en formato y zona horaria de Argentina (UTC-3, sin horario de
 * verano), como texto plano "YYYY-MM-DDTHH:mm:ss" — el mismo formato que
 * `datetime.now().isoformat(timespec="seconds")` en el sistema viejo, que
 * corría en una PC en Argentina.
 *
 * Se calcula el offset a mano en vez de confiar en la hora local del
 * servidor porque esta app puede terminar corriendo en un hosting en la nube
 * con el reloj en UTC: si se usara `new Date().toISOString()` tal cual, las
 * fechas nuevas quedarían corridas ~3 horas respecto de todo lo ya cargado
 * (auditoria.fecha, sesiones.expira_en, etc.), y una comparación de
 * vencimiento de sesión podría dar mal por esas horas de diferencia.
 */
const OFFSET_ARGENTINA_MS = -3 * 60 * 60 * 1000;

function ahoraArgentinaMs(): number {
  return Date.now() + OFFSET_ARGENTINA_MS;
}

export function ahoraArgentinaISO(): string {
  return new Date(ahoraArgentinaMs()).toISOString().slice(0, 19);
}

/** "Ahora" + N días, mismo formato — para expira_en de una sesión nueva. */
export function argentinaISOEnDias(dias: number): string {
  return new Date(ahoraArgentinaMs() + dias * 24 * 60 * 60 * 1000).toISOString().slice(0, 19);
}

/** "Ahora" + N minutos — para la pausa del login tras varios intentos fallidos. */
export function argentinaISOEnMinutos(minutos: number): string {
  return new Date(ahoraArgentinaMs() + minutos * 60 * 1000).toISOString().slice(0, 19);
}
