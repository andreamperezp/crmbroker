import type { NextConfig } from "next";

/**
 * Brokerflow es una demo pública: se puede mostrar dentro del portfolio y de Claude.
 * Cualquier otro sitio no puede meterla adentro (evita engaños tipo "clickjacking").
 */
const EMBEDDERS = [
  "'self'",
  "https://andreaperez.dev",
  "https://*.andreaperez.dev",
  "https://claude.ai",
  "https://*.claude.ai",
  "https://*.claudeusercontent.com",
];

const securityHeaders = [
  { key: "Content-Security-Policy", value: `frame-ancestors ${EMBEDDERS.join(" ")}` },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
