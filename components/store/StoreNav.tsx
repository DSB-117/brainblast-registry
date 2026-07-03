"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/browse", label: "Marketplace" },
  { href: "/coverage", label: "Coverage" },
  { href: "/proof", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

export default function StoreNav() {
  const path = usePathname();
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        borderBottom: "1px solid var(--line)",
        background: "rgba(7,7,14,0.66)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", height: 64, display: "flex", alignItems: "center", gap: 32, padding: "0 28px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 24, height: 24, borderRadius: 7, background: "var(--grad-brand)", boxShadow: "0 0 18px rgba(52,211,153,0.4)" }} />
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" }}>brainblast</span>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 26, flex: 1 }}>
          {LINKS.map((l) => {
            const active = path === l.href;
            return (
              <Link key={l.href} href={l.href} style={{ fontSize: 14, color: active ? "var(--ink)" : "var(--ink-2)", fontWeight: active ? 500 : 400 }}>
                {l.label}
              </Link>
            );
          })}
        </nav>

        <Link href="/access" style={{ fontSize: 14, color: "var(--ink-2)" }}>Sign in</Link>
        <Link
          href="/access"
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: 38,
            padding: "0 18px",
            borderRadius: 10,
            background: "var(--grad-brand)",
            color: "#03130c",
            fontSize: 14,
            fontWeight: 600,
            boxShadow: "0 6px 24px -8px rgba(52,211,153,0.6)",
          }}
        >
          Get access
        </Link>
      </div>
    </header>
  );
}
