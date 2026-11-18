import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // NEXT_DIST_DIR permite correr varios dev servers/builds en la misma carpeta.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactCompiler: true,
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default nextConfig;
