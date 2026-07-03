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
const SEV_ORDER = ["critical", "high", "medium", "low"];
const PROOF_COLOR: Record<string, string> = { "static-checker": "#34d399", behavioral: "#22d3ee", compiler: "#8b7bff" };

function proofLabel(m: string) {
  return m === "static-checker" ? "static" : m;
}
function titleCase(s: string) {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type SortKey = "captured" | "severity" | "corroboration";
type GroupKey = "severity" | "sdk" | "class" | "none";

function countBy<T>(rows: T[], key: (r: T) => string) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + 1);
  return m;
}

export default function BrowseClient({ rows, classes }: { rows: LedgerRow[]; sdks: string[]; classes: string[] }) {
  const [q, setQ] = useState("");
  const [sev, setSev] = useState<string | null>(null);
  const [cls, setCls] = useState<string | null>(null);
  const [proof, setProof] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("severity");
  const [group, setGroup] = useState<GroupKey>("severity");
  const [sel, setSel] = useState<LedgerRow | null>(null);

  const proofs = ["static-checker", "behavioral", "compiler"];

  // Facet counts off the full corpus so the shape is always visible.
  const sevCounts = useMemo(() => countBy(rows, (r) => r.severity), [rows]);
  const clsCounts = useMemo(() => countBy(rows, (r) => r.class), [rows]);
  const proofCounts = useMemo(() => countBy(rows, (r) => r.proofMethod), [rows]);

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

  // Build ordered groups of the filtered rows.
  const groups = useMemo(() => {
    if (group === "none") return [{ key: "All VTIs", color: "var(--emerald)", rows: filtered }];
    const keyOf = (r: LedgerRow) => (group === "severity" ? r.severity : group === "sdk" ? r.sdk : r.class);
    const buckets = new Map<string, LedgerRow[]>();
    for (const r of filtered) {
      const k = keyOf(r);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k)!.push(r);
    }
    let entries = [...buckets.entries()];
    if (group === "severity") entries.sort((a, b) => SEV_RANK[b[0]] - SEV_RANK[a[0]]);
    else entries.sort((a, b) => b[1].length - a[1].length);
    return entries.map(([k, rs]) => ({
      key: group === "severity" ? titleCase(k) : group === "class" ? titleCase(k) : k,
      color: group === "severity" ? SEV[k]?.c ?? "var(--ink-3)" : "var(--emerald)",
      rows: rs,
    }));
  }, [filtered, group]);

  const anyFilter = sev || cls || proof || q;
  const reset = () => { setSev(null); setCls(null); setProof(null); setQ(""); };

  const FacetRow = ({ label, count, active, color, onClick }: { label: string; count: number; active: boolean; color?: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
        width: "100%", padding: "7px 10px", borderRadius: 8, cursor: "pointer",
        background: active ? (color ? `${color}1f` : "rgba(52,211,153,0.14)") : "transparent",
        border: `1px solid ${active ? (color ?? "var(--emerald)") : "transparent"}`,
        color: active ? (color ?? "var(--emerald)") : "var(--ink-2)",
        fontFamily: "var(--font-sans)", fontSize: 13, textAlign: "left",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {color && <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      </span>
      <span className="mono" style={{ fontSize: 11.5, color: active ? "inherit" : "var(--ink-4)", flexShrink: 0 }}>{count}</span>
    </button>
  );

  const FacetGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-4)", margin: "0 0 8px 2px" }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>{children}</div>
    </div>
  );

  const cardCols = sel ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(240px,1fr))";

  return (
    <div style={{ display: "grid", gridTemplateColumns: sel ? "200px 1fr 330px" : "200px 1fr", gap: 22, alignItems: "start" }}>
      {/* Faceted sidebar */}
      <aside style={{ position: "sticky", top: 84 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>Filters</span>
          {anyFilter && <button onClick={reset} className="mono" style={{ fontSize: 11, color: "var(--ink-3)", background: "transparent", border: "none", cursor: "pointer" }}>reset</button>}
        </div>
        <FacetGroup title="Severity">
          {SEV_ORDER.filter((s) => sevCounts.get(s)).map((s) => (
            <FacetRow key={s} label={titleCase(s)} count={sevCounts.get(s) ?? 0} active={sev === s} color={SEV[s].c} onClick={() => setSev(sev === s ? null : s)} />
          ))}
        </FacetGroup>
        <FacetGroup title="Class">
          {classes.map((c) => (
            <FacetRow key={c} label={titleCase(c)} count={clsCounts.get(c) ?? 0} active={cls === c} onClick={() => setCls(cls === c ? null : c)} />
          ))}
        </FacetGroup>
        <FacetGroup title="Proof method">
          {proofs.filter((p) => proofCounts.get(p)).map((p) => (
            <FacetRow key={p} label={proofLabel(p)} count={proofCounts.get(p) ?? 0} active={proof === p} color={PROOF_COLOR[p]} onClick={() => setProof(proof === p ? null : p)} />
          ))}
        </FacetGroup>
      </aside>

      {/* Results */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 22 }}>
          <div className="glass" style={{ display: "flex", alignItems: "center", gap: 9, flex: 1, minWidth: 200, height: 40, padding: "0 14px", borderRadius: 11 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the catalog" style={{ border: "none", outline: "none", background: "transparent", color: "var(--ink)", fontSize: 13.5, flex: 1, minWidth: 0, fontFamily: "var(--font-sans)" }} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--ink-3)" }}>
            Group
            <select value={group} onChange={(e) => setGroup(e.target.value as GroupKey)} className="mono" style={{ fontSize: 12, height: 34, padding: "0 10px", borderRadius: 9, background: "var(--glass)", color: "var(--ink-2)", border: "1px solid var(--line)", cursor: "pointer" }}>
              <option value="severity">Severity</option>
              <option value="sdk">SDK</option>
              <option value="class">Class</option>
              <option value="none">None</option>
            </select>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--ink-3)" }}>
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="mono" style={{ fontSize: 12, height: 34, padding: "0 10px", borderRadius: 9, background: "var(--glass)", color: "var(--ink-2)", border: "1px solid var(--line)", cursor: "pointer" }}>
              <option value="severity">Severity</option>
              <option value="captured">Newest</option>
              <option value="corroboration">Corroboration</option>
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: "48px 24px", textAlign: "center", color: "var(--ink-3)", fontSize: 14 }}>
            No VTIs match these filters.{" "}
            <button onClick={reset} className="mono" style={{ fontSize: 13, color: "var(--emerald)", background: "transparent", border: "none", cursor: "pointer" }}>reset</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
            {groups.map((g) => (
              <section key={g.key}>
                {group !== "none" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: g.color, boxShadow: `0 0 10px ${g.color}` }} />
                    <h2 style={{ fontSize: 14.5, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>{g.key}</h2>
                    <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-4)" }}>{g.rows.length}</span>
                    <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: cardCols, gap: 16 }}>
                  {g.rows.map((r) => {
                    const s = SEV[r.severity];
                    const active = sel?.trapId === r.trapId;
                    return (
                      <button
                        key={r.trapId}
                        onClick={() => setSel(active ? null : r)}
                        className={`glass lift ${active ? "lift-emerald" : ""}`}
                        style={{ borderRadius: "var(--radius-lg)", padding: 20, textAlign: "left", cursor: "pointer", border: active ? "1px solid rgba(52,211,153,0.45)" : "1px solid var(--line)", fontFamily: "var(--font-sans)" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 500, padding: "3px 9px", borderRadius: 999, color: s.c, background: s.bg, textTransform: "capitalize" }}>{r.severity}</span>
                          <span className="mono" style={{ fontSize: 11, color: PROOF_COLOR[r.proofMethod] ?? "var(--ink-4)" }}>{proofLabel(r.proofMethod)}</span>
                        </div>
                        <div className="mono" style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, letterSpacing: "-0.01em", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.trapId}</div>
                        <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{r.sdk} · {titleCase(r.class)}</div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        <div style={{ marginTop: 24, fontSize: 12.5, color: "var(--ink-3)" }}>
          <span className="mono">{filtered.length} of {rows.length} VTIs</span>
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
