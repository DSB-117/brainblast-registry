const PATHS = [
  {
    icon: "M4 5h16v14H4zM7 9l3 3-3 3M13 15h4",
    color: "var(--emerald)",
    tint: "rgba(52,211,153,0.14)",
    tag: "CLI",
    title: "brainblast feed",
    body: "The fastest path. Point the CLI at the hosted endpoint with your grant and stream the entitled delta as NDJSON.",
    code: ["brainblast feed \\", "  --remote registry.brainblast.tech \\", "  --grant ./grant.json --since <cursor>"],
  },
  {
    icon: "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z",
    color: "var(--cyan)",
    tint: "rgba(34,211,238,0.14)",
    tag: "MCP",
    title: "brainblast_recall",
    body: "Wire the corpus into your agent. Before writing an integration, the model recalls the verified records for that SDK — so it writes correct code the first time.",
    code: ['{ "mcpServers": {', '    "brainblast": {', '      "command": "npx",', '      "args": ["brainblast", "mcp"] } } }'],
  },
  {
    icon: "M3 12h4l2-7 4 14 2-7h6",
    color: "var(--violet)",
    tint: "rgba(139,123,255,0.14)",
    tag: "HTTP",
    title: "REST endpoint",
    body: "Vendor-neutral. The catalog is public; the feed is grant-gated with an x-brainblast-grant header, verified server-side with only the distributor's public key.",
    code: ["GET /api/catalog          # public", "GET /api/feed             # grant-gated", "GET /api/healthz          # liveness"],
  },
];

export default function Docs() {
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 28px 20px", animation: "fade 0.4s ease" }}>
      <div style={{ marginBottom: 44 }}>
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 12 }}>Integrate</div>
        <h1 style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.035em", margin: 0 }}>API · CLI · MCP</h1>
        <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "14px 0 0", maxWidth: 620, lineHeight: 1.6 }}>
          Three ways to pull the corpus, one for each kind of buyer — a data pipeline, a CLI-first team, or an agent-tooling stack. Same entitlement model behind all three.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {PATHS.map((p) => (
          <div key={p.tag} className="glass lift" style={{ borderRadius: "var(--radius-lg)", padding: 26, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <span style={{ width: 40, height: 40, borderRadius: 11, background: p.tint, display: "flex", alignItems: "center", justifyContent: "center", color: p.color }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={p.icon} /></svg>
                </span>
                <div>
                  <div className="mono" style={{ fontSize: 11, color: p.color, letterSpacing: "0.08em" }}>{p.tag}</div>
                  <div className="mono" style={{ fontSize: 16, fontWeight: 500 }}>{p.title}</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: "var(--ink-2)", margin: 0, lineHeight: 1.6, maxWidth: 420 }}>{p.body}</p>
            </div>
            <div className="mono" style={{ fontSize: 12.5, background: "rgba(0,0,0,0.35)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 18px", lineHeight: 1.9, overflowX: "auto" }}>
              {p.code.map((line, i) => (
                <div key={i} style={{ whiteSpace: "pre", color: line.trim().startsWith("#") || line.trim().startsWith("GET") ? (line.includes("#") ? "var(--ink-4)" : p.color) : p.color }}>{line}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: "18px 22px", display: "flex", alignItems: "center", gap: 13, marginTop: 16 }}>
        <span className="mono" style={{ fontSize: 11.5, color: "var(--emerald)", background: "rgba(52,211,153,0.14)", padding: "4px 10px", borderRadius: 7 }}>npm</span>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: 0 }}>
          Everything ships in one package — <span className="mono" style={{ color: "var(--ink)" }}>npx brainblast</span> — built in CI with SLSA provenance. No install required.
        </p>
      </div>
    </div>
  );
}
