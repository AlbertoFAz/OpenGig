import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // En desarrollo, Supabase local usa 127.0.0.1 (IP privada).
    // Next.js 16 bloquea IPs privadas en el optimizador; desactivamos la
    // optimización localmente. En producción las URLs son de *.supabase.co.
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      // Supabase Storage en producción (*.supabase.co)
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
