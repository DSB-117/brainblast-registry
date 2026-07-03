const contact = process.env.NEXT_PUBLIC_ACCESS_EMAIL || "contact@brainblast.tech";
const applyHref = `mailto:${contact}?subject=${encodeURIComponent("Brainblast — become a contributor")}&body=${encodeURIComponent(
  "I'd like to contribute VTIs to Brainblast.\n\nSDKs / protocols I work with:\nLink to my work (GitHub, etc.):\nRough volume I could contribute:\n"
)}`;

const WHY = [
  {
    c: "var(--emerald)",
    title: "Get paid when your traps get used",
    body: "Every buyer who trains or evaluates on a slice of the corpus routes a data dividend back to the contributors whose VTIs are in it. Prove a footgun once; earn from it every time it ships in someone's dataset.",
  },
  {
    c: "var(--cyan)",
    title: "It compounds",
    body: "A VTI isn't a one-off bug report — it's a permanent, versioned record. As the corpus grows more valuable, so does your share of it. The trap you submit today keeps earning as the market scales.",
  },
  {
    c: "var(--violet)",
    title: "You keep control",
    body: "Your submissions are licensed, not surrendered. You stamp the consent scope — train, eval, or both — and contributed data is kept physically separate from everything else. Nothing gets used outside what you allowed.",
  },
];

const REQUIREMENTS = [
  "A real SDK / protocol footgun — a way correct-looking code silently breaks.",
  "A minimal vulnerable snippet and the corrected fix, in TypeScript, Rust, or config.",
  "The pair must reproduce RED→GREEN: the trap's rule fails the vulnerable code and passes the fix.",
  "No secrets — keypairs, base58 secrets, or mnemonics reject the whole submission automatically.",
  "Pinned to the SDK name and version the trap actually applies to.",
];

const STEPS = [
  {
    n: "01",
    title: "Catch a trap",
    body: "Hit a footgun in your own work, or go hunting. Point the CLI at your code to capture the vulnerable → fixed pair, or scaffold a rule for the pattern.",
    code: ["npx brainblast .", "# or author a reusable rule:", "brainblast pack init ./my-pack --id my-sdk"],
  },
  {
    n: "02",
    title: "Prove it RED→GREEN",
    body: "Your pair has to earn its place. The same oracle the dataset and benchmark use runs the rule against both fixtures — it must FAIL the vulnerable code and PASS the fix. Non-reproducing submissions are rejected.",
    code: ["brainblast pack validate ./my-pack", "# vulnerable → RED   fixed → GREEN"],
  },
  {
    n: "03",
    title: "Submit through the gate",
    body: "Ingest runs three checks on every record: a secret scan (Keyguard), the RED→GREEN reproduction above, and a consent + license stamp with the scope you choose. Pass all three and it's accepted into the contributor lot.",
    code: ["consent: opt-in:train | eval | train+eval", "license: contributor-grant-v1"],
  },
  {
    n: "04",
    title: "Earn as it's used",
    body: "Accepted VTIs enter the pool buyers train and evaluate against. A $BRAIN stake bonds your submission — reproduction is the slashing trigger, so honest, reproducing work is all that survives — and data dividends settle to contributors as their traps get used.",
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
        <p style={{ fontSize: 16.5, color: "var(--ink-2)", margin: "18px auto 30px", maxWidth: 600, lineHeight: 1.6 }}>
          Every hard-won bug you turn into a proven VTI becomes a permanent, licensed record in the corpus — and earns a dividend every time a buyer trains or evaluates on it.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href={applyHref} style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 22px", borderRadius: 12, background: "var(--grad-brand)", color: "#03130c", fontSize: 14.5, fontWeight: 600 }}>Become a contributor</a>
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
          <h2 style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em", margin: 0 }}>From footgun to dividend</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {STEPS.map((s) => (
            <Card key={s.n} style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 22, padding: 28 }}>
              <div className="mono grad-text" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{s.n}</div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "var(--ink-2)", margin: 0, lineHeight: 1.6, maxWidth: 640 }}>{s.body}</p>
                {s.code && <Code lines={s.code} />}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Requirements + Payment, two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 40 }}>
        <Card>
          <h3 style={{ fontSize: 17, fontWeight: 600, margin: "0 0 4px" }}>What makes a valid VTI</h3>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 18px", lineHeight: 1.5 }}>Every submission has to clear this bar before the gate accepts it.</p>
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
          <h3 style={{ fontSize: 17, fontWeight: 600, margin: "0 0 4px" }}>How payment works</h3>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 18px", lineHeight: 1.5 }}>Aligned so only honest, reproducing work earns.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              ["Stake to submit", "A $BRAIN bond backs each submission. If it doesn't reproduce, the stake is slashed — spam and fabrication cost the sender, not the corpus."],
              ["Data dividend", "When buyers train or evaluate on a slice of the corpus, value routes to the contributors whose VTIs are in that slice — proportional to use."],
              ["Rule bounties", "Author a reusable rule and it earns from a bounty pool once it graduates — five distinct repos confirming its RED→GREEN fix in the wild."],
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
            The reproduction, secret-scan, and consent gate is live today. On-chain settlement of stakes and dividends is rolling out — we&apos;re onboarding founding contributors now.
          </p>
        </Card>
      </div>

      {/* CTA */}
      <div className="glass" style={{ borderRadius: "var(--radius-xl)", padding: "36px 32px", textAlign: "center", border: "1px solid rgba(52,211,153,0.3)" }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 10px" }}>Ready to contribute?</h2>
        <p style={{ fontSize: 14.5, color: "var(--ink-2)", margin: "0 auto 22px", maxWidth: 460, lineHeight: 1.6 }}>
          The CLI is already public — <span className="mono" style={{ color: "var(--ink)" }}>npx brainblast</span>. Tell us the SDKs you work with and we&apos;ll walk you through your first submission and onboard you as a founding contributor.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href={applyHref} style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 22px", borderRadius: 12, background: "var(--grad-brand)", color: "#03130c", fontSize: 14.5, fontWeight: 600 }}>Become a contributor</a>
          <a href="/docs" style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 22px", borderRadius: 12, background: "var(--glass-2)", color: "var(--ink)", fontSize: 14.5, fontWeight: 600, border: "1px solid var(--line-2)" }}>Read the docs</a>
        </div>
      </div>
    </div>
  );
}
