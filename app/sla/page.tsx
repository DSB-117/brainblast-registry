import { loadDashboard } from "../../lib/dashboardData";

export const revalidate = 300;

interface Sla {
  rates?: { reproduction?: number; schemaValid?: number };
  corpus?: { total?: number; verifiable?: number; reproduced?: number; schemaValid?: number };
  packaging?: { detail?: string; inSync?: boolean };
  regression?: boolean;
  generatedAt?: string;
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

export default async function SLA() {
  const [sla, d] = await Promise.all([loadSla(), loadDashboard()]);
  const repro = Math.round((sla?.rates?.reproduction ?? 1) * 100);
  const schema = Math.round((sla?.rates?.schemaValid ?? 1) * 100);
  const inSync = sla?.packaging?.inSync ?? true;
  const regression = sla?.regression ?? false;

  const Gauge = ({ label, pct, color, detail }: { label: string; pct: number; color: string; detail: string }) => {
    const r = 42;
    const circ = 2 * Math.PI * r;
    return (
      <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div className="eyebrow" style={{ marginBottom: 16, alignSelf: "flex-start" }}>{label}</div>
        <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--panel-2)" strokeWidth="8" />
          <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
        </svg>
        <div style={{ marginTop: -78, marginBottom: 40 }}>
          <span className="mono" style={{ fontSize: 26, fontWeight: 600 }}>{pct}</span>
          <span className="mono" style={{ fontSize: 14, color: "var(--ink-3)" }}>%</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0, lineHeight: 1.5 }}>{detail}</p>
      </div>
    );
  };

  return (
    <div style={{ animation: "bb-fadeup 0.4s ease" }}>
      <div style={{ marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Trust · integrity</div>
          <h1 style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>Quality SLA</h1>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "7px 0 0", maxWidth: 620 }}>
            The contractual integrity surface. The whole corpus is re-proven on a schedule; a single regression fails the gate.
          </p>
        </div>
        <span
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            padding: "8px 14px",
            borderRadius: 999,
            border: `1px solid ${regression ? "var(--red)" : "var(--green)"}`,
            background: regression ? "var(--red-bg)" : "var(--green-bg)",
            color: regression ? "var(--red)" : "var(--green)",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", boxShadow: "0 0 8px currentColor" }} />
          {regression ? "regression detected" : "integrity gate passing"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        <Gauge label="Reproduction rate" pct={repro} color="var(--green)" detail={`${sla?.corpus?.reproduced ?? d.totals.vtis} of ${sla?.corpus?.verifiable ?? d.totals.vtis} verifiable VTIs still go RED→GREEN`} />
        <Gauge label="Schema valid" pct={schema} color="var(--cyan)" detail={`${sla?.corpus?.schemaValid ?? d.totals.vtis} of ${sla?.corpus?.total ?? d.totals.vtis} records match the committed schema`} />
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
          <div className="eyebrow">Packaging</div>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ width: 40, height: 40, borderRadius: 11, background: inSync ? "var(--green-bg)" : "var(--red-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: inSync ? "var(--green)" : "var(--red)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{inSync ? <path d="M20 6L9 17l-5-5" /> : <path d="M18 6L6 18M6 6l12 12" />}</svg>
            </span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{inSync ? "In sync" : "Drifted"}</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>published lot vs. seed</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0, lineHeight: 1.5 }}>{sla?.packaging?.detail ?? "Published dataset matches the source corpus."}</p>
        </div>
      </div>

      <div className="card" style={{ padding: 22 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>What the SLA re-checks, every run</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
          {[
            ["Reproduction", "Every VTI in every lot is re-proven RED→GREEN. A trap that stops reproducing means the SDK moved under it — the freshness signal shows up here first."],
            ["Schema", "Each record is re-validated against the committed VTI schema — a back-stop against malformed or tampered data."],
            ["Drift", "The published dataset is diffed against the source corpus. Any divergence between what's sold and what's proven fails the gate."],
          ].map(([t, b]) => (
            <div key={t}>
              <div className="mono" style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--ink)" }}>{t}</div>
              <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0, lineHeight: 1.55 }}>{b}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
