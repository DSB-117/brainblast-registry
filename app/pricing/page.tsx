import Offers from "../../components/store/Offers";

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
    a: "Not access to a paywall — the catalog is open. You're buying leverage on top of it: either an evaluation (we run your model against a held-out slice of the corpus and hand you a scorecard), or a training license to the full fixture dataset and its live delta. The free tier is the whole catalog, readable by anyone.",
  },
  {
    q: "What format does the data come in?",
    a: "VTIs are JSON records with the code fixtures and tests as files, streamed as NDJSON. Browse pulls a sample; Train ships the full versioned dataset plus a feed of new verified records as the fleet finds them. Eval results come back as a written scorecard and machine-readable JSON.",
  },
  {
    q: "Why is pricing “talk to us” instead of a number?",
    a: "The corpus is early and growing fast. We size eval and training access to the coverage you actually need rather than pin a shelf price to a moving target — and we'll quote it honestly. As the corpus scales, standard self-serve tiers open up.",
  },
  {
    q: "Do I need $BRAIN or a wallet to buy?",
    a: "No. USD is the default and needs no wallet. $BRAIN is an optional rail — pay in it for a standing 10% discount. Whatever you pay, we route value to the contributors whose records you use.",
  },
];

export default function Pricing() {
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 28px 20px", animation: "fade 0.4s ease" }}>
      <div style={{ textAlign: "center", marginBottom: 44 }}>
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 14 }}>Pricing</div>
        <h1 style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.035em", margin: 0 }}>Pay for leverage, not access.</h1>
        <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "14px auto 0", maxWidth: 580, lineHeight: 1.6 }}>
          The corpus itself is open — anyone can read and sample it, no signup. You pay for the two things that build on it: <span style={{ color: "var(--ink)" }}>evaluating your models against it</span>, or <span style={{ color: "var(--ink)" }}>licensing the full dataset to train on</span>.
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

      <Offers detailed />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 40 }}>
        <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(52,211,153,0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z" /></svg>
            </span>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Pay in $BRAIN for 10% off</h3>
          </div>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: 0, lineHeight: 1.6 }}>
            USD is the default and needs no wallet. $BRAIN is an optional rail — pay in it for a standing 10% discount. USDC we accept at full price is programmatically bought back into $BRAIN and routed to the contributors whose records you&apos;re using. You never have to hold a token to buy.
          </p>
        </div>

        <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(139,123,255,0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--violet)" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
            </span>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Priced for where we are</h3>
          </div>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: 0, lineHeight: 1.6 }}>
            The corpus is early and growing fast. Eval and training access are quoted per engagement — scaled to the coverage you need — rather than a fixed shelf price on a moving target. As the corpus scales, standard tiers open up. Talk to us and we&apos;ll size it honestly.
          </p>
        </div>
      </div>

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
