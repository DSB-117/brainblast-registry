"use client";

import { useEffect, useState } from "react";

const NAV = [
  { group: "Start here", items: [["overview", "Overview"], ["vtis", "What's a VTI"], ["proof", "How it's proven"]] },
  { group: "Use it", items: [["subscriptions", "Subscriptions"], ["integrate", "Integrate"], ["feed", "The feed & grant"]] },
  { group: "Contribute", items: [["submissions", "Submissions"], ["earn", "Earn"]] },
] as const;

function Code({ lines }: { lines: string[] }) {
  return (
    <pre className="mono" style={{ margin: "14px 0 0", padding: "14px 16px", borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid var(--line)", fontSize: 12.5, lineHeight: 1.75, color: "var(--ink-2)", overflowX: "auto" }}>
      {lines.map((l, i) => (
        <div key={i} style={{ whiteSpace: "pre", color: l.trimStart().startsWith("#") || l.trimStart().startsWith("//") ? "var(--ink-4)" : "var(--ink-2)" }}>{l}</div>
      ))}
    </pre>
  );
}

function Section({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ scrollMarginTop: 88, marginBottom: 56 }}>
      <div style={{ fontSize: 12.5, color: "var(--emerald)", fontWeight: 500, marginBottom: 8 }}>{kicker}</div>
      <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.025em", margin: "0 0 16px" }}>{title}</h2>
      {children}
    </section>
  );
}

const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.7, margin: "0 0 14px", maxWidth: 680 }}>{children}</p>
);
const K = ({ children }: { children: React.ReactNode }) => (
  <span className="mono" style={{ fontSize: "0.9em", color: "var(--ink)", background: "var(--glass-2)", padding: "1px 6px", borderRadius: 5 }}>{children}</span>
);
const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} style={{ color: "var(--emerald)", fontWeight: 500 }}>{children}</a>
);

function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "4px 0 14px" }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start", fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: 680 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--emerald)", flexShrink: 0, marginTop: 7 }} />
          <span>{it}</span>
        </div>
      ))}
    </div>
  );
}

