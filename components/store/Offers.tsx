import Link from "next/link";
import { LOTS, monthlyOf, type LotName, type Pricing } from "../../lib/lots";

const contact = process.env.NEXT_PUBLIC_ACCESS_EMAIL || "contact@brainblast.tech";
function mailto(subject: string, body: string) {
  return `mailto:${contact}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
function usd(n: number) { return `$${n.toLocaleString()}`; }

const EVAL_HREF = mailto("Brainblast eval — certify a model", "We'd like to evaluate a model/agent against the verified corpus.\n\nModel / agent:\nCadence (per release / quarterly):\nSDKs of interest:\n");
const SPONSOR_HREF = mailto("Sponsor scouting — point the fleet at our SDKs", "We'd like to sponsor verified-bug scouting for the SDKs we build on.\n\nSDKs / protocols:\nWhat you'd want covered:\n");

export default function Offers({ detailed = false, pricing }: { detailed?: boolean; pricing: Pricing }) {
  const lotPrice = (l: LotName) => pricing.lots.find((x) => x.lot === l)?.price ?? 0;
  const lotCount = (l: LotName) => pricing.lots.find((x) => x.lot === l)?.count ?? 0;

  // Bundle cards: the two packages + Scale, with the savings vs the à-la-carte list.
  const bundles = [
    ...pricing.packages.map((p) => ({
      key: p.key,
      name: p.name,
      accent: p.accent,
      price: p.price,
      list: p.listPrice,
      featured: false,
      includes: p.lots.map((l) => LOTS[l].name).join(" + "),
      blurb: p.key === "web3" ? "Both blockchain lots — for teams shipping on-chain." : "Every web, backend, cloud & crypto lot — the full AppSec surface.",
      cta: `Get ${p.name}`,
    })),
    {
      key: "scale",
      name: "Scale",
      accent: "#34d399",
      price: pricing.scale,
      list: pricing.scaleListPrice,
      featured: true,
      includes: "Every lot + all future lots",
      blurb: "The whole corpus, the live firehose, and every lot we add next.",
      cta: "Get Scale",
    },
  ];

  return (
    <>
      {/* Bundles + Scale — the headline options */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
        {bundles.map((b) => {
          const save = b.list > b.price ? Math.round((1 - b.price / b.list) * 100) : 0;
          return (
            <div
              key={b.key}
              className={`glass lift ${b.featured ? "lift-emerald" : ""}`}
              style={{
                borderRadius: "var(--radius-lg)", padding: 28, display: "flex", flexDirection: "column",
                border: b.featured ? "1px solid rgba(52,211,153,0.45)" : "1px solid var(--line)",
                boxShadow: b.featured ? "0 24px 70px -30px rgba(52,211,153,0.5)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: b.accent, boxShadow: `0 0 10px ${b.accent}` }} />
                  <span style={{ fontSize: 17, fontWeight: 600 }}>{b.name}</span>
                </span>
                {save > 0 && <span style={{ fontSize: 11.5, fontWeight: 500, padding: "4px 10px", borderRadius: 999, color: b.featured ? "#03130c" : "var(--ink-2)", background: b.featured ? "var(--grad-brand)" : "var(--glass-2)" }}>save {save}%</span>}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginBottom: 6 }}>
                <span className="mono" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>{usd(b.price)}</span>
                <span style={{ fontSize: 12, color: "var(--ink-4)" }}>/ yr</span>
                {save > 0 && <span className="mono" style={{ fontSize: 12.5, color: "var(--ink-4)", textDecoration: "line-through" }}>{usd(b.list)}</span>}
              </div>
              <div className="mono" style={{ fontSize: 12, color: "var(--ink-4)", marginBottom: 6 }}>or {usd(monthlyOf(b.price))}/mo billed monthly</div>
              <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 16, lineHeight: 1.5 }}>{b.blurb}</div>
              <div style={{ fontSize: 12, color: "var(--ink-2)", marginBottom: 22, padding: "10px 12px", borderRadius: 10, background: "var(--glass-2)", border: "1px solid var(--line)" }}>
                <span style={{ color: "var(--ink-4)" }}>Includes · </span>{b.includes}
              </div>
              {detailed && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "var(--ink-2)", marginBottom: 22 }}>
                  {["Every vulnerable + fixed fixture", "Live verified delta, zero holdback", "USD — or $BRAIN for 10% off"].map((f) => (
                    <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start", lineHeight: 1.4 }}>
                      <span style={{ width: 16, height: 16, borderRadius: "50%", background: b.accent, flexShrink: 0, marginTop: 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#03130c" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                      </span>
                      {f}
                    </div>
                  ))}
                </div>
              )}
              <Link href="/access" style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", height: 46, borderRadius: 12, fontSize: 14.5, fontWeight: 600, background: b.featured ? "var(--grad-brand)" : "var(--glass-2)", color: b.featured ? "#03130c" : "var(--ink)", border: b.featured ? "none" : "1px solid var(--line-2)" }}>
                {b.cta}
              </Link>
            </div>
          );
        })}
      </div>

      {/* À la carte — the 8 lots */}
      <div style={{ marginTop: 34 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Or buy by the lot</h3>
          <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>priced by coverage — patterns × SDKs, not raw count</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12 }}>
          {pricing.lots.map((l) => {
            const meta = LOTS[l.lot];
            return (
              <Link key={l.lot} href="/access" className="glass lift" style={{ borderRadius: "var(--radius-lg)", padding: 18, display: "flex", flexDirection: "column", gap: 8, border: "1px solid var(--line)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.accent, flexShrink: 0 }} />
                    <span style={{ fontSize: 14.5, fontWeight: 600 }}>{meta.name}</span>
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{usd(lotPrice(l.lot))}<span style={{ fontSize: 10, color: "var(--ink-4)", fontWeight: 400 }}>/yr</span></span>
                    <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>or {usd(monthlyOf(lotPrice(l.lot)))}/mo</span>
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5, minHeight: 34 }}>{meta.blurb}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>{l.count} VTIs · {l.patterns} patterns · {l.sdks} SDKs</div>
              </Link>
            );
          })}
          {pricing.otherCount > 0 && (
            <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 18, display: "flex", flexDirection: "column", gap: 8, border: "1px dashed var(--line)", opacity: 0.6, cursor: "default" }} title="Uncategorized traps — SDKs that don't map to a curated lot. Not sold à la carte; included in Scale.">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: LOTS.other.accent, flexShrink: 0 }} />
                  <span style={{ fontSize: 14.5, fontWeight: 600 }}>{LOTS.other.name}</span>
                </span>
                <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-4)" }}>Scale-only</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5, minHeight: 34 }}>{LOTS.other.blurb}</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>{pricing.otherCount} VTIs · not sold à la carte</div>
            </div>
          )}
        </div>
      </div>

      {/* Free tier + services */}
      <Link href="/browse" className="glass lift" style={{ display: "flex", alignItems: "center", gap: 16, borderRadius: "var(--radius-lg)", padding: "18px 24px", marginTop: 22 }}>
        <span style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(45,212,191,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>Browse free</div>
          <div style={{ fontSize: 13.5, color: "var(--ink-3)" }}>Read the whole catalog and pull a receipt-only sample — no signup, no wallet.</div>
        </div>
        <span style={{ fontSize: 13.5, color: "var(--ink-2)", display: "inline-flex", alignItems: "center", gap: 6 }}>Browse<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
      </Link>

      <Link href={EVAL_HREF} className="glass lift" style={{ display: "flex", alignItems: "center", gap: 16, borderRadius: "var(--radius-lg)", padding: "18px 24px", marginTop: 14 }}>
        <span style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(52,211,153,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>Evaluate your model or agent</div>
          <div style={{ fontSize: 13.5, color: "var(--ink-3)" }}>We run it against a held-out slice of the corpus and hand you a scorecard of which bugs it still ships — re-run every release.</div>
        </div>
        <span style={{ fontSize: 13.5, color: "var(--ink-2)", display: "inline-flex", alignItems: "center", gap: 6 }}>Book an eval<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
      </Link>

      <Link href={SPONSOR_HREF} className="glass lift" style={{ display: "flex", alignItems: "center", gap: 16, borderRadius: "var(--radius-lg)", padding: "18px 24px", marginTop: 14 }}>
        <span style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(34,211,238,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4M11 8v6M8 11h6" /></svg>
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>Sponsor scouting</div>
          <div style={{ fontSize: 13.5, color: "var(--ink-3)" }}>Point the autonomous fleet at your stack — fund verified findings for the SDKs you build on.</div>
        </div>
        <span style={{ fontSize: 13.5, color: "var(--ink-2)", display: "inline-flex", alignItems: "center", gap: 6 }}>Talk to us<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
      </Link>
    </>
  );
}
