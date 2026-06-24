import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.29.173"],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
