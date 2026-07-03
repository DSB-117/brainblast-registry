const PATHS = [
  {
    icon: "M4 5h16v14H4zM7 9l3 3-3 3M13 15h4",
    color: "var(--green)",
    tag: "CLI",
    title: "brainblast feed",
    body: "The fastest path. Point the CLI at the hosted endpoint with your grant and stream the entitled delta as NDJSON.",
    code: ["brainblast feed \\", "  --remote registry.brainblast.tech \\", "  --grant ./grant.json --since <cursor>"],
  },
  {
    icon: "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z",
    color: "var(--cyan)",
    tag: "MCP",
    title: "brainblast_recall",
    body: "Wire the corpus into your agent. Before writing an integration, the model recalls the verified traps for that SDK — so it writes the correct code the first time.",
    code: ['{ "mcpServers": {', '    "brainblast": {', '      "command": "npx",', '      "args": ["brainblast", "mcp"] } } }'],
  },
  {
    icon: "M3 12h4l2-7 4 14 2-7h6",
    color: "var(--blue)",
    tag: "HTTP",
    title: "REST endpoint",
    body: "Vendor-neutral. The catalog is public; the feed is grant-gated with an x-brainblast-grant header, verified server-side with only the distributor's public key.",
    code: ["GET /api/catalog          # public", "GET /api/feed             # grant-gated", "GET /api/healthz          # liveness"],
  },
];

export default function Docs() {
  return (
    <div style={{ animation: "bb-fadeup 0.4s ease" }}>
      <div style={{ marginBottom: 26 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Integrate</div>
        <h1 style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>API · CLI · MCP</h1>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "7px 0 0", maxWidth: 640 }}>
          Three ways to pull the corpus, one for each kind of buyer — a data pipeline, a CLI-first team, or an agent-tooling stack. Same entitlement model behind all three.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {PATHS.map((p) => (
          <div key={p.tag} className="card" style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, background: `${p.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: p.color }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={p.icon} /></svg>
                </span>
                <div>
                  <div className="eyebrow" style={{ color: p.color, fontSize: 9.5 }}>{p.tag}</div>
                  <div className="mono" style={{ fontSize: 15, fontWeight: 500 }}>{p.title}</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0, lineHeight: 1.6, maxWidth: 420 }}>{p.body}</p>
            </div>
            <div className="mono" style={{ fontSize: 12, color: p.color, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 11, padding: "16px 18px", lineHeight: 1.85, overflowX: "auto" }}>
              {p.code.map((line, i) => (
                <div key={i} style={{ whiteSpace: "pre", color: line.trim().startsWith("#") ? "var(--ink-3)" : p.color }}>{line}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
        <span className="mono" style={{ fontSize: 11, color: "var(--green)", background: "var(--green-bg)", padding: "3px 9px", borderRadius: 6 }}>npm</span>
        <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: 0 }}>
          Everything ships in one package — <span className="mono" style={{ color: "var(--ink)" }}>npx brainblast@0.9.10</span> — built in CI with SLSA provenance. No install required.
        </p>
      </div>
    </div>
  );
}
