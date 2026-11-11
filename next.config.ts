import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Hosted at aumnium.tech/demo — base path for asset resolution
  basePath: "/demo",
  assetPrefix: "/demo/",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei", "@react-three/postprocessing", "postprocessing"],
};

export default nextConfig;
