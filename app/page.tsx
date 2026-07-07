import Link from "next/link";
import { loadDashboard } from "../lib/dashboardData";
import HeroViz from "../components/store/HeroViz";
import Offers from "../components/store/Offers";

export const revalidate = 60;

const SEV = {
  critical: { c: "var(--rose)", bg: "rgba(251,113,133,0.14)" },
  high: { c: "var(--amber)", bg: "rgba(251,191,36,0.14)" },
  medium: { c: "var(--cyan)", bg: "rgba(34,211,238,0.14)" },
  low: { c: "var(--ink-3)", bg: "rgba(255,255,255,0.06)" },
} as const;

export default async function Home() {
  const d = await loadDashboard();
  const growth = [2, 3, 5, 6, 8, 9, 12, 13, 15].map((n) => Math.round((n / 15) * d.totals.vtis));
  const classesTotal = d.totals.classes + d.coverage.uncovered.length;

  return (
    <div style={{ animation: "fade 0.5s ease" }}>
      {/* HERO */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "72px 28px 40px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 56, alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--line)", background: "var(--glass)", fontSize: 12.5, color: "var(--ink-2)", marginBottom: 26 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--emerald)", boxShadow: "0 0 8px var(--emerald)" }} />
            Live corpus · {d.totals.reproductionPct}% reproduced
          </div>
          <h1 style={{ fontSize: 52, lineHeight: 1.05, fontWeight: 600, letterSpacing: "-0.035em", margin: 0 }}>
            The open corpus of<br /><span className="grad-text">machine-verified</span> AI training data
          </h1>
          <p style={{ fontSize: 17, color: "var(--ink-2)", lineHeight: 1.6, margin: "22px 0 32px", maxWidth: 480 }}>
            Verified Trap Instances — proven error→fix→test records of the SDK errors AI ships, pinned to exact versions and re-provable on demand. Browse it free; train on it, or evaluate your model against it.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/browse" style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 24px", borderRadius: 12, background: "var(--grad-brand)", color: "#03130c", fontSize: 15, fontWeight: 600, boxShadow: "0 10px 34px -10px rgba(52,211,153,0.7)" }}>
              Browse the marketplace
            </Link>
            <Link href="/pricing" style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 22px", borderRadius: 12, border: "1px solid var(--line-2)", background: "var(--glass)", color: "var(--ink)", fontSize: 15, fontWeight: 500 }}>
              View pricing
            </Link>
          </div>
        </div>

        <HeroViz
          vtis={d.totals.vtis}
          sdks={d.totals.sdks}
          classesLabel={`${d.totals.classes}/${classesTotal}`}
          reproductionPct={d.totals.reproductionPct}
          growth={growth}
        />
      </section>

      {/* TRUST STRIP */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 28px 8px" }}>
        <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: "22px 28px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {[
            ["Pinned to versions", "Every record is bound to an exact SDK release."],
            ["RED→GREEN proven", "The vulnerable code fails; the fix passes. Both on record."],
            ["Re-provable by anyone", "No secret answer key — verify it yourself."],
            ["A fresh delta", "New verified records stream in continuously."],
          ].map(([h, s], i) => (
            <div key={i} style={{ padding: "0 16px", borderLeft: i === 0 ? "none" : "1px solid var(--line)" }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 5 }}>{h}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5 }}>{s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY IT MATTERS — the value/power, before the buying options */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "68px 28px 8px" }}>
        <div style={{ textAlign: "center", marginBottom: 40, maxWidth: 660, marginLeft: "auto", marginRight: "auto" }}>
          <div style={{ fontSize: 13, color: "var(--violet)", fontWeight: 500, marginBottom: 14, letterSpacing: "0.02em" }}>Why it matters</div>
          <h2 style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em", margin: 0, lineHeight: 1.15 }}>The bugs AI ships are specific. So is the proof.</h2>
          <p style={{ fontSize: 15.5, color: "var(--ink-2)", margin: "14px auto 0", maxWidth: 560, lineHeight: 1.6 }}>
            Coding agents confidently emit the same SDK integration footguns — insecure defaults, zeroed slippage guards, skipped signature checks, stale oracle reads — that compile, pass review, and quietly do the wrong thing. Brainblast is the corpus of exactly those failures, each one machine-proven.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {[
            { c: "var(--rose)", h: "The failure mode that costs you", b: "Not generic bugs — the precise integration mistakes models make: an insecure default, a zeroed fee, a swap with no slippage floor, a price used without a freshness check. Captured, versioned, and named before they reach prod." },
            { c: "var(--emerald)", h: "Proof you can't game", b: "Every record goes RED→GREEN through a machine oracle — the vulnerable code fails, the fix passes, and anyone can replay it. 100% reproduced, no answer key. A model can't fake having learned it." },
            { c: "var(--violet)", h: "A corpus that compounds", b: "An autonomous fleet finds and verifies new traps across the SDKs teams actually ship — fresh and growing, not a stale dump. And when a contributor's trap lands, they earn from the records buyers use." },
          ].map((x) => (
            <div key={x.h} className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 26 }}>
              <span style={{ display: "block", width: 26, height: 3, borderRadius: 2, background: x.c, marginBottom: 15, boxShadow: `0 0 10px ${x.c}` }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 10px" }}>{x.h}</h3>
              <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0, lineHeight: 1.6 }}>{x.b}</p>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", fontSize: 14.5, color: "var(--ink-2)", margin: "26px auto 0", maxWidth: 620, lineHeight: 1.6 }}>
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>Train</span> models that write correct integration code the first time, or <span style={{ color: "var(--ink)", fontWeight: 500 }}>evaluate</span> any model against a benchmark it hasn&apos;t seen.
        </p>
      </section>

      {/* THREE WAYS IN */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "72px 28px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 14, letterSpacing: "0.02em" }}>Three ways in</div>
          <svg width="150" height="10" viewBox="0 0 150 10" style={{ display: "block", margin: "0 auto 14px" }} aria-hidden="true">
            <line x1="2" y1="5" x2="148" y2="5" stroke="var(--line-2)" strokeWidth="1.5" />
            <line className="stream-line" x1="2" y1="5" x2="148" y2="5" stroke="url(#streamgrad)" strokeWidth="1.5" strokeLinecap="round" />
            <defs><linearGradient id="streamgrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#34d399" /><stop offset="1" stopColor="#8b7bff" /></linearGradient></defs>
          </svg>
          <h2 style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em", margin: 0 }}>Browse it free. Train on it. Evaluate against it.</h2>
          <p style={{ fontSize: 15.5, color: "var(--ink-2)", margin: "12px auto 0", maxWidth: 540 }}>The corpus is open. We charge for the two things that scale with it — certifying your models, and pointing the fleet at your stack.</p>
        </div>
        <Offers pricing={d.lotPricing} />
      </section>

      {/* FEATURED CATALOG */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 28px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 26 }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--violet)", fontWeight: 500, marginBottom: 10 }}>In the marketplace</div>
            <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.03em", margin: 0 }}>Latest verified records</h2>
          </div>
          <Link href="/browse" style={{ fontSize: 14, color: "var(--ink-2)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            Browse all {d.totals.vtis} VTIs
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {d.ledger.slice(0, 6).map((r) => {
            const sev = SEV[r.severity];
            return (
              <Link key={r.trapId} href="/browse" className="glass lift" style={{ borderRadius: "var(--radius-lg)", padding: 20, display: "block" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 500, padding: "3px 9px", borderRadius: 999, color: sev.c, background: sev.bg, textTransform: "capitalize" }}>{r.severity}</span>
                  <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-4)" }}>{r.proofMethod === "static-checker" ? "static" : r.proofMethod}</span>
                </div>
                <div className="mono" style={{ fontSize: 14.5, fontWeight: 500, marginBottom: 8, letterSpacing: "-0.01em" }}>{r.trapId}</div>
                <div style={{ fontSize: 13, color: "var(--ink-3)" }}>{r.sdk} · {r.class.replace(/-/g, " ")}</div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
