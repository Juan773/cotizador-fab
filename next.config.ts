import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Las imágenes de planta viajan dentro de la cotización al guardar (Vercel admite hasta 4.5 MB).
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
