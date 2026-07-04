const WHY = [
  {
    c: "var(--emerald)",
    title: "Paid when your trap is used",
    body: "When labs license the corpus to evaluate and train models, value routes back to the contributors whose VTIs get used — weighted by corroboration × severity. You're paid for traps that catch real bugs in the wild, not for volume.",
  },
  {
    c: "var(--cyan)",
    title: "It compounds",
    body: "A proven trap isn't a one-off bug report — it becomes a permanent VTI in the corpus buyers train and evaluate against. As the fleet corroborates it across more repos, its score rises, and so does your share.",
  },
  {
    c: "var(--violet)",
    title: "Open and permissionless",
    body: "No application, no gatekeeper, no reviewer in the loop. If your submission clears the automated gate — RED→GREEN + secret scan + provenance — it's in. One command submits.",
  },
];

const REQUIREMENTS = [
  "A real SDK or protocol bug — a way correct-looking code silently breaks.",
  "A minimal vulnerable snippet and the corrected fix, in TypeScript, Rust, or config.",
  "The pair must reproduce RED→GREEN: the check fails the vulnerable code and passes the fix.",
  "A commit-pinned source citation + the verbatim vulnerable line, so provenance can confirm the trap is real.",
  "No secrets — keypairs, base58 secrets, or mnemonics reject the whole submission automatically.",
  "Pinned to the SDK name and version the bug actually applies to.",
];

const STEPS = [
  {
    n: "01",
    title: "Prove it RED→GREEN",
    body: "Author a candidate that catches the bug and prove it locally. The same oracle the dataset and benchmark use must FAIL your vulnerable fixture and PASS your fix. This is the gate — non-reproducing work never makes it in.",
    code: ["brainblast pack init ./my-pack --id my-sdk", "brainblast pack validate ./my-pack", "# vulnerable → RED   fixed → GREEN"],
  },
  {
    n: "02",
    title: "Cite the real source",
    body: "Point at the exact commit the bug lives in — owner/repo@<sha>:path — and include the verbatim vulnerable line as evidence. On submission the server fetches that file at that commit and confirms the line is really there. A mutable branch is rejected; an invented finding can't clear it. This is what replaces human review.",
    code: ['"provenance": {', '  "sourceRef": "owner/repo@<40-hex-sha>:path/to/file.ts",', '  "evidence": "skipPreflight: true"', "}"],
  },
  {
    n: "03",
    title: "Submit — no PR",
    body: "One command posts your candidate straight into the corpus. The server re-checks it end to end — RED→GREEN + secret scan + provenance — and only records what passes. No fork, no branch, no reviewer, no waiting. (A pull request works too, if you prefer.)",
    code: ["brainblast submit:vti --candidate ./my-trap.json", "brainblast submit:vti --candidate ./my-trap.json --dry-run   # check locally first"],
    cta: { label: "Contribute a trap", href: "/stake" },
  },
  {
    n: "04",
    title: "Earn on usage",
    body: "Your confirmed findings become VTIs in the corpus, scored by severity × corroboration. As it's licensed for training and evaluation, value routes back to the contributors whose records are used. Optionally bond $BRAIN on a VTI to signal confidence — it's slashed if the trap ever stops reproducing.",
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
          Get paid for the<br /><span className="grad-text">code errors you've already hit</span>
        </h1>
        <p style={{ fontSize: 16.5, color: "var(--ink-2)", margin: "18px auto 30px", maxWidth: 620, lineHeight: 1.6 }}>
          Turn a hard-won bug into a proven VTI — the vulnerable code, the fix, and a check that proves the difference. Prove it, cite the commit it lives in, and submit it in one command. Earn as labs license the corpus to train and evaluate on.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/stake" style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 22px", borderRadius: 12, background: "var(--grad-brand)", color: "#03130c", fontSize: 14.5, fontWeight: 600 }}>Contribute a trap</a>
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
          <h2 style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em", margin: 0 }}>From bug to corpus</h2>
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
              ["Data dividend", "Your confirmed findings become VTIs in the corpus, scored by severity × corroboration. As it's licensed for training and evaluation, value routes back to the contributors whose records are actually used — paid on usage, not volume."],
              ["$BRAIN is optional", "You never need a token to contribute. $BRAIN is an optional rail for buyers — pay in it for a standing 10% discount — and the access tiers price in $BRAIN held. USDC we take at full price is bought back into $BRAIN and routed to contributors."],
              ["Optional confidence bond", "Bond $BRAIN on a VTI you're sure of to signal confidence and amplify your share. The reproduction gate is the slash trigger — if the trap ever stops reproducing, the bond is slashed. Opt-in, never required to contribute."],
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
            Contribution, the RED→GREEN + provenance gate, the corpus, and the $BRAIN confidence bond (registration + slash-on-non-reproduction) are live today. The on-chain <em>payout</em> of the data dividend is the remaining operational step, rolling out.
          </p>
        </Card>
      </div>

      {/* CTA */}
      <div className="glass" style={{ borderRadius: "var(--radius-xl)", padding: "36px 32px", textAlign: "center", border: "1px solid rgba(52,211,153,0.3)" }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 10px" }}>Contribute your first trap</h2>
        <p style={{ fontSize: 14.5, color: "var(--ink-2)", margin: "0 auto 22px", maxWidth: 500, lineHeight: 1.6 }}>
          Participation is open — no application, no gatekeeper. Prove it RED→GREEN, cite the commit, and submit.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/stake" style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 22px", borderRadius: 12, background: "var(--grad-brand)", color: "#03130c", fontSize: 14.5, fontWeight: 600 }}>Contribute a trap</a>
          <a href="/docs" style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 22px", borderRadius: 12, background: "var(--glass-2)", color: "var(--ink)", fontSize: 14.5, fontWeight: 600, border: "1px solid var(--line-2)" }}>Read the docs</a>
        </div>
      </div>
    </div>
  );
}
