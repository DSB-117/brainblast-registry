import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)", marginTop: 80 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "44px 28px", display: "flex", flexWrap: "wrap", gap: 40, justifyContent: "space-between" }}>
        <div style={{ maxWidth: 300 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Logo size={24} />
            <span style={{ fontSize: 15, fontWeight: 600 }}>brainblast</span>
          </div>
          <p style={{ fontSize: 13.5, color: "var(--ink-3)", lineHeight: 1.6 }}>
            The marketplace for machine-verified AI-integration data. Every record re-provable on demand.
          </p>
        </div>
        <div style={{ display: "flex", gap: 64, flexWrap: "wrap" }}>
          {[
            { h: "Product", items: [["Marketplace", "/browse"], ["Coverage", "/coverage"], ["Pricing", "/pricing"], ["Earn", "/earn"]] },
            { h: "Trust", items: [["How it works", "/proof"], ["Quality SLA", "/sla"]] },
            { h: "Developers", items: [["API · CLI · MCP", "/docs"], ["npm", "https://www.npmjs.com/package/brainblast"]] },
          ].map((col) => (
            <div key={col.h}>
              <div style={{ fontSize: 12.5, color: "var(--ink-4)", marginBottom: 14, fontWeight: 500 }}>{col.h}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {col.items.map(([label, href]) => (
                  <Link key={label} href={href} style={{ fontSize: 13.5, color: "var(--ink-2)" }}>{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 28px", display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--ink-4)" }}>
          <span>© 2026 Brainblast</span>
          <span className="mono">registry.brainblast.tech</span>
        </div>
      </div>
    </footer>
  );
}
