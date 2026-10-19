import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // As tabelas LMS da OMS são dados estáticos grandes; mantemos em chunk
  // separado para não inflar o bundle inicial.
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/(.*)",
        headers: [{ key: "X-Content-Type-Options", value: "nosniff" }],
      },
    ];
  },
};

export default nextConfig;
