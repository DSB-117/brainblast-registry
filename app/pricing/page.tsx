import Offers from "../../components/store/Offers";
import { loadDashboard } from "../../lib/dashboardData";

const ANATOMY = [
  { k: "SDK + exact version", v: "Pinned to the release the bug lives in — e.g. @solana/web3.js 1.95.3.", c: "var(--cyan)" },
  { k: "The failing code (RED)", v: "A minimal repro of the bug — compiles, runs, and fails the way the SDK trips up real code.", c: "var(--rose)" },
  { k: "The fix (GREEN)", v: "The corrected code that does the same job the right way.", c: "var(--emerald)" },
  { k: "The test", v: "One test that proves RED fails and GREEN passes — the diff is the lesson.", c: "var(--violet)" },
  { k: "Oracle receipt", v: "A machine re-verification anyone can replay. No trust, no answer key.", c: "var(--amber)" },
];

const FAQ = [
  {
    q: "So what am I actually buying?",
    a: "A training license to curated slices of the corpus. The catalog is open to read; you pay for the fixtures — the vulnerable+fixed code and tests you train on. Buy the lots that match your stack — each priced by its coverage — or take everything, including every future lot, with Scale.",
  },
  {
    q: "What's in a lot, and how are they split?",
    a: "Each lot is a coherent slice of the corpus for one ecosystem or security domain — the blockchain lots (Solana, EVM), plus auth & sessions, transport/TLS, web hardening, cloud & storage, cryptography, and browser/desktop. A lot ships every vulnerable+fixed fixture in that slice plus its live verified delta as the fleet finds more. Scale is every lot at once, including lots we add later.",
  },
  {
    q: "When does buying lots beat Scale?",
    a: "One or two lots if you only ship on a single ecosystem. Once you'd want several, Scale is cheaper than buying them à la carte and includes every future lot plus the zero-holdback firehose — so most teams past a couple of lots take Scale.",
  },
  {
    q: "What format does the data come in?",
    a: "VTIs are JSON records with the code fixtures and tests as files, streamed as NDJSON. Browse pulls a receipt-only sample; a paid lot (or Scale) streams the full fixtures plus a live feed of new verified records as the fleet finds them.",
  },
  {
    q: "Monthly or annual?",
    a: "Both — pick the period when you build your license on the access page. Every lot, package, and Scale bills monthly or annually. Annual is the committed rate: 2 months free (~17% off) versus paying month to month. The $BRAIN 10% discount stacks on either.",
  },
  {
    q: "How do I pay?",
    a: "Self-serve checkout is on-chain: pay from any Solana wallet in SOL, USDC, or $BRAIN — $BRAIN takes a standing 10% off any lot, package, or Scale. Your signed grant is issued the moment the payment verifies. Prefer USD invoicing or custom terms? Contact sales from the access page. Whatever you pay, we route value to the contributors whose records you use.",
  },
];

export default async function Pricing() {
  const d = await loadDashboard();
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 28px 20px", animation: "fade 0.4s ease" }}>
      <div style={{ textAlign: "center", marginBottom: 44 }}>
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 14 }}>Pricing</div>
        <h1 style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.035em", margin: 0 }}>Pay for leverage, not access.</h1>
        <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "14px auto 0", maxWidth: 580, lineHeight: 1.6 }}>
          The corpus itself is open — anyone can read and sample it, no signup. You pay for the fixtures you train on: <span style={{ color: "var(--ink)" }}>license the curated lots for your stack</span>, or <span style={{ color: "var(--ink)" }}>take the whole corpus with Scale</span>.
        </p>
      </div>

      {/* What you're buying — the unit, made concrete */}
      <div className="glass" style={{ borderRadius: "var(--radius-xl)", padding: 32, marginBottom: 40, display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 40, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-4)", marginBottom: 12 }}>What you're buying</div>
          <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 14px", lineHeight: 1.2 }}>
            One <span className="grad-text">VTI</span> = one proven SDK bug
          </h2>
          <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.65, margin: 0 }}>
            A Verified Trap Instance is a single, machine-checked record of a way an SDK trips up code — captured as failing code, the fix, and a test that proves the difference. The corpus is a growing library of them. Everything below is a way to <span style={{ color: "var(--ink)" }}>use</span> that library.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {ANATOMY.map((row, i) => (
            <div key={row.k} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: i < ANATOMY.length - 1 ? "1px solid var(--line)" : "none" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: row.c, flexShrink: 0, marginTop: 6, boxShadow: `0 0 10px ${row.c}` }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>{row.k}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5 }}>{row.v}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it's priced — the model, made explicit */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-4)", marginBottom: 10 }}>How pricing works</div>
          <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>Priced by coverage. Bought three ways.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {[
            { c: "var(--cyan)", h: "Priced by coverage, not count", b: "A lot's price tracks the distinct lessons it teaches — footgun patterns × SDKs covered × quality (severity and independent corroboration) — snapped to clean tiers. You pay for leverage, not row count, so a dense lot costs more than a big-but-shallow one." },
            { c: "var(--violet)", h: "Three ways to buy", b: "A single lot for the ecosystem you ship on; a package — Web3 (both chains) or AppSec (every web, backend, cloud & crypto lot) — at a discount; or Scale, every lot plus every lot we add next. Low floor, clear ceiling." },
            { c: "var(--emerald)", h: "Every license includes", b: "The full RED + GREEN fixtures and the proving test for each record · the live verified delta as the fleet finds more, zero holdback · a signed grant issued instantly at checkout · pay in SOL, USDC, or $BRAIN for a standing 10% off." },
          ].map((x) => (
            <div key={x.h} className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 24 }}>
              <span style={{ display: "block", width: 26, height: 3, borderRadius: 2, background: x.c, marginBottom: 14, boxShadow: `0 0 10px ${x.c}` }} />
              <h3 style={{ fontSize: 15.5, fontWeight: 600, margin: "0 0 9px" }}>{x.h}</h3>
              <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0, lineHeight: 1.6 }}>{x.b}</p>
            </div>
          ))}
        </div>
      </div>

      <Offers detailed pricing={d.lotPricing} />

      {/* FAQ */}
      <div style={{ marginTop: 64 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 28px" }}>Common questions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {FAQ.map((f) => (
            <div key={f.q} className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 9px" }}>{f.q}</h3>
              <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: 0, lineHeight: 1.6 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
