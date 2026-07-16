"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { LedgerRow } from "../../lib/dashboardData";
import { LOTS, LOT_ORDER, type LotName, type Pricing } from "../../lib/lots";

const SEV: Record<string, { c: string; bg: string }> = {
  critical: { c: "#fb7185", bg: "rgba(251,113,133,0.14)" },
  high: { c: "#fbbf24", bg: "rgba(251,191,36,0.14)" },
  medium: { c: "#22d3ee", bg: "rgba(34,211,238,0.14)" },
  low: { c: "#7c7c90", bg: "rgba(255,255,255,0.06)" },
};
const SEV_RANK: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };
const SEV_ORDER = ["critical", "high", "medium", "low"];
const PROOF_COLOR: Record<string, string> = { "static-checker": "#34d399", behavioral: "#22d3ee", compiler: "#8b7bff" };

// Lot taxonomy comes from lib/lots (single source of truth). Prices come from the
// live `pricing` prop (coverage-derived).
const CAP = 12; // cards shown per group before "show all"

function proofLabel(m: string) {
  return m === "static-checker" ? "static" : m;
}
function titleCase(s: string) {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type SortKey = "captured" | "severity" | "corroboration";
type GroupKey = "lot" | "severity" | "sdk" | "class" | "none";

function countBy<T>(rows: T[], key: (r: T) => string) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + 1);
  return m;
}

// Thin stacked severity bar — the shape of a set of rows at a glance.
function SevBar({ rows }: { rows: LedgerRow[] }) {
  const counts = SEV_ORDER.map((s) => rows.filter((r) => r.severity === s).length);
  const total = rows.length || 1;
  return (
    <div style={{ display: "flex", height: 4, borderRadius: 3, overflow: "hidden", background: "var(--glass-2)" }}>
      {SEV_ORDER.map((s, i) =>
        counts[i] ? <span key={s} title={`${counts[i]} ${s}`} style={{ width: `${(counts[i] / total) * 100}%`, background: SEV[s].c, opacity: 0.85 }} /> : null,
      )}
    </div>
  );
}

function lotName(k: string) { return LOTS[k as LotName]?.name ?? k; }
function lotAccent(k: string) { return LOTS[k as LotName]?.accent ?? "var(--ink-3)"; }
function usd(n: number) { return `$${n.toLocaleString()}`; }

