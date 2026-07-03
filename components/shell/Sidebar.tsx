"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV: { group: string; items: { href: string; label: string; icon: string }[] }[] = [
  {
    group: "Corpus",
    items: [
      { href: "/", label: "Overview", icon: "grid" },
      { href: "/browse", label: "Browse traps", icon: "list" },
      { href: "/coverage", label: "Coverage", icon: "matrix" },
    ],
  },
  {
    group: "Trust",
    items: [
      { href: "/proof", label: "How proof works", icon: "shield" },
      { href: "/sla", label: "Quality SLA", icon: "pulse" },
    ],
  },
  {
    group: "Access",
    items: [
      { href: "/pricing", label: "Pricing", icon: "tag" },
      { href: "/access", label: "Get a grant", icon: "key" },
      { href: "/docs", label: "API · CLI · MCP", icon: "terminal" },
    ],
  },
];

function Icon({ name }: { name: string }) {
  const p: Record<string, string> = {
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    matrix: "M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM4 16h4v4H4z",
    shield: "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z",
    pulse: "M3 12h4l2-7 4 14 2-7h6",
    tag: "M20 12l-8 8-9-9V3h8zM7.5 7.5h.01",
    key: "M15 7a4 4 0 100 8 4 4 0 000-8zM11 11l-7 7v3h3l1-1 2 1 1-2 2-1-1-2z",
    terminal: "M4 5h16v14H4zM7 9l3 3-3 3M13 15h4",
  };
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={p[name] ?? p.grid} />
    </svg>
  );
}

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside
      style={{
        width: "var(--sidebar-w)",
        flexShrink: 0,
        borderRight: "1px solid var(--line)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.012), transparent 30%)",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        zIndex: 3,
      }}
    >
      <div style={{ height: "var(--topbar-h)", display: "flex", alignItems: "center", gap: 11, padding: "0 20px", borderBottom: "1px solid var(--line)" }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: "radial-gradient(circle at 32% 28%, #3bffbe, #0d5a44)",
            boxShadow: "0 0 16px rgba(36,242,168,0.4)",
            flexShrink: 0,
          }}
        />
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>brainblast</div>
          <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.12em" }}>REGISTRY</div>
        </div>
      </div>

      <nav className="scrolly" style={{ flex: 1, overflowY: "auto", padding: "16px 12px" }}>
        {NAV.map((sec) => (
          <div key={sec.group} style={{ marginBottom: 20 }}>
            <div className="eyebrow" style={{ padding: "0 10px 8px", fontSize: 9.5 }}>{sec.group}</div>
            {sec.items.map((it) => {
              const active = path === it.href;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    padding: "8px 10px",
                    borderRadius: 9,
                    marginBottom: 2,
                    fontSize: 13,
                    color: active ? "var(--ink)" : "var(--ink-2)",
                    background: active ? "var(--green-bg)" : "transparent",
                    boxShadow: active ? "inset 0 0 0 1px rgba(36,242,168,0.18)" : "none",
                    position: "relative",
                    transition: "background 0.14s, color 0.14s",
                  }}
                >
                  <span style={{ color: active ? "var(--green)" : "var(--ink-3)", display: "flex" }}>
                    <Icon name={it.icon} />
                  </span>
                  {it.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ padding: 12, borderTop: "1px solid var(--line)" }}>
        <div
          style={{
            borderRadius: 12,
            border: "1px solid var(--line-strong)",
            background: "var(--panel-2)",
            padding: 13,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 8px var(--green)", animation: "bb-pulse 1.8s infinite" }} />
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-2)" }}>corpus live</span>
          </div>
          <p style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.5, margin: 0 }}>
            Every record re-provable on demand. Reproduction SLA at 100%.
          </p>
        </div>
      </div>
    </aside>
  );
}
