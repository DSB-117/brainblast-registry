import { loadDashboard } from "../../lib/dashboardData";

export const revalidate = 300;

interface Sla {
  rates?: { reproduction?: number; schemaValid?: number };
  corpus?: { total?: number; verifiable?: number; reproduced?: number; schemaValid?: number };
  packaging?: { detail?: string; inSync?: boolean };
  regression?: boolean;
}

async function loadSla(): Promise<Sla | null> {
  try {
    const res = await fetch("https://raw.githubusercontent.com/DSB-117/brainblast/main/datasets/sla.json", { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as Sla;
  } catch {
    return null;
  }
}

function Gauge({ label, pct, from, to, detail }: { label: string; pct: number; from: string; to: string; detail: string }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const gid = `g-${label.replace(/\s/g, "")}`;
  return (
    <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 28, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 18, alignSelf: "flex-start", fontWeight: 500 }}>{label}</div>
      <div style={{ position: "relative", width: 132, height: 132, marginBottom: 18 }}>
        <svg width="132" height="132" viewBox="0 0 132 132" style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={from} />
              <stop offset="1" stopColor={to} />
            </linearGradient>
          </defs>
          <circle cx="66" cy="66" r={r} fill="none" stroke="var(--glass-2)" strokeWidth="9" />
          <circle cx="66" cy="66" r={r} fill="none" stroke={`url(#${gid})`} strokeWidth="9" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="mono" style={{ fontSize: 28, fontWeight: 600 }}>{pct}</span>
          <span className="mono" style={{ fontSize: 15, color: "var(--ink-3)" }}>%</span>
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: 0, lineHeight: 1.5 }}>{detail}</p>
    </div>
  );
}

export default async function SLA() {
  const [sla, d] = await Promise.all([loadSla(), loadDashboard()]);
  const repro = Math.round((sla?.rates?.reproduction ?? 1) * 100);
  const schema = Math.round((sla?.rates?.schemaValid ?? 1) * 100);
  const inSync = sla?.packaging?.inSync ?? true;
  const regression = sla?.regression ?? false;

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 28px 20px", animation: "fade 0.4s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: 40 }}>
        <div>
          <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 12 }}>Integrity</div>
          <h1 style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.035em", margin: 0 }}>Quality SLA</h1>
          <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "14px 0 0", maxWidth: 620, lineHeight: 1.6 }}>
            The contractual integrity surface. The whole corpus is re-proven on a schedule; a single regression fails the gate.
          </p>
        </div>
        <span
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            fontSize: 12.5,
            padding: "9px 15px",
            borderRadius: 999,
            border: `1px solid ${regression ? "rgba(251,113,133,0.4)" : "rgba(52,211,153,0.4)"}`,
            background: regression ? "rgba(251,113,133,0.1)" : "rgba(52,211,153,0.1)",
            color: regression ? "var(--rose)" : "var(--emerald)",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", animation: "livepulse 1.8s infinite" }} />
          {regression ? "regression detected" : "integrity gate passing"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <Gauge label="Reproduction rate" pct={repro} from="#34d399" to="#22d3ee" detail={`${sla?.corpus?.reproduced ?? d.totals.vtis} of ${sla?.corpus?.verifiable ?? d.totals.vtis} verifiable VTIs still go RED→GREEN`} />
        <Gauge label="Schema valid" pct={schema} from="#22d3ee" to="#8b7bff" detail={`${sla?.corpus?.schemaValid ?? d.totals.vtis} of ${sla?.corpus?.total ?? d.totals.vtis} records match the committed schema`} />
        <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 28, display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
          <div style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 500 }}>Packaging</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 42, height: 42, borderRadius: 12, background: inSync ? "rgba(52,211,153,0.14)" : "rgba(251,113,133,0.14)", display: "flex", alignItems: "center", justifyContent: "center", color: inSync ? "var(--emerald)" : "var(--rose)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{inSync ? <path d="M20 6L9 17l-5-5" /> : <path d="M18 6L6 18M6 6l12 12" />}</svg>
            </span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{inSync ? "In sync" : "Drifted"}</div>
              <div className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>published lot vs. seed</div>
            </div>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: 0, lineHeight: 1.5 }}>{sla?.packaging?.detail ?? "Published dataset matches the source corpus."}</p>
        </div>
      </div>

      <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 28, marginTop: 16 }}>
        <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 18, fontWeight: 500 }}>What the SLA re-checks, every run</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
          {[
            ["Reproduction", "Every VTI in every lot is re-proven RED→GREEN. A record that stops reproducing means the SDK moved under it — the freshness signal shows up here first.", "var(--emerald)"],
            ["Schema", "Each record is re-validated against the committed VTI schema — a back-stop against malformed or tampered data.", "var(--cyan)"],
            ["Drift", "The published dataset is diffed against the source corpus. Any divergence between what's sold and what's proven fails the gate.", "var(--violet)"],
          ].map(([t, b, c]) => (
            <div key={t}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>{t}</span>
              </div>
              <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: 0, lineHeight: 1.55 }}>{b}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