export default function BrowseClient({ rows, classes, pricing }: { rows: LedgerRow[]; sdks: string[]; classes: string[]; pricing: Pricing }) {
  const priceOf = (lot: string) => pricing.lots.find((l) => l.lot === lot)?.price;
  const [q, setQ] = useState("");
  const [lot, setLot] = useState<string | null>(null);
  const [sev, setSev] = useState<string | null>(null);
  const [cls, setCls] = useState<string | null>(null);
  const [proof, setProof] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("severity");
  const [group, setGroup] = useState<GroupKey>("lot");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<LedgerRow | null>(null);

  const proofs = ["static-checker", "behavioral", "compiler"];

  // Facet counts off the full corpus so the shape is always visible.
  const lotCounts = useMemo(() => countBy(rows, (r) => r.lot), [rows]);
  const sevCounts = useMemo(() => countBy(rows, (r) => r.severity), [rows]);
  const clsCounts = useMemo(() => countBy(rows, (r) => r.class), [rows]);
  const proofCounts = useMemo(() => countBy(rows, (r) => r.proofMethod), [rows]);

  // Per-lot summary for the overview strip.
  const lotSummary = useMemo(() => {
    return LOT_ORDER.filter((k) => lotCounts.get(k)).map((k) => {
      const lr = rows.filter((r) => r.lot === k);
      const topSdks = [...countBy(lr, (r) => r.sdk).entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map((e) => e[0]);
      return { key: k, rows: lr, count: lr.length, topSdks };
    });
  }, [rows, lotCounts]);

  const filtered = useMemo(() => {
    const r = rows.filter((x) => {
      if (lot && x.lot !== lot) return false;
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
  }, [rows, q, lot, sev, cls, proof, sort]);

  // When a lot is selected, default the grouping to class (finer drill-in) unless
  // the user has picked something else. Otherwise group by lot.
  const effectiveGroup: GroupKey = group;

  const groups = useMemo(() => {
    if (effectiveGroup === "none") return [{ key: "__all", label: "All VTIs", color: "var(--emerald)", rows: filtered }];
    const keyOf = (r: LedgerRow) =>
      effectiveGroup === "lot" ? r.lot : effectiveGroup === "severity" ? r.severity : effectiveGroup === "sdk" ? r.sdk : r.class;
    const buckets = new Map<string, LedgerRow[]>();
    for (const r of filtered) {
      const k = keyOf(r);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k)!.push(r);
    }
    let entries = [...buckets.entries()];
    if (effectiveGroup === "lot") entries.sort((a, b) => LOT_ORDER.indexOf(a[0] as LotName) - LOT_ORDER.indexOf(b[0] as LotName));
    else if (effectiveGroup === "severity") entries.sort((a, b) => SEV_RANK[b[0]] - SEV_RANK[a[0]]);
    else entries.sort((a, b) => b[1].length - a[1].length);
    return entries.map(([k, rs]) => ({
      key: k,
      label:
        effectiveGroup === "lot" ? lotName(k) : effectiveGroup === "class" || effectiveGroup === "severity" ? titleCase(k) : k,
      color: effectiveGroup === "lot" ? lotAccent(k) : effectiveGroup === "severity" ? SEV[k]?.c ?? "var(--ink-3)" : "var(--emerald)",
      rows: rs,
    }));
  }, [filtered, effectiveGroup]);

  const anyFilter = lot || sev || cls || proof || q;
  const reset = () => { setLot(null); setSev(null); setCls(null); setProof(null); setQ(""); };
  const pickLot = (k: string) => {
    if (lot === k) { setLot(null); setGroup("lot"); }
    else { setLot(k); setGroup("class"); setSel(null); }
  };
  const toggleExpand = (k: string) => setExpanded((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });

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
    <div>
      {/* Lot overview — the organizing element: how the corpus is packaged for subscribers. */}
      <div style={{ marginBottom: 30 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "0 0 12px 2px", gap: 12 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-4)" }}>Curated lots · license à la carte, or take all with Scale</div>
          <a href="/pricing" style={{ fontSize: 12, color: "var(--ink-3)", whiteSpace: "nowrap" }}>Pricing →</a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 }}>
          {lotSummary.filter((l) => LOTS[l.key]?.sellable).map((l) => {
            const meta = LOTS[l.key];
            const active = lot === l.key;
            return (
              <button
                key={l.key}
                onClick={() => pickLot(l.key)}
                className={`glass lift ${active ? "lift-emerald" : ""}`}
                style={{
                  borderRadius: "var(--radius-lg)", padding: 18, textAlign: "left", cursor: "pointer",
                  border: `1px solid ${active ? meta.accent : "var(--line)"}`,
                  boxShadow: active ? `0 18px 50px -28px ${meta.accent}` : "none",
                  fontFamily: "var(--font-sans)", display: "flex", flexDirection: "column", gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.accent, boxShadow: `0 0 10px ${meta.accent}`, flexShrink: 0 }} />
                    <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>{meta.name}</span>
                  </span>
                  <span className="mono" style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{l.count}</span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5, minHeight: 36 }}>{meta.blurb}</div>
                <SevBar rows={l.rows} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {l.topSdks.map((s) => (
                    <span key={s} className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", background: "var(--glass-2)", padding: "2px 7px", borderRadius: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>{s}</span>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
                  <span className="mono" style={{ fontSize: 12, color: "var(--ink-2)" }}>{priceOf(l.key) ? `${usd(priceOf(l.key)!)}/yr` : ""}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: active ? meta.accent : "var(--ink-3)" }}>{active ? "Viewing ↓" : "Browse →"}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bundles — package + Scale, the upsell gradient. */}
        <a href="/pricing" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, marginTop: 12, padding: "12px 16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)", background: "var(--glass)" }}>
          <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-4)" }}>Bundles</span>
          {pricing.packages.map((pk) => (
            <span key={pk.key} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: pk.accent }} />
              <span style={{ color: "var(--ink-2)" }}>{pk.name}</span>
              <span className="mono" style={{ color: "var(--ink)" }}>{usd(pk.price)}</span>
            </span>
          ))}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--emerald)", boxShadow: "0 0 8px var(--emerald)" }} />
            <span style={{ color: "var(--ink-2)" }}>Scale · everything</span>
            <span className="mono" style={{ color: "var(--ink)" }}>{usd(pricing.scale)}</span>
          </span>
          <span style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--ink-3)" }}>Pricing →</span>
        </a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: sel ? "200px 1fr 330px" : "200px 1fr", gap: 22, alignItems: "start" }}>
        {/* Faceted sidebar — scrolls independently so a tall filter list can't
            get stranded past the viewport bottom (needs its own overflow, not
            the page's, since it's position:sticky). */}
        <aside className="scrolly" style={{ position: "sticky", top: 84, maxHeight: "calc(100vh - 104px)", overflowY: "auto", overflowX: "hidden", paddingRight: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>Filters</span>
            {anyFilter && <button onClick={reset} className="mono" style={{ fontSize: 11, color: "var(--ink-3)", background: "transparent", border: "none", cursor: "pointer" }}>reset</button>}
          </div>
          <FacetGroup title="Lot">
            {LOT_ORDER.filter((k) => lotCounts.get(k)).map((k) => (
              <FacetRow key={k} label={lotName(k)} count={lotCounts.get(k) ?? 0} active={lot === k} color={lotAccent(k)} onClick={() => pickLot(k)} />
            ))}
          </FacetGroup>
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
                <option value="lot">Lot</option>
                <option value="class">Class</option>
                <option value="sdk">SDK</option>
                <option value="severity">Severity</option>
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
              {groups.map((g) => {
                const isOpen = expanded.has(g.key) || g.rows.length <= CAP;
                const shown = isOpen ? g.rows : g.rows.slice(0, CAP);
                return (
                  <section key={g.key}>
                    {effectiveGroup !== "none" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: g.color, boxShadow: `0 0 10px ${g.color}` }} />
                        <h2 style={{ fontSize: 14.5, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>{g.label}</h2>
                        <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-4)" }}>{g.rows.length}</span>
                        <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: cardCols, gap: 16 }}>
                      {shown.map((r) => {
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
                              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span title={lotName(r.lot)} style={{ width: 7, height: 7, borderRadius: "50%", background: lotAccent(r.lot) }} />
                                <span className="mono" style={{ fontSize: 11, color: PROOF_COLOR[r.proofMethod] ?? "var(--ink-4)" }}>{proofLabel(r.proofMethod)}</span>
                              </span>
                            </div>
                            <div className="mono" style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, letterSpacing: "-0.01em", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.trapId}</div>
                            <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{r.sdk} · {titleCase(r.class)}</div>
                          </button>
                        );
                      })}
                    </div>
                    {g.rows.length > CAP && (
                      <button
                        onClick={() => toggleExpand(g.key)}
                        className="mono"
                        style={{ marginTop: 14, fontSize: 12.5, color: "var(--ink-2)", background: "var(--glass)", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}
                      >
                        {isOpen ? `Show fewer` : `Show all ${g.rows.length} in ${g.label} →`}
                      </button>
                    )}
                  </section>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 24, fontSize: 12.5, color: "var(--ink-3)" }}>
            <span className="mono">{filtered.length} of {rows.length} VTIs{lot ? ` · ${lotName(lot)} lot` : ""}</span>
          </div>
        </div>

        {sel && <Drawer row={sel} onClose={() => setSel(null)} />}
      </div>
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
          ["lot", lotName(row.lot)],
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
        <p style={{ fontSize: 11.5, color: "var(--ink-3)", margin: "0 0 13px", lineHeight: 1.5 }}>The vulnerable + fixed snippets unlock with the <strong style={{ color: lotAccent(row.lot) }}>{lotName(row.lot)}</strong> lot — or Scale.</p>
        <Link href="/access" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#03130c", background: "var(--grad-brand)", border: "none", padding: "8px 18px", borderRadius: 10, textDecoration: "none" }}>Unlock the {lotName(row.lot)} lot →</Link>
      </div>
    </div>
  );
}
