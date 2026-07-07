"use client";

import { useState } from "react";
import { LOTS, PACKAGES, type LotName, type Pricing } from "../../lib/lots";

function usd(n: number) { return `$${n.toLocaleString()}`; }
const contact = process.env.NEXT_PUBLIC_ACCESS_EMAIL || "access@brainblast.tech";

export default function AccessClient({ pricing }: { pricing: Pricing }) {
  const priceOf = (l: LotName) => pricing.lots.find((x) => x.lot === l)?.price ?? 0;
  const allSellable = pricing.lots.map((l) => l.lot);
  const [sel, setSel] = useState<Set<LotName>>(new Set());

  const toggle = (l: LotName) => setSel((p) => { const n = new Set(p); n.has(l) ? n.delete(l) : n.add(l); return n; });
  const setLots = (lots: LotName[]) => setSel(new Set(lots));
  const clear = () => setSel(new Set());

  const selected = [...sel];

  const bundles = [
    ...pricing.packages.map((p) => ({ key: p.key, name: p.name, lots: p.lots as LotName[], price: p.price })),
    { key: "scale", name: "Scale", lots: allSellable, price: pricing.scale },
  ];
  const isScale = selected.length > 0 && allSellable.every((l) => sel.has(l));

  // Price = apply every bundle whose lots are all selected (bundle lot-sets are
  // disjoint), largest-first so Scale wins when everything is picked, then add
  // the remaining lots at full à-la-carte price. This preserves a bundle's
  // discount when the buyer adds extra lots on top of it — the bug was that a
  // discount only applied on an EXACT bundle match, so one extra lot lost it.
  const applied: { name: string; save: number }[] = [];
  const covered = new Set<LotName>();
  let bundleTotal = 0;
  for (const b of [...bundles].sort((a, b) => b.lots.length - a.lots.length)) {
    if (b.lots.length >= 2 && b.lots.every((l) => sel.has(l) && !covered.has(l))) {
      const list = b.lots.reduce((s, l) => s + priceOf(l), 0);
      applied.push({ name: b.name, save: list - b.price });
      bundleTotal += b.price;
      b.lots.forEach((l) => covered.add(l));
    }
  }
  const extras = selected.filter((l) => !covered.has(l));
  const total = selected.length ? bundleTotal + extras.reduce((s, l) => s + priceOf(l), 0) : 0;
  const brainTotal = Math.round(total * 0.9);

  // Upsell: a single bundle that fully covers the selection AND beats the
  // current (already-discounted) total — suggest consolidating into it.
  const cheaperBundle = selected.length > 0
    ? bundles.filter((b) => selected.every((l) => b.lots.includes(l)) && b.price < total).sort((a, b) => a.price - b.price)[0]
    : undefined;

  const orderLabel = isScale ? "Scale (everything)"
    : applied.length ? `${applied.map((a) => a.name).join(" + ")}${extras.length ? ` + ${extras.length} lot${extras.length > 1 ? "s" : ""}` : ""}`
    : selected.length ? `${selected.length} lot${selected.length > 1 ? "s" : ""}` : "";
  const requestHref =
    `mailto:${contact}?subject=${encodeURIComponent(`Brainblast access — ${orderLabel || "license"}`)}` +
    `&body=${encodeURIComponent(
      `I'd like a license for:\n  ${orderLabel}\n  lots: ${selected.join(", ") || "(none selected)"}\n  price: ${usd(total)}/yr (or ${usd(brainTotal)} in $BRAIN)\n\nBuyer / org:\nIntended use (train / eval):\n`,
    )}`;

  const QuickPick = ({ name, accent, lots, price, tagline }: { name: string; accent: string; lots: LotName[]; price: number; tagline: string }) => {
    const active = lots.length === selected.length && lots.every((l) => sel.has(l));
    return (
      <button onClick={() => setLots(lots)} className={`glass lift ${active ? "lift-emerald" : ""}`}
        style={{ width: "100%", borderRadius: 14, padding: "14px 16px", textAlign: "left", cursor: "pointer", border: `1px solid ${active ? accent : "var(--line)"}`, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: accent, boxShadow: `0 0 8px ${accent}` }} />
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>{name}</span>
          </span>
          <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{usd(price)}</span>
        </div>
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{tagline}</span>
      </button>
    );
  };

  return (
    <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500 }}>Configure your license</div>
        <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)", padding: "5px 11px", borderRadius: 999, border: "1px solid var(--line)" }}>grant issued in ~1 day</span>
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 6px" }}>Pick your lots</h2>
      <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "0 0 24px", maxWidth: 520, lineHeight: 1.6 }}>
        License the slices that match your stack, take a package, or grab everything with Scale. Every paid lot ships full fixtures, the live delta, and zero holdback — we issue a signed grant.
      </p>

      {/* Quick-pick bundles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 22 }}>
        {pricing.packages.map((p) => (
          <QuickPick key={p.key} name={p.name} accent={p.accent} lots={p.lots as LotName[]} price={p.price}
            tagline={p.key === "web3" ? "Solana + EVM" : "All 6 web / infra lots"} />
        ))}
        <div style={{ gridColumn: "1 / -1" }}>
          <QuickPick name="Scale — everything" accent="#34d399" lots={allSellable} price={pricing.scale} tagline="Every lot + all future lots · best value" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28, alignItems: "start" }}>
        {/* À la carte lot picker */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Or build à la carte — priced by coverage</span>
            {selected.length > 0 && <button onClick={clear} className="mono" style={{ fontSize: 11, color: "var(--ink-3)", background: "transparent", border: "none", cursor: "pointer" }}>clear</button>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {pricing.lots.map((l) => {
              const meta = LOTS[l.lot];
              const on = sel.has(l.lot);
              return (
                <button key={l.lot} onClick={() => toggle(l.lot)}
                  style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 15px", borderRadius: 13, cursor: "pointer", textAlign: "left", border: `1px solid ${on ? meta.accent : "var(--line)"}`, background: on ? `${meta.accent}16` : "var(--glass-2)", transition: "all 0.12s" }}>
                  <span style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, border: `1.5px solid ${on ? meta.accent : "var(--line-2)"}`, background: on ? meta.accent : "transparent", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    {on && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#03130c" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{meta.name}</div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 2 }}>{l.count} VTIs · {l.patterns} patterns · {l.sdks} SDKs</div>
                  </div>
                  <span className="mono" style={{ fontSize: 14, color: on ? meta.accent : "var(--ink-2)" }}>{usd(l.price)}</span>
                </button>
              );
            })}
            {pricing.otherCount > 0 && (
              <div title="Uncategorized traps — SDKs that don't map to a curated lot. Not sold à la carte; delivered with Scale." style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 15px", borderRadius: 13, border: "1px dashed var(--line)", background: "var(--glass-2)", opacity: 0.6, cursor: "default" }}>
                <span style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, border: "1.5px solid var(--line-2)" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{LOTS.other.name}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 2 }}>{pricing.otherCount} VTIs · not sold à la carte</div>
                </div>
                <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-4)" }}>with Scale</span>
              </div>
            )}
          </div>
        </div>

        {/* Order summary */}
        <div style={{ borderRadius: 16, border: "1px solid var(--line)", background: "var(--glass-2)", padding: 20, position: "sticky", top: 84 }}>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 12, fontWeight: 500 }}>Your license</div>
          {selected.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 18px", lineHeight: 1.55 }}>Pick a package or select lots to see your price.</p>
          ) : (
            <>
              <div style={{ fontSize: 26, fontWeight: 600, marginBottom: 2, letterSpacing: "-0.02em" }}>{usd(total)}<span style={{ fontSize: 13, color: "var(--ink-4)", fontWeight: 400 }}> / yr</span></div>
              <p style={{ fontSize: 12.5, color: "var(--emerald)", margin: "0 0 12px" }}>{usd(brainTotal)} in $BRAIN (10% off)</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                {selected.map((l) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                    <span style={{ color: "var(--ink-2)" }}>{LOTS[l].name}</span>
                    <span className="mono" style={{ color: "var(--ink-3)" }}>{usd(priceOf(l))}</span>
                  </div>
                ))}
                {isScale && pricing.otherCount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                    <span style={{ color: "var(--ink-3)" }}>{LOTS.other.name} <span style={{ color: "var(--ink-4)" }}>({pricing.otherCount})</span></span>
                    <span className="mono" style={{ color: "var(--emerald)" }}>included</span>
                  </div>
                )}
                {applied.map((a, i) => (
                  <div key={a.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, paddingTop: 6, borderTop: i === 0 ? "1px solid var(--line)" : undefined }}>
                    <span style={{ color: "var(--ink-3)" }}>{a.name} bundle</span>
                    <span className="mono" style={{ color: "var(--emerald)" }}>−{usd(a.save)}</span>
                  </div>
                ))}
              </div>
              {cheaperBundle && (
                <button onClick={() => setLots(cheaperBundle.lots)} style={{ width: "100%", fontSize: 12, color: "var(--amber)", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 10, padding: "9px 12px", marginBottom: 14, cursor: "pointer", lineHeight: 1.4 }}>
                  Take <strong>{cheaperBundle.name}</strong> for {usd(cheaperBundle.price)} → save {usd(total - cheaperBundle.price)}
                </button>
              )}
            </>
          )}

          <div style={{ marginBottom: 14 }}>
            <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", marginBottom: 7 }}>pull your entitled delta</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--emerald)", background: "rgba(0,0,0,0.4)", border: "1px solid var(--line)", borderRadius: 9, padding: "10px 12px", lineHeight: 1.7, overflowX: "auto" }}>
              brainblast feed \<br />&nbsp;&nbsp;--remote registry.brainblast.tech \<br />&nbsp;&nbsp;--grant ./grant.json
            </div>
          </div>

          <a href={selected.length ? requestHref : "/browse"}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 44, borderRadius: 12, background: selected.length ? "var(--grad-brand)" : "var(--glass-2)", color: selected.length ? "#03130c" : "var(--ink)", border: selected.length ? "none" : "1px solid var(--line-2)", fontSize: 14.5, fontWeight: 600 }}>
            {selected.length ? "Request access" : "Browse the free tier"}
          </a>
          <p className="mono" style={{ fontSize: 10, color: "var(--ink-4)", margin: "10px 0 0", textAlign: "center", lineHeight: 1.5 }}>
            USD or $BRAIN. We issue your signed grant within a day. Self-serve on-chain settlement is rolling out.
          </p>
        </div>
      </div>
    </div>
  );
}
