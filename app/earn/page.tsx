const WHY = [
  {
    c: "var(--emerald)",
    title: "Earn on real-world usage",
    body: "When your rule's RED→GREEN fix gets applied across real repos, it graduates and pays you from the $BRAIN bounty pool. You're paid for footguns that actually catch bugs in the wild — not for volume.",
  },
  {
    c: "var(--cyan)",
    title: "It compounds",
    body: "A proven rule isn't a one-off bug report — it becomes a permanent VTI in the corpus buyers train and evaluate against. The trap you prove today keeps working as the market scales.",
  },
  {
    c: "var(--violet)",
    title: "Open and permissionless",
    body: "No application, no gatekeeper, no one to email. If your submission clears the gate, it's in. You connect a wallet, stake behind your own rule, and the on-chain flow does the rest.",
  },
];

const REQUIREMENTS = [
  "A real SDK / protocol footgun — a way correct-looking code silently breaks.",
  "A minimal vulnerable snippet and the corrected fix, in TypeScript, Rust, or config.",
  "The pair must reproduce RED→GREEN: the rule fails the vulnerable code and passes the fix.",
  "No secrets — keypairs, base58 secrets, or mnemonics reject the whole submission automatically.",
  "Pinned to the SDK name and version the trap actually applies to.",
];

const STEPS = [
  {
    n: "01",
    title: "Prove it RED→GREEN",
    body: "Author a rule that catches the footgun (or extend a bundled pack) and prove it locally. The same oracle the dataset and benchmark use must FAIL your vulnerable fixture and PASS your fix. This is the gate — non-reproducing work never makes it in.",
    code: ["brainblast pack init ./my-pack --id my-sdk", "brainblast pack validate ./my-pack", "# vulnerable → RED   fixed → GREEN"],
  },
  {
    n: "02",
    title: "Stake behind it",
    body: "Connect a wallet on the staking app and register your pack and rule. You'll get a memo code and a USD-denominated stake amount — pay it in SOL, USDC, or $BRAIN (10% off). $5 is the suggested minimum: enough to cover indexer/gas and show you'll maintain the rule. No account, no approval step.",
    code: null,
    cta: { label: "Open the staking app", href: "/stake" },
  },
  {
    n: "03",
    title: "Graduate on real usage",
    body: "Graduation is earned in the wild. When brainblast confirms your rule's RED→GREEN fix across 5 distinct repos within 90 days, it graduates — the corroboration signal that makes a trap worth a buyer's money.",
    code: ["brainblast fix --apply   # records a graduation event", "# 5 distinct repos in 90 days → graduated"],
  },
  {
    n: "04",
    title: "Earn — or reclaim",
    body: "Graduated stakes feed the $BRAIN bounty pool that pays you as the author, and your corroborated traps become VTIs in the corpus buyers train and evaluate on. If a submission is rejected, you reclaim your stake — honest, reproducing work is the only thing that pays.",
    code: null,
  },
];

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 26, ...style }}>{children}</div>;
}

