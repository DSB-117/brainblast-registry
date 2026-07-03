"use client";

import { useMemo, useState } from "react";
import type { LedgerRow } from "../../lib/dashboardData";

const SEV_COLOR: Record<string, string> = { critical: "var(--red)", high: "var(--amber)", medium: "var(--blue)", low: "var(--ink-3)" };
const SEV_RANK: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };
const PROOF_COLOR: Record<string, string> = { "static-checker": "var(--green)", behavioral: "var(--cyan)", compiler: "var(--blue)" };

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

type SortKey = "severity" | "corroboration" | "captured" | "trap";

export default function BrowseClient({ rows, sdks, classes }: { rows: LedgerRow[]; sdks: string[]; classes: string[] }) {
  const [q, setQ] = useState("");
  const [sev, setSev] = useState<string | null>(null);
  const [cls, setCls] = useState<string | null>(null);
  const [proof, setProof] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("captured");
  const [dir, setDir] = useState<1 | -1>(-1);
  const [sel, setSel] = useState<LedgerRow | null>(null);

  const proofs = ["static-checker", "behavioral", "compiler"];

  const filtered = useMemo(() => {
    let r = rows.filter((x) => {
      if (sev && x.severity !== sev) return false;
      if (cls && x.class !== cls) return false;
      if (proof && x.proofMethod !== proof) return false;
      if (q) {
        const hay = `${x.trapId} ${x.sdk} ${x.class} ${x.title}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    r = [...r].sort((a, b) => {
      let d = 0;
      if (sort === "severity") d = SEV_RANK[a.severity] - SEV_RANK[b.severity];
      else if (sort === "corroboration") d = a.corroboration - b.corroboration;
      else if (sort === "trap") d = b.trapId.localeCompare(a.trapId);
      else d = (a.capturedAt ?? "").localeCompare(b.capturedAt ?? "");
      return d * dir;
    });
    return r;
  }, [rows, q, sev, cls, proof, sort, dir]);

  const toggleSort = (k: SortKey) => {
    if (sort === k) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setSort(k);
      setDir(-1);
    }
  };

  const Filter = ({ label, value, active, onClick, color }: { label: string; value: string | null; active: boolean; onClick: () => void; color?: string }) => (
    <button
      onClick={onClick}
      className="mono"
      style={{
        fontSize: 11,
        padding: "5px 11px",
        borderRadius: 999,
        border: `1px solid ${active ? (color ?? "var(--green)") : "var(--line-strong)"}`,
        background: active ? (color ? `${color}22` : "var(--green-bg)") : "transparent",
        color: active ? (color ?? "var(--green)") : "var(--ink-2)",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "all 0.14s",
      }}
    >
      {label}
    </button>
  );

  const SortHead = ({ k, children, w, align }: { k: SortKey; children: React.ReactNode; w?: string; align?: string }) => (
    <div
      onClick={() => toggleSort(k)}
      className="eyebrow"
      style={{ fontSize: 9.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, width: w, justifyContent: align === "right" ? "flex-end" : "flex-start", userSelect: "none" }}
    >
      {children}
      <span style={{ opacity: sort === k ? 1 : 0.25, color: sort === k ? "var(--green)" : "var(--ink-3)" }}>{sort === k && dir === 1 ? "↑" : "↓"}</span>
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: sel ? "1fr 372px" : "1fr", gap: 14, transition: "grid-template-columns 0.2s", animation: "bb-fadeup 0.4s ease" }}>
      <div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 220, maxWidth: 340, height: 38, padding: "0 13px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--panel)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter traps…" style={{ border: "none", outline: "none", background: "transparent", color: "var(--ink)", fontSize: 13, flex: 1, fontFamily: "var(--font-sans)" }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["critical", "high"] as const).map((s) => (
              <Filter key={s} label={s} value={s} active={sev === s} onClick={() => setSev(sev === s ? null : s)} color={SEV_COLOR[s]} />
            ))}
          </div>
          <div style={{ width: 1, height: 20, background: "var(--line-strong)" }} />
          <div style={{ display: "flex", gap: 6 }}>
            {proofs.map((p) => (
              <Filter key={p} label={proofLabel(p)} value={p} active={proof === p} onClick={() => setProof(proof === p ? null : p)} color={PROOF_COLOR[p]} />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {classes.map((c) => (
            <Filter key={c} label={c.replace(/-/g, " ")} value={c} active={cls === c} onClick={() => setCls(cls === c ? null : c)} />
          ))}
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: "1px solid var(--line)", color: "var(--ink-3)" }}>
            <span style={{ width: 8 }} />
            <SortHead k="trap" w="auto"><span style={{ flex: 1 }}>trap · sdk</span></SortHead>
            <div style={{ flex: 1 }} />
            <div className="eyebrow" style={{ fontSize: 9.5, width: 120 }}>class</div>
            <SortHead k="corroboration" w="70" align="right">corrob</SortHead>
            <div className="eyebrow" style={{ fontSize: 9.5, width: 66, textAlign: "center" }}>proof</div>
            <SortHead k="captured" w="44" align="right">age</SortHead>
          </div>

          <div className="scrolly" style={{ maxHeight: 560, overflowY: "auto" }}>
            {filtered.map((r) => {
              const active = sel?.trapId === r.trapId;
              return (
                <div
                  key={r.trapId}
                  onClick={() => setSel(active ? null : r)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 18px",
                    borderBottom: "1px solid var(--line-soft)",
                    cursor: "pointer",
                    background: active ? "var(--panel-2)" : "transparent",
                    boxShadow: active ? "inset 2px 0 0 var(--green)" : "none",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--panel-hover)"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: SEV_COLOR[r.severity], flexShrink: 0, boxShadow: `0 0 7px ${SEV_COLOR[r.severity]}` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mono" style={{ fontSize: 12.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.trapId}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}>{r.sdk}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-2)", width: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.class.replace(/-/g, " ")}</span>
                  <span className="mono" style={{ fontSize: 12, color: r.corroboration > 0 ? "var(--ink)" : "var(--ink-4)", width: 70, textAlign: "right" }}>{r.corroboration || "—"}</span>
                  <span style={{ width: 66, display: "flex", justifyContent: "center" }}>
                    <span className="mono" style={{ fontSize: 9.5, color: PROOF_COLOR[r.proofMethod] ?? "var(--ink-3)", background: "var(--panel-2)", padding: "2px 7px", borderRadius: 5 }}>{proofLabel(r.proofMethod)}</span>
                  </span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)", width: 44, textAlign: "right" }}>{ago(r.capturedAt)}</span>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding: "48px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>No traps match these filters.</div>
            )}
          </div>

          <div style={{ padding: "10px 18px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{filtered.length} of {rows.length} traps</span>
            {(sev || cls || proof || q) && (
              <button onClick={() => { setSev(null); setCls(null); setProof(null); setQ(""); }} className="mono" style={{ fontSize: 11, color: "var(--ink-2)", background: "transparent", border: "none", cursor: "pointer" }}>clear filters</button>
            )}
          </div>
        </div>
      </div>

      {sel && <DetailDrawer row={sel} onClose={() => setSel(null)} />}
    </div>
  );
}

function DetailDrawer({ row, onClose }: { row: LedgerRow; onClose: () => void }) {
  return (
    <div className="card" style={{ padding: 20, height: "fit-content", position: "sticky", top: 84, animation: "bb-fadeup 0.25s ease" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
        <span className="mono" style={{ fontSize: 10.5, color: SEV_COLOR[row.severity], background: `${SEV_COLOR[row.severity]}1e`, padding: "2px 8px", borderRadius: 5 }}>{row.severity}</span>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--ink-3)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }} aria-label="Close">×</button>
      </div>

      <h3 className="mono" style={{ fontSize: 15, fontWeight: 500, margin: "8px 0 4px", lineHeight: 1.3 }}>{row.trapId}</h3>
      <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: "0 0 16px", lineHeight: 1.5 }}>{row.title}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
        {[
          ["sdk", row.sdk],
          ["class", row.class.replace(/-/g, " ")],
          ["proof method", proofLabel(row.proofMethod)],
          ["corroboration", row.corroboration > 0 ? `${row.corroboration} repos` : "synthetic-owned"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span className="mono" style={{ color: "var(--ink-3)" }}>{k}</span>
            <span className="mono" style={{ color: "var(--ink)" }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ borderRadius: 11, border: "1px solid rgba(36,242,168,0.22)", background: "var(--green-bg)", padding: "12px 14px", marginBottom: 14 }}>
        <div className="eyebrow" style={{ color: "var(--green)", marginBottom: 9 }}>Proof receipt</div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="mono" style={{ flex: 1, fontSize: 11, textAlign: "center", padding: "6px 0", borderRadius: 7, background: "var(--red-bg)", color: "var(--red)" }}>vulnerable → RED</span>
          <span className="mono" style={{ flex: 1, fontSize: 11, textAlign: "center", padding: "6px 0", borderRadius: 7, background: "rgba(36,242,168,0.14)", color: "var(--green)" }}>fixed → GREEN</span>
        </div>
        <p className="mono" style={{ fontSize: 10, color: "var(--ink-3)", margin: "10px 0 0", textAlign: "center" }}>re-runnable · npx brainblast verify</p>
      </div>

      <div style={{ borderRadius: 11, border: "1px dashed var(--line-strong)", background: "var(--panel-2)", padding: "16px 14px", textAlign: "center" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.7" style={{ margin: "0 auto 8px", display: "block" }} aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></svg>
        <p style={{ fontSize: 12, color: "var(--ink-2)", margin: "0 0 3px" }}>Fixture bodies are gated</p>
        <p style={{ fontSize: 11, color: "var(--ink-3)", margin: "0 0 12px", lineHeight: 1.5 }}>The vulnerable + fixed snippets unlock with a standard grant.</p>
        <a href="/access" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#04241c", background: "var(--green)", padding: "7px 14px", borderRadius: 9 }}>Get access →</a>
      </div>
    </div>
  );
}
