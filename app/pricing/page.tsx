import Offers from "../../components/store/Offers";

export default function Pricing() {
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 28px 20px", animation: "fade 0.4s ease" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 14 }}>Pricing</div>
        <h1 style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.035em", margin: 0 }}>The corpus is free. We charge for leverage.</h1>
        <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "14px auto 0", maxWidth: 560, lineHeight: 1.6 }}>
          Anyone can browse and sample the verified corpus, no signup. Revenue comes from the two things that scale with it — evaluating your models against it, and funding the fleet to cover your SDKs.
        </p>
      </div>

      <Offers />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 40 }}>
        <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(52,211,153,0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z" /></svg>
            </span>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Pay in $BRAIN for 10% off</h3>
          </div>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: 0, lineHeight: 1.6 }}>
            USD is the default and needs no wallet. $BRAIN is an optional rail — pay in it for a standing 10% discount. USDC we accept at full price is programmatically bought back into $BRAIN and routed to the contributors whose traps you&apos;re using. You never have to hold a token to buy.
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
    </div>
  );
}
