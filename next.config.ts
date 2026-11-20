import type { NextConfig } from "next";

/**
 * Baseline security headers for every route.
 * `frame-ancestors 'self'` still lets the editor embed /preview in its iframe,
 * while blocking clickjacking from other origins.
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  // Emits a self-contained server in .next/standalone, used by the Dockerfile.
  output: "standalone",
  // Don't advertise the framework/version.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