export default function DocsClient() {
  const [active, setActive] = useState("overview");

  useEffect(() => {
    const ids = NAV.flatMap((g) => g.items.map(([id]) => id));
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-84px 0px -68% 0px" },
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "64px 28px 40px", animation: "fade 0.4s ease" }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 12 }}>Docs</div>
        <h1 style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.035em", margin: 0 }}>How Brainblast works</h1>
        <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "14px 0 0", maxWidth: 660, lineHeight: 1.6 }}>
          The unit of the corpus, how records are proven, how to license and pull them, and how to contribute traps and earn.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "196px 1fr", gap: 44, alignItems: "start" }}>
        {/* Sidebar */}
        <aside className="scrolly" style={{ position: "sticky", top: 84, maxHeight: "calc(100vh - 108px)", overflowY: "auto", overflowX: "hidden", paddingRight: 6 }}>
          {NAV.map((g) => (
            <div key={g.group} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-4)", marginBottom: 9 }}>{g.group}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {g.items.map(([id, label]) => (
                  <a key={id} href={`#${id}`}
                    style={{
                      fontSize: 13.5, padding: "5px 10px", borderRadius: 7, lineHeight: 1.3,
                      color: active === id ? "var(--ink)" : "var(--ink-3)",
                      background: active === id ? "var(--glass-2)" : "transparent",
                      borderLeft: `2px solid ${active === id ? "var(--emerald)" : "transparent"}`,
                    }}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Content */}
        <div>
          <Section id="overview" kicker="Start here" title="Overview">
            <P>Brainblast is an open corpus of <strong style={{ color: "var(--ink)" }}>machine-verified SDK footguns</strong> — the specific ways correct-looking integration code silently does the wrong thing. Each record is a <K>Verified Trap Instance</K>: failing code, the fix, and a test that proves the difference, pinned to the exact SDK version the bug lives in.</P>
            <P>Three things you can do with it:</P>
            <Bullets items={[
              <><strong style={{ color: "var(--ink)" }}>Read &amp; sample</strong> the whole catalog free — no signup. <A href="/browse">Browse</A>.</>,
              <><strong style={{ color: "var(--ink)" }}>License</strong> curated lots to train or evaluate models on real, proven fixes. <A href="/pricing">Pricing</A>.</>,
              <><strong style={{ color: "var(--ink)" }}>Contribute</strong> a trap and earn when your records are used. <A href="/earn">Earn</A>.</>,
            ]} />
          </Section>

          <Section id="vtis" kicker="The unit" title="What's a VTI">
            <P>A Verified Trap Instance is a single, machine-checked record of one SDK footgun. Every VTI carries:</P>
            <Bullets items={[
              <><strong style={{ color: "var(--ink)" }}>Component</strong> — the SDK and exact version the bug applies to.</>,
              <><strong style={{ color: "var(--ink)" }}>Class</strong> — one of nine error classes (auth-bypass, missing-slippage-guard, silent-zero-revenue, unconfirmed-state, missing-verification, unchecked-staleness, immutable-after-deploy, wrong-constant, other).</>,
              <><strong style={{ color: "var(--ink)" }}>RED fixture</strong> — a minimal repro that compiles, runs, and trips the footgun.</>,
              <><strong style={{ color: "var(--ink)" }}>GREEN fixture</strong> — the corrected code that does the same job the right way.</>,
              <><strong style={{ color: "var(--ink)" }}>The check</strong> — a vetted rule that FAILs RED and PASSes GREEN. The diff is the lesson.</>,
              <><strong style={{ color: "var(--ink)" }}>Provenance</strong> — a commit-pinned source and the verbatim line, so the trap is confirmed real.</>,
              <><strong style={{ color: "var(--ink)" }}>Receipt &amp; corroboration</strong> — a re-runnable proof, plus how many independent repos exhibit it.</>,
            ]} />
            <P>Records are grouped into curated <strong style={{ color: "var(--ink)" }}>lots</strong> by ecosystem or domain (Solana, EVM, Auth &amp; Sessions, Transport/TLS, Web Hardening, Cloud &amp; Storage, Cryptography, Browser &amp; Desktop). <A href="/coverage">Coverage</A> shows the live class × lot surface.</P>
          </Section>

          <Section id="proof" kicker="Trust" title="How it's proven">
            <P>A VTI is a claim that&apos;s been mechanically proven and can be re-proven by anyone — no answer key. A <strong style={{ color: "var(--ink)" }}>generalized oracle</strong> proves each record with the cheapest backend that can: a static AST checker, a compiler type-check against the pinned SDK, a sandboxed executed test, or a differential input→output table.</P>
            <P>Contributed records also clear a <strong style={{ color: "var(--ink)" }}>fail-closed funnel</strong> — secret scan, RED→GREEN reproduction (the anti-poisoning gate), and consent/license — in order. Any rejection stops the record. Re-prove any pack yourself:</P>
            <Code lines={["# vulnerable → RED   fixed → GREEN", "npx brainblast verify ./pack"]} />
            <P><A href="/coverage">Coverage &amp; proof →</A> the full pipeline and the live reproduced rate.</P>
          </Section>

          <Section id="subscriptions" kicker="Use it" title="Subscriptions">
            <P>The catalog is open to read; you pay for the <strong style={{ color: "var(--ink)" }}>fixtures</strong> — the vulnerable+fixed code and tests you train on. Buy at three granularities:</P>
            <Bullets items={[
              <><strong style={{ color: "var(--ink)" }}>Lot</strong> — one ecosystem or security domain.</>,
              <><strong style={{ color: "var(--ink)" }}>Package</strong> — Web3 (both chains) or AppSec (every web, backend, cloud &amp; crypto lot), at a discount.</>,
              <><strong style={{ color: "var(--ink)" }}>Scale</strong> — every lot, plus every lot added later, plus the zero-holdback firehose.</>,
            ]} />
            <P>Lots are <strong style={{ color: "var(--ink)" }}>priced by coverage</strong> — distinct footgun patterns × SDKs × quality, not raw row count. Every license ships the full RED+GREEN fixtures and proving test, the live verified delta as the fleet finds more, and a signed grant. Bill <strong style={{ color: "var(--ink)" }}>monthly or annually</strong> — annual is the committed rate, ~17% off (2 months free) — and pay in USD or $BRAIN (10% off), which stacks on either. See <A href="/pricing">Pricing</A> and build a license on <A href="/access">Access</A>.</P>
          </Section>

          <Section id="integrate" kicker="Use it" title="Integrate">
            <P>Three ways to pull the corpus, one entitlement model behind all three.</P>
            <P><strong style={{ color: "var(--ink)" }}>CLI</strong> — stream your entitled delta as NDJSON:</P>
            <Code lines={["brainblast feed \\", "  --remote registry.brainblast.tech \\", "  --grant ./grant.json --since <cursor>"]} />
            <P><strong style={{ color: "var(--ink)" }}>MCP</strong> — wire the corpus into your agent so it recalls the verified record for an SDK before writing the integration:</P>
            <Code lines={['{ "mcpServers": {', '    "brainblast": {', '      "command": "npx",', '      "args": ["brainblast", "mcp"] } } }']} />
            <P><strong style={{ color: "var(--ink)" }}>REST</strong> — vendor-neutral HTTP:</P>
            <Code lines={["GET /api/catalog          # public", "GET /api/feed             # grant-gated", "GET /api/healthz          # liveness"]} />
            <P>Everything ships in one package — <K>npx brainblast</K> — built in CI with SLSA provenance. No install required.</P>
          </Section>

          <Section id="feed" kicker="Use it" title="The feed & grant">
            <P>Paid access is a signed <strong style={{ color: "var(--ink)" }}>grant</strong> you pass in the <K>x-brainblast-grant</K> header (or <K>--grant</K>). It&apos;s verified server-side with only the distributor&apos;s public key — vendor-neutral, no phone-home.</P>
            <Bullets items={[
              <><strong style={{ color: "var(--ink)" }}>free</strong> — a receipt-only sample of the public catalog, no fixtures.</>,
              <><strong style={{ color: "var(--ink)" }}>standard</strong> — the lots your grant names, full fixtures.</>,
              <><strong style={{ color: "var(--ink)" }}>firehose (Scale)</strong> — every record, zero freshness holdback.</>,
            ]} />
            <P>Lower tiers get a freshness holdback; the newest records land in higher tiers first. The feed streams oldest-first and returns a <K>cursor</K> — pass it as <K>--since</K> to resume without re-pulling.</P>
          </Section>

          <Section id="submissions" kicker="Contribute" title="Submissions">
            <P>Contribution is open and permissionless — no application, no reviewer. If your submission clears the automated gate, it&apos;s in. Four steps:</P>
            <Code lines={[
              "# 1. author + prove locally (RED→GREEN must hold)",
              "brainblast pack init ./my-pack --id my-sdk",
              "brainblast pack validate ./my-pack",
              "",
              "# 2. submit — no PR, no branch",
              "brainblast submit:vti --candidate ./my-trap.json --dry-run   # check first",
              "brainblast submit:vti --candidate ./my-trap.json",
            ]} />
            <P>A valid submission needs a real bug, a minimal RED+GREEN pair that reproduces, a <strong style={{ color: "var(--ink)" }}>commit-pinned</strong> source citation plus the verbatim vulnerable line, no secrets, and the pinned SDK + version. The server re-checks all of it end-to-end before recording. Full requirements on <A href="/earn">Earn</A>.</P>
          </Section>

          <Section id="earn" kicker="Contribute" title="Earn">
            <P>Confirmed findings become permanent VTIs, scored by <strong style={{ color: "var(--ink)" }}>severity × corroboration</strong>. Each period, a fixed share of license revenue — the contributor pool — is split by score: your cut is your records&apos; score over the corpus&apos;s. Paid on <strong style={{ color: "var(--ink)" }}>usage</strong>, not volume.</P>
            <P>$BRAIN is optional — you never need a token to contribute. You can bond $BRAIN on a VTI to signal confidence and amplify your share; the reproduction gate is the slash trigger, so a trap that ever stops reproducing forfeits its bond. Try the estimator on <A href="/earn">Earn</A>.</P>
          </Section>
        </div>
      </div>
    </div>
  );
}
