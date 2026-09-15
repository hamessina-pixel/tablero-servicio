/**
 * Cabeceras de caché para las consultas que no dependen de quién esté
 * logueado: marcas, modelos, planes, fluidos y sustituciones son los mismos
 * para todos. Con esto el CDN responde sin volver a consultar la base, que es
 * lo que hace lenta cada pantalla.
 *
 * Solo para respuestas iguales para todo el mundo. Nada que cambie según la
 * sesión (precios de costo, stock, panel) puede pasar por acá: quedaría
 * guardado y se le serviría a otro.
 */
export function cacheCompartido(segundos: number) {
  return {
    // `stale-while-revalidate` deja servir la copia vieja mientras se busca la
    // nueva por detrás: nadie espera a que se recalcule.
    "Cache-Control": `public, s-maxage=${segundos}, stale-while-revalidate=${segundos * 4}`,
  };
}
