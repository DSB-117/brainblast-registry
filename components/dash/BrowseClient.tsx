"use client";

import { useMemo, useState } from "react";
import type { LedgerRow } from "../../lib/dashboardData";

const SEV: Record<string, { c: string; bg: string }> = {
  critical: { c: "#fb7185", bg: "rgba(251,113,133,0.14)" },
  high: { c: "#fbbf24", bg: "rgba(251,191,36,0.14)" },
  medium: { c: "#22d3ee", bg: "rgba(34,211,238,0.14)" },
  low: { c: "#7c7c90", bg: "rgba(255,255,255,0.06)" },
};
const SEV_RANK: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };
const PROOF_COLOR: Record<string, string> = { "static-checker": "#34d399", behavioral: "#22d3ee", compiler: "#8b7bff" };

function proofLabel(m: string) {
  return m === "static-checker" ? "static" : m;
}
function ago(iso: string | null) {
  if (!iso) return "—";
  const d = (Date.now() - Date.parse(iso)) / 86_400_000;
  if (d < 1) return "today";
  if (d < 2) return "1d";
  return `${Math.round(d)}d`;
}

type SortKey = "captured" | "severity" | "corroboration";

export default function BrowseClient({ rows, classes }: { rows: LedgerRow[]; sdks: string[]; classes: string[] }) {
  const [q, setQ] = useState("");
  const [sev, setSev] = useState<string | null>(null);
  const [cls, setCls] = useState<string | null>(null);
  const [proof, setProof] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("captured");
  const [sel, setSel] = useState<LedgerRow | null>(null);

  const proofs = ["static-checker", "behavioral", "compiler"];

  const filtered = useMemo(() => {
    const r = rows.filter((x) => {
      if (sev && x.severity !== sev) return false;
      if (cls && x.class !== cls) return false;
      if (proof && x.proofMethod !== proof) return false;
      if (q && !`${x.trapId} ${x.sdk} ${x.class} ${x.title}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    return [...r].sort((a, b) => {
      if (sort === "severity") return SEV_RANK[b.severity] - SEV_RANK[a.severity];
      if (sort === "corroboration") return b.corroboration - a.corroboration;
      return (b.capturedAt ?? "").localeCompare(a.capturedAt ?? "");
    });
  }, [rows, q, sev, cls, proof, sort]);

  const Chip = ({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) => (
    <button
      onClick={onClick}
      className="mono"
      style={{
        fontSize: 11.5,
        padding: "6px 12px",
        borderRadius: 999,
        border: `1px solid ${active ? (color ?? "var(--emerald)") : "var(--line)"}`,
        background: active ? (color ? `${color}22` : "rgba(52,211,153,0.14)") : "transparent",
        color: active ? (color ?? "var(--emerald)") : "var(--ink-2)",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: sel ? "1fr 360px" : "1fr", gap: 18, transition: "grid-template-columns 0.2s" }}>
      <div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 14 }}>
          <div className="glass" style={{ display: "flex", alignItems: "center", gap: 9, flex: 1, minWidth: 220, maxWidth: 320, height: 40, padding: "0 14px", borderRadius: 11 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the catalog" style={{ border: "none", outline: "none", background: "transparent", color: "var(--ink)", fontSize: 13.5, flex: 1, minWidth: 0, fontFamily: "var(--font-sans)" }} />
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            {(["critical", "high"] as const).map((s) => <Chip key={s} label={s} active={sev === s} onClick={() => setSev(sev === s ? null : s)} color={SEV[s].c} />)}
          </div>
          <div style={{ width: 1, height: 22, background: "var(--line-2)" }} />
          <div style={{ display: "flex", gap: 7 }}>
            {proofs.map((p) => <Chip key={p} label={proofLabel(p)} active={proof === p} onClick={() => setProof(proof === p ? null : p)} color={PROOF_COLOR[p]} />)}
          </div>
          <div style={{ flex: 1 }} />
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="mono" style={{ fontSize: 12, height: 34, padding: "0 10px", borderRadius: 9, background: "var(--glass)", color: "var(--ink-2)", border: "1px solid var(--line)", cursor: "pointer" }}>
            <option value="captured">Newest</option>
            <option value="severity">Severity</option>
            <option value="corroboration">Corroboration</option>
          </select>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 20 }}>
          {classes.map((c) => <Chip key={c} label={c.replace(/-/g, " ")} active={cls === c} onClick={() => setCls(cls === c ? null : c)} />)}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: sel ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 16 }}>
          {filtered.map((r) => {
            const s = SEV[r.severity];
            const active = sel?.trapId === r.trapId;
            return (
              <button
                key={r.trapId}
                onClick={() => setSel(active ? null : r)}
                className={`glass lift ${active ? "lift-emerald" : ""}`}
                style={{
                  borderRadius: "var(--radius-lg)",
                  padding: 20,
                  textAlign: "left",
                  cursor: "pointer",
                  border: active ? "1px solid rgba(52,211,153,0.45)" : "1px solid var(--line)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 500, padding: "3px 9px", borderRadius: 999, color: s.c, background: s.bg, textTransform: "capitalize" }}>{r.severity}</span>
                  <span className="mono" style={{ fontSize: 11, color: PROOF_COLOR[r.proofMethod] ?? "var(--ink-4)" }}>{proofLabel(r.proofMethod)}</span>
                </div>
                <div className="mono" style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, letterSpacing: "-0.01em", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.trapId}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{r.sdk} · {r.class.replace(/-/g, " ")}</div>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, fontSize: 12.5, color: "var(--ink-3)" }}>
          <span className="mono">{filtered.length} of {rows.length} VTIs</span>
          {(sev || cls || proof || q) && (
            <button onClick={() => { setSev(null); setCls(null); setProof(null); setQ(""); }} className="mono" style={{ fontSize: 12, color: "var(--ink-2)", background: "transparent", border: "none", cursor: "pointer" }}>clear filters</button>
          )}
          {filtered.length === 0 && <span>No VTIs match these filters.</span>}
        </div>
      </div>

      {sel && <Drawer row={sel} onClose={() => setSel(null)} />}
    </div>
  );
}

function Drawer({ row, onClose }: { row: LedgerRow; onClose: () => void }) {
  const s = SEV[row.severity];
  return (
    <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 24, height: "fit-content", position: "sticky", top: 84, animation: "fade 0.25s ease" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11.5, fontWeight: 500, padding: "3px 10px", borderRadius: 999, color: s.c, background: s.bg, textTransform: "capitalize" }}>{row.severity}</span>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--ink-3)", cursor: "pointer", fontSize: 20, lineHeight: 1 }} aria-label="Close">×</button>
      </div>
      <h3 className="mono" style={{ fontSize: 15, fontWeight: 500, margin: "10px 0 6px", lineHeight: 1.3 }}>{row.trapId}</h3>
      <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "0 0 18px", lineHeight: 1.55 }}>{row.title}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {[
          ["sdk", row.sdk],
          ["class", row.class.replace(/-/g, " ")],
          ["proof", proofLabel(row.proofMethod)],
          ["corroboration", row.corroboration > 0 ? `${row.corroboration} repos` : "synthetic-owned"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
            <span className="mono" style={{ color: "var(--ink-3)" }}>{k}</span>
            <span className="mono" style={{ color: "var(--ink)" }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ borderRadius: 12, border: "1px solid rgba(52,211,153,0.25)", background: "rgba(52,211,153,0.08)", padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "var(--emerald)", marginBottom: 10, fontWeight: 500 }}>Proof receipt</div>
        <div style={{ display: "flex", gap: 9 }}>
          <span className="mono" style={{ flex: 1, fontSize: 11, textAlign: "center", padding: "7px 0", borderRadius: 8, background: "rgba(251,113,133,0.12)", color: "var(--rose)" }}>vulnerable → RED</span>
          <span className="mono" style={{ flex: 1, fontSize: 11, textAlign: "center", padding: "7px 0", borderRadius: 8, background: "rgba(52,211,153,0.16)", color: "var(--emerald)" }}>fixed → GREEN</span>
        </div>
        <p className="mono" style={{ fontSize: 10, color: "var(--ink-3)", margin: "10px 0 0", textAlign: "center" }}>re-runnable · npx brainblast verify</p>
      </div>

      <div style={{ borderRadius: 12, border: "1px dashed var(--line-2)", background: "var(--glass-2)", padding: "18px 16px", textAlign: "center" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.7" style={{ margin: "0 auto 8px", display: "block" }} aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></svg>
        <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: "0 0 3px" }}>Fixture bodies are gated</p>
        <p style={{ fontSize: 11.5, color: "var(--ink-3)", margin: "0 0 13px", lineHeight: 1.5 }}>The vulnerable + fixed snippets unlock with a standard grant.</p>
        <a href="/access" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#03130c", background: "var(--grad-brand)", padding: "8px 16px", borderRadius: 10 }}>Get access</a>
      </div>
    </div>
  );
}
