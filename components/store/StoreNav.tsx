"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

const LINKS = [
  { href: "/browse", label: "Marketplace" },
  { href: "/coverage", label: "Coverage" },
  { href: "/proof", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/earn", label: "Earn" },
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
          <Logo size={28} />
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

        {/* Public purchase isn't open yet — gate the primary CTA. Subscription
            cards still route to /access so buyers can explore pricing. */}
        <span
          title="Public access is coming soon."
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: 38,
            padding: "0 18px",
            borderRadius: 10,
            background: "var(--glass-2)",
            color: "var(--ink-3)",
            border: "1px solid var(--line)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "default",
          }}
        >
          Coming soon
        </span>
      </div>
    </header>
  );
}
