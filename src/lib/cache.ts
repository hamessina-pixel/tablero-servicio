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
/**
 * Prohíbe guardar la respuesta en cualquier caché intermedio. Va en todo lo
 * que cambia según quién pregunte: la misma dirección devuelve el costo a
 * quien inició sesión y lo oculta al resto, así que si un proxy guardara una
 * respuesta podría entregarle a un anónimo los precios de costo del taller.
 */
export function sinCache() {
  return { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" };
}

export function cacheCompartido(segundos: number) {
  return {
    // `stale-while-revalidate` deja servir la copia vieja mientras se busca la
    // nueva por detrás: nadie espera a que se recalcule.
    "Cache-Control": `public, s-maxage=${segundos}, stale-while-revalidate=${segundos * 4}`,
  };
}
