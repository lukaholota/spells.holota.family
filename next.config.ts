import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    webpackMemoryOptimizations: true
  }, 
  async redirects() {
    return [
      {
        source: "/spell",
        destination: "/spells",
        permanent: true,
      },
      {
        source: "/spell/:path*",
        destination: "/spells/:path*",
        permanent: true,
      },
      {
        source: "/pers/:path*",
        destination: "/char/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