function Code({ lines }: { lines: string[] }) {
  return (
    <pre className="mono" style={{ margin: "16px 0 0", padding: "14px 16px", borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid var(--line)", fontSize: 12.5, lineHeight: 1.7, color: "var(--ink-2)", overflowX: "auto" }}>
      {lines.map((l) => (
        <div key={l} style={{ color: l.startsWith("#") ? "var(--ink-4)" : "var(--ink-2)" }}>{l}</div>
      ))}
    </pre>
  );
}

export default function Earn() {
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 28px 20px", animation: "fade 0.4s ease" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 14 }}>Contribute · Earn</div>
        <h1 style={{ fontSize: 42, fontWeight: 600, letterSpacing: "-0.035em", margin: 0, lineHeight: 1.08 }}>
          Get paid for the<br /><span className="grad-text">footguns you've already hit</span>
        </h1>
        <p style={{ fontSize: 16.5, color: "var(--ink-2)", margin: "18px auto 30px", maxWidth: 610, lineHeight: 1.6 }}>
          Turn a hard-won bug into a rule that proves RED→GREEN, stake behind it, and earn from the bounty pool when it catches the same footgun across real repos. Open and self-serve — connect a wallet and go.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/stake" style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 22px", borderRadius: 12, background: "var(--grad-brand)", color: "#03130c", fontSize: 14.5, fontWeight: 600 }}>Open the staking app</a>
          <a href="#how" style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 22px", borderRadius: 12, background: "var(--glass-2)", color: "var(--ink)", fontSize: 14.5, fontWeight: 600, border: "1px solid var(--line-2)" }}>See how it works</a>
        </div>
      </div>

      {/* Why */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginBottom: 68 }}>
        {WHY.map((w) => (
          <Card key={w.title}>
            <span style={{ display: "block", width: 30, height: 4, borderRadius: 999, background: w.c, marginBottom: 16, boxShadow: `0 0 14px ${w.c}` }} />
            <h3 style={{ fontSize: 16.5, fontWeight: 600, margin: "0 0 10px" }}>{w.title}</h3>
            <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: 0, lineHeight: 1.6 }}>{w.body}</p>
          </Card>
        ))}
      </div>

      {/* How it works — steps */}
      <div id="how" style={{ marginBottom: 68, scrollMarginTop: 84 }}>
        <div style={{ textAlign: "center", marginBottom: 34 }}>
          <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 10 }}>The process</div>
          <h2 style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em", margin: 0 }}>From footgun to bounty</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {STEPS.map((s) => (
            <Card key={s.n} style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 22, padding: 28 }}>
              <div className="mono grad-text" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{s.n}</div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "var(--ink-2)", margin: 0, lineHeight: 1.6, maxWidth: 660 }}>{s.body}</p>
                {s.code && <Code lines={s.code} />}
                {s.cta && (
                  <a href={s.cta.href} style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 15, fontSize: 13.5, fontWeight: 600, color: "var(--emerald)" }}>
                    {s.cta.label}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Requirements + Payment, two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 40 }}>
        <Card>
          <h3 style={{ fontSize: 17, fontWeight: 600, margin: "0 0 4px" }}>What makes a valid submission</h3>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 18px", lineHeight: 1.5 }}>The gate checks every one of these automatically — no reviewer in the loop.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {REQUIREMENTS.map((r) => (
              <div key={r} style={{ display: "flex", alignItems: "flex-start", gap: 11, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.5 }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--grad-brand)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#03130c" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                </span>
                {r}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: 17, fontWeight: 600, margin: "0 0 4px" }}>How the money works</h3>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 18px", lineHeight: 1.5 }}>Aligned so only honest, reproducing work earns.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              ["Stake to submit", "Bond your rule in SOL, USDC, or $BRAIN (10% off) — $5 suggested minimum. Reproduction is the anti-spam gate; a rejected submission reclaims its stake."],
              ["Bounty pool", "Graduated stakes feed the $BRAIN bounty pool. When your rule graduates — 5 distinct repos, 90 days — it pays you as the author."],
              ["Data dividend", "Your corroborated traps become VTIs in the corpus. As it's licensed for training and evaluation, value routes back to the contributors whose traps are used."],
            ].map(([t, b]) => (
              <div key={t}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--cyan)", boxShadow: "0 0 10px var(--cyan)" }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{t}</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "0 0 0 16px", lineHeight: 1.55 }}>{b}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-4)", margin: "18px 0 0", lineHeight: 1.55, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
            Staking, graduation, and the bounty pool are live and self-serve today. On-chain settlement of the data dividend on corpus usage is rolling out.
          </p>
        </Card>
      </div>

      {/* CTA */}
      <div className="glass" style={{ borderRadius: "var(--radius-xl)", padding: "36px 32px", textAlign: "center", border: "1px solid rgba(52,211,153,0.3)" }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 10px" }}>Stake your first rule</h2>
        <p style={{ fontSize: 14.5, color: "var(--ink-2)", margin: "0 auto 22px", maxWidth: 500, lineHeight: 1.6 }}>
          Participation is open — no application, no gatekeeper. Connect a wallet, register a rule, and you&apos;re in.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/stake" style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 22px", borderRadius: 12, background: "var(--grad-brand)", color: "#03130c", fontSize: 14.5, fontWeight: 600 }}>Open the staking app</a>
          <a href="/docs" style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 22px", borderRadius: 12, background: "var(--glass-2)", color: "var(--ink)", fontSize: 14.5, fontWeight: 600, border: "1px solid var(--line-2)" }}>Read the docs</a>
        </div>
      </div>
    </div>
  );
}
