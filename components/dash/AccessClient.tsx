"use client";

import { useState } from "react";
import { LOTS, PACKAGES, monthlyOf, priceSelection, type LotName, type Pricing } from "../../lib/lots";
import CheckoutModal from "../CheckoutModal";

function usd(n: number) { return `$${n.toLocaleString()}`; }
// Set NEXT_PUBLIC_FORMSPREE_ENDPOINT to your Formspree form URL (https://formspree.io/f/xxxx).
const FORMSPREE = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT || "https://formspree.io/f/your-form-id";
const fieldStyle = { height: 40, borderRadius: 9, border: "1px solid var(--line-2)", background: "var(--glass-2)", color: "var(--ink)", fontSize: 14, padding: "0 12px", outline: "none", width: "100%" };
const labelStyle = { fontSize: 12.5, color: "var(--ink-2)", display: "flex", flexDirection: "column" as const, gap: 6 };

export default function AccessClient({ pricing }: { pricing: Pricing }) {
  const priceOf = (l: LotName) => pricing.lots.find((x) => x.lot === l)?.price ?? 0;
  const allSellable = pricing.lots.map((l) => l.lot);
  const [sel, setSel] = useState<Set<LotName>>(new Set());
  const [period, setPeriod] = useState<"yr" | "mo">("yr");
  const [showCheckout, setShowCheckout] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [sent, setSent] = useState<"idle" | "sending" | "done" | "error">("idle");
  const closeForm = () => { setShowForm(false); setSent("idle"); };
  async function submitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setSent("sending");
    try {
      const res = await fetch(FORMSPREE, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      setSent(res.ok ? "done" : "error");
    } catch { setSent("error"); }
  }

  const toggle = (l: LotName) => setSel((p) => { const n = new Set(p); n.has(l) ? n.delete(l) : n.add(l); return n; });
  const setLots = (lots: LotName[]) => setSel(new Set(lots));
  const clear = () => setSel(new Set());

  const selected = [...sel];
  // All math stays annual; monthly is a uniform ÷10 applied at display time.
  const disp = (n: number) => (period === "mo" ? monthlyOf(n) : n);
  const unit = period === "mo" ? "/mo" : "/yr";

  const bundles = [
    ...pricing.packages.map((p) => ({ key: p.key, name: p.name, lots: p.lots as LotName[], price: p.price })),
    { key: "scale", name: "Scale", lots: allSellable, price: pricing.scale },
  ];

  // Selection pricing lives in lib/lots.ts (priceSelection) — the SAME function
  // POST /api/purchases quotes with, so the displayed number is the charged one.
  const { total, applied, extras, isScale } = priceSelection(pricing, selected);
  const brainTotal = Math.round(total * 0.9);

  // Upsell: a single bundle that fully covers the selection AND beats the
  // current (already-discounted) total — suggest consolidating into it.
  const cheaperBundle = selected.length > 0
    ? bundles.filter((b) => selected.every((l) => b.lots.includes(l)) && b.price < total).sort((a, b) => a.price - b.price)[0]
    : undefined;

  const orderLabel = isScale ? "Scale (everything)"
    : applied.length ? `${applied.map((a) => a.name).join(" + ")}${extras.length ? ` + ${extras.length} lot${extras.length > 1 ? "s" : ""}` : ""}`
    : selected.length ? `${selected.length} lot${selected.length > 1 ? "s" : ""}` : "";
  const subOptions = ["Scale — everything", ...pricing.packages.map((p) => `${p.name} package`), ...allSellable.map((l) => LOTS[l].name), "Undecided / other"];
  const desiredDefault = isScale ? "Scale — everything"
    : applied.length === 1 && extras.length === 0 ? `${applied[0].name} package`
    : selected.length === 1 ? LOTS[selected[0]].name
    : "Undecided / other";
  const selectionSummary = `${orderLabel || "—"} · ${usd(disp(total))}${unit} (${period === "mo" ? "monthly" : "annual"}; ${selected.join(", ") || "no lots"})`;

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
          <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{usd(disp(price))}<span style={{ fontSize: 10.5, color: "var(--ink-4)", fontWeight: 400 }}>{unit}</span></span>
        </div>
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{tagline}</span>
      </button>
    );
  };

  return (
    <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500 }}>Configure your license</div>
        <span className="mono" style={{ fontSize: 11.5, color: "var(--emerald)", padding: "5px 11px", borderRadius: 999, border: "1px solid rgba(52,211,153,0.35)" }}>instant signed grant</span>
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 6px" }}>Pick your lots</h2>
      <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "0 0 24px", maxWidth: 520, lineHeight: 1.6 }}>
        License the slices that match your stack, take a package, or grab everything with Scale. Every paid lot ships full fixtures, the live delta, and zero holdback — pay in SOL, USDC, or $BRAIN and your signed grant is issued the moment the payment confirms.
      </p>

      {/* Billing period */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <div style={{ display: "inline-flex", padding: 3, borderRadius: 10, background: "var(--glass-2)", border: "1px solid var(--line)" }}>
          {([["mo", "Monthly"], ["yr", "Annual"]] as const).map(([p, lbl]) => (
            <button key={p} onClick={() => setPeriod(p)} style={{ padding: "6px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "none", background: period === p ? "var(--grad-brand)" : "transparent", color: period === p ? "#03130c" : "var(--ink-2)" }}>{lbl}</button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: period === "yr" ? "var(--emerald)" : "var(--ink-4)" }}>
          {period === "yr" ? "2 months free — ~17% off vs monthly" : "billed monthly · annual saves ~17%"}
        </span>
      </div>

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
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)", margin: "3px 0 0", lineHeight: 1.4 }}>{meta.blurb}</div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 4 }}>{l.count} VTIs · {l.patterns} patterns · {l.sdks} SDKs</div>
                  </div>
                  <span className="mono" style={{ fontSize: 14, color: on ? meta.accent : "var(--ink-2)" }}>{usd(disp(l.price))}<span style={{ fontSize: 10, color: "var(--ink-4)", fontWeight: 400 }}>{unit}</span></span>
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
            <div style={{ marginBottom: 4 }}>
              <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 16px", lineHeight: 1.55 }}>Pick a package or select lots to see your price.</p>
              <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-4)", marginBottom: 11 }}>Every license includes</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {[
                  "Full RED + GREEN fixtures and the proving test for every record",
                  "The live verified delta as the fleet finds more — zero holdback",
                  "A signed grant, issued instantly at checkout",
                  "Pay in SOL, USDC, or $BRAIN for 10% off",
                ].map((t) => (
                  <div key={t} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                    <span style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.45 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 26, fontWeight: 600, marginBottom: 2, letterSpacing: "-0.02em" }}>{usd(disp(total))}<span style={{ fontSize: 13, color: "var(--ink-4)", fontWeight: 400 }}> {unit}</span></div>
              <p style={{ fontSize: 12.5, color: "var(--emerald)", margin: "0 0 4px" }}>{usd(disp(brainTotal))} in $BRAIN (10% off)</p>
              <p style={{ fontSize: 11.5, color: "var(--ink-4)", margin: "0 0 12px" }}>{period === "mo" ? `billed monthly · ${usd(total)}/yr on annual` : `billed yearly · ${usd(monthlyOf(total))}/mo on monthly`}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                {selected.map((l) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                    <span style={{ color: "var(--ink-2)" }}>{LOTS[l].name}</span>
                    <span className="mono" style={{ color: "var(--ink-3)" }}>{usd(disp(priceOf(l)))}</span>
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
                    <span className="mono" style={{ color: "var(--emerald)" }}>−{usd(disp(a.save))}</span>
                  </div>
                ))}
              </div>
              {cheaperBundle && (
                <button onClick={() => setLots(cheaperBundle.lots)} style={{ width: "100%", fontSize: 12, color: "var(--amber)", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 10, padding: "9px 12px", marginBottom: 14, cursor: "pointer", lineHeight: 1.4 }}>
                  Take <strong>{cheaperBundle.name}</strong> for {usd(disp(cheaperBundle.price))} → save {usd(disp(total - cheaperBundle.price))}
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

          {selected.length ? (
            <>
              <button onClick={() => setShowCheckout(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 44, borderRadius: 12, background: "var(--grad-brand)", color: "#03130c", border: "none", fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}>
                Buy now
              </button>
              <button onClick={() => setShowForm(true)} style={{ width: "100%", marginTop: 8, height: 36, borderRadius: 10, background: "transparent", color: "var(--ink-3)", border: "none", fontSize: 12.5, cursor: "pointer" }}>
                or contact sales — invoicing, wires, custom terms
              </button>
            </>
          ) : (
            <a href="/browse" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 44, borderRadius: 12, background: "var(--glass-2)", color: "var(--ink)", border: "1px solid var(--line-2)", fontSize: 14.5, fontWeight: 600 }}>
              Browse the free tier
            </a>
          )}
          <p className="mono" style={{ fontSize: 10, color: "var(--ink-4)", margin: "10px 0 0", textAlign: "center", lineHeight: 1.5 }}>
            SOL · USDC · $BRAIN (10% off). Pay from your wallet; the signed grant is issued the moment the payment verifies on-chain.
          </p>
        </div>
      </div>

      {showCheckout && selected.length > 0 && (
        <CheckoutModal
          selection={selected}
          period={period}
          usdTotal={disp(total)}
          orderLabel={orderLabel}
          onClose={() => setShowCheckout(false)}
        />
      )}

      {showForm && (
        <div onClick={closeForm} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(4,4,10,0.66)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="glass" style={{ width: "100%", maxWidth: 460, borderRadius: 18, padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <h3 style={{ fontSize: 19, fontWeight: 600, margin: 0 }}>Contact sales</h3>
              <button onClick={closeForm} aria-label="Close" style={{ background: "transparent", border: "none", color: "var(--ink-3)", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            {sent === "done" ? (
              <div style={{ padding: "14px 0 4px", textAlign: "center" }}>
                <span style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(52,211,153,0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                </span>
                <h4 style={{ fontSize: 17, fontWeight: 600, margin: "0 0 8px" }}>Thank you!</h4>
                <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "0 auto 20px", maxWidth: 320, lineHeight: 1.55 }}>Keep an eye on your email. Someone will reach out to you soon!</p>
                <button onClick={closeForm} style={{ height: 42, padding: "0 24px", borderRadius: 11, border: "1px solid var(--line-2)", background: "var(--glass-2)", color: "var(--ink)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Close</button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 20px", lineHeight: 1.5 }}>Tell us what you need and we&apos;ll follow up with your signed grant. Access is opening soon.</p>
                <form onSubmit={submitForm} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <label style={labelStyle}>Full name<input name="name" required style={fieldStyle} /></label>
                  <label style={labelStyle}>Company <span style={{ color: "var(--ink-4)" }}>(optional)</span><input name="company" style={fieldStyle} /></label>
                  <label style={labelStyle}>Desired subscription
                    <select name="subscription" defaultValue={desiredDefault} style={fieldStyle}>
                      {subOptions.map((o) => <option key={o} value={o} style={{ background: "#0d0d16" }}>{o}</option>)}
                    </select>
                  </label>
                  <label style={labelStyle}>Contact email<input name="email" type="email" required style={fieldStyle} /></label>
                  <input type="hidden" name="selection" value={selectionSummary} />
                  <input type="hidden" name="_subject" value="New Brainblast access inquiry" />
                  {sent === "error" && <p style={{ fontSize: 12, color: "var(--rose)", margin: 0 }}>Something went wrong — please try again, or email access@brainblast.tech.</p>}
                  <button type="submit" disabled={sent === "sending"} style={{ marginTop: 4, height: 44, borderRadius: 12, border: "none", background: "var(--grad-brand)", color: "#03130c", fontSize: 14.5, fontWeight: 600, cursor: sent === "sending" ? "default" : "pointer", opacity: sent === "sending" ? 0.7 : 1 }}>{sent === "sending" ? "Sending…" : "Send"}</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
