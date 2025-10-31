import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  // Turbopack configuration (Next.js 15+ default)
  turbopack: {
    resolveAlias: {
      'pino-pretty': './empty-module.js',
      'lokijs': './empty-module.js',
      'encoding': './empty-module.js',
    },
  },
};

export default nextConfig;
