/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // Baseline security headers on every response. (A tuned Content-Security-
    // Policy is a deliberate follow-up — it needs testing against the wallet
    // adapters, Solana RPC, Supabase and Formspree connect-src + Next's inline
    // hydration scripts, so shipping a wrong one would break the app.)
    const security = [
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
    ];
    return [{ source: "/:path*", headers: security }];
  },
};

export default nextConfig;
