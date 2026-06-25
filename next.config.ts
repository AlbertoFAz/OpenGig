import type { NextConfig } from "next";
import withSerwist from "@serwist/next";

const isDev = process.env.NODE_ENV === "development";

// Política de seguridad de contenido
const ContentSecurityPolicy = [
  "default-src 'self'",
  // Next.js necesita 'unsafe-inline' para hidratación; 'unsafe-eval' solo en dev
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // Tailwind genera estilos en línea
  "style-src 'self' 'unsafe-inline'",
  // Imágenes de Supabase Storage y URLs externas introducidas por el usuario
  "img-src 'self' data: blob: https:",
  // Fuentes servidas por Next.js (no se llama a Google directamente en producción)
  "font-src 'self'",
  // Conexiones a Supabase REST + Realtime (WebSocket)
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  // No se permiten frames externos
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  // Necesario para que el navegador cargue el manifest.json y registre el SW
  "manifest-src 'self'",
  "worker-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // HSTS: 2 años, incluye subdominios, preload
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(), notifications=(self)",
  },
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    unoptimized: isDev,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default withSerwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  reloadOnOnline: true,
  // Deshabilitar SW en desarrollo para evitar interferencias con hot-reload
  disable: isDev,
})(nextConfig);
