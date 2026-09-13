import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad. La app maneja sesión por cookie, así que sin
 * `frame-ancestors` un sitio ajeno podría embeberla en un iframe invisible y
 * hacer que alguien ya logueado toque botones sin darse cuenta (clickjacking).
 * El resto son mitigaciones baratas de sniffing de tipos y fuga de la URL
 * interna al navegar hacia afuera.
 *
 * No se define Content-Security-Policy acá: Next inyecta scripts y estilos
 * propios, y una CSP mal armada rompe la app en producción sin aviso. Queda
 * pendiente hacerla con nonces si se decide encararla.
 */
const cabecerasSeguridad = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  // No anunciar la versión del framework.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: cabecerasSeguridad }];
  },
};

export default nextConfig;
