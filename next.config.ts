import type { NextConfig } from "next";
import path from "path";
import { getCspHeader } from "./src/lib/ops/security";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["192.168.29.173"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.qrserver.com", pathname: "/v1/create-qr-code/**" },
      { protocol: "https", hostname: "rzp.io", pathname: "/**" },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
          { key: "Content-Security-Policy", value: getCspHeader(isProd) },
          ...(isProd
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
