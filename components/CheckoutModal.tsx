"use client";

// Self-serve checkout: quote → wallet payment (SOL / USDC / $BRAIN) → instant
// on-chain verification → signed grant, all in one modal. The staged progress
// list doubles as the loading screen — each step lights up as the payment
// moves from the wallet to the chain to the verifier.

import { useEffect, useMemo, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, TransactionInstruction, SystemProgram } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getMint,
} from "@solana/spl-token";
import { TOKENS, BRAIN_DISCOUNT, type TokenSymbol } from "../lib/tokens";
import { LOTS, type LotName } from "../lib/lots";
import WalletButton from "./WalletButton";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

interface QuotedPurchase {
  memo_code: string;
  lots: LotName[];
  tier: "standard" | "firehose";
  period: "mo" | "yr";
  usd_total: number;
  token: TokenSymbol;
  token_mint: string | null;
  token_amount_due: number;
  token_usd_price: number;
  pay_to: string;
  status: string;
  quote_expires_at: string;
  grant?: unknown;
  grant_expires_at?: string | null;
}

type Phase =
  | { k: "pick" } // choose token, connect wallet
  | { k: "quoting" }
  | { k: "quoted"; p: QuotedPurchase; claim: string }
  | { k: "paying"; p: QuotedPurchase; claim: string; step: PayStep; sig?: string; note?: string }
  | { k: "granted"; p: QuotedPurchase; claim: string }
  | { k: "error"; msg: string; p?: QuotedPurchase; claim?: string; shortfall?: number };

type PayStep = "build" | "sign" | "confirm" | "verify";
const PAY_STEPS: { key: PayStep; label: string; sub: string }[] = [
  { key: "build", label: "Building transaction", sub: "transfer + memo, nothing else" },
  { key: "sign", label: "Awaiting your signature", sub: "approve in your wallet" },
  { key: "confirm", label: "Confirming on Solana", sub: "waiting for the network" },
  { key: "verify", label: "Verifying & issuing grant", sub: "amount, memo, treasury — then signed" },
];

function fmtToken(n: number, t: TokenSymbol) {
  if (t === "USDC") return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (t === "SOL") return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return Math.ceil(n).toLocaleString();
}
const usd = (n: number) => `$${n.toLocaleString()}`;

export default function CheckoutModal({
  selection,
  period,
  usdTotal,
  orderLabel,
  onClose,
}: {
  selection: LotName[];
  period: "mo" | "yr";
  usdTotal: number; // display only — the server recomputes and is authoritative
  orderLabel: string;
  onClose: () => void;
}) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [token, setToken] = useState<TokenSymbol>("BRAIN");
  const [phase, setPhase] = useState<Phase>({ k: "pick" });
  const grantUrlRef = useRef<string | null>(null);

  useEffect(() => () => { if (grantUrlRef.current) URL.revokeObjectURL(grantUrlRef.current); }, []);

  const brainUsd = Math.round(usdTotal * (1 - BRAIN_DISCOUNT));
  const unit = period === "mo" ? "/mo" : "/yr";

  async function getQuote() {
    if (!publicKey) return;
    setPhase({ k: "quoting" });
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lots: selection, period, token, buyer_wallet: publicKey.toBase58() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? `quote failed (${res.status})`);
      setPhase({ k: "quoted", p: json.purchase, claim: json.claim_secret });
    } catch (e: any) {
      setPhase({ k: "error", msg: e?.message ?? String(e) });
    }
  }

  async function pay(p: QuotedPurchase, claim: string, amountOverride?: number) {
    if (!publicKey) return;
    const amount = amountOverride ?? p.token_amount_due;
    try {
      setPhase({ k: "paying", p, claim, step: "build" });
      const tx = new Transaction();
      const payTo = new PublicKey(p.pay_to);

      if (p.token_mint === null) {
        tx.add(SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: payTo, lamports: Math.ceil(amount * 1e9) }));
      } else {
        const mint = new PublicKey(p.token_mint);
        const mintInfo = await getMint(connection, mint);
        const rawAmount = BigInt(Math.ceil(amount * 10 ** mintInfo.decimals));
        const fromAta = await getAssociatedTokenAddress(mint, publicKey);
        const toAta = await getAssociatedTokenAddress(mint, payTo);
        try {
          await getAccount(connection, toAta);
        } catch {
          tx.add(createAssociatedTokenAccountInstruction(publicKey, toAta, payTo, mint));
        }
        tx.add(createTransferInstruction(fromAta, toAta, publicKey, rawAmount));
      }
      // The memo is how the verifier ties this payment to this quote.
      tx.add(new TransactionInstruction({ keys: [], programId: MEMO_PROGRAM_ID, data: Buffer.from(p.memo_code, "utf8") }));

      setPhase({ k: "paying", p, claim, step: "sign" });
      const sig = await sendTransaction(tx, connection);

      setPhase({ k: "paying", p, claim, step: "confirm", sig });
      await connection.confirmTransaction(sig, "confirmed");

      setPhase({ k: "paying", p, claim, step: "verify", sig });
      // The RPC the verifier reads can lag the one that confirmed — retry a few
      // times before declaring the payment missing.
      let lastErr = "";
      for (let attempt = 0; attempt < 5; attempt++) {
        const res = await fetch("/api/purchases/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ memo_code: p.memo_code, claim_secret: claim, tx_signature: sig }),
        });
        const json = await res.json();
        if (res.ok) {
          setPhase({ k: "granted", p: json.purchase, claim });
          return;
        }
        if (res.status === 402 && json?.shortfall !== undefined) {
          setPhase({ k: "error", msg: json.error, p, claim, shortfall: json.shortfall });
          return;
        }
        lastErr = json?.error ?? `verify failed (${res.status})`;
        if (res.status !== 402) break; // only "not found yet" is worth retrying
        await new Promise((r) => setTimeout(r, 2500));
      }
      setPhase({ k: "error", msg: `${lastErr} — your payment is safe; use "Verify again" with the same quote.`, p, claim });
    } catch (e: any) {
      setPhase({ k: "error", msg: e?.message ?? String(e), p, claim });
    }
  }

  function downloadGrant(p: QuotedPurchase) {
    if (grantUrlRef.current) URL.revokeObjectURL(grantUrlRef.current);
    const url = URL.createObjectURL(new Blob([JSON.stringify(p.grant, null, 2)], { type: "application/json" }));
    grantUrlRef.current = url;
    const a = document.createElement("a");
    a.href = url;
    a.download = `brainblast-grant-${p.memo_code}.json`;
    a.click();
  }

  const stepIndex = phase.k === "paying" ? PAY_STEPS.findIndex((s) => s.key === phase.step) : -1;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(4,4,10,0.66)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="glass" style={{ width: "100%", maxWidth: 480, borderRadius: 18, padding: 28, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <h3 style={{ fontSize: 19, fontWeight: 600, margin: 0 }}>
            {phase.k === "granted" ? "License issued" : "Checkout"}
          </h3>
          <button onClick={onClose} aria-label="Close" style={{ background: "transparent", border: "none", color: "var(--ink-3)", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
        </div>
        <p className="mono" style={{ fontSize: 11.5, color: "var(--ink-4)", margin: "0 0 18px" }}>
          {orderLabel} · {usd(usdTotal)}{unit}
        </p>

        {/* ── Step 1: pick token + connect ── */}
        {phase.k === "pick" && (
          <>
            <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginBottom: 10 }}>Pay with</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
              {(Object.keys(TOKENS) as TokenSymbol[]).map((sym) => {
                const on = token === sym;
                return (
                  <button key={sym} onClick={() => setToken(sym)}
                    style={{ padding: "12px 10px", borderRadius: 12, cursor: "pointer", textAlign: "center", border: `1px solid ${on ? "var(--emerald)" : "var(--line)"}`, background: on ? "rgba(52,211,153,0.1)" : "var(--glass-2)" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{TOKENS[sym].symbol}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: sym === "BRAIN" ? "var(--emerald)" : "var(--ink-4)" }}>
                      {sym === "BRAIN" ? "10% off" : "full price"}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "12px 14px", borderRadius: 12, background: "var(--glass-2)", border: "1px solid var(--line)", marginBottom: 18 }}>
              <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>You&apos;ll pay</span>
              <span>
                <span className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{usd(token === "BRAIN" ? brainUsd : usdTotal)}</span>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}> in {TOKENS[token].symbol}{unit}</span>
              </span>
            </div>
            {!publicKey ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <WalletButton />
                <p style={{ fontSize: 12, color: "var(--ink-4)", margin: 0 }}>Connect a wallet to continue.</p>
              </div>
            ) : (
              <button onClick={getQuote} style={{ width: "100%", height: 46, borderRadius: 12, border: "none", background: "var(--grad-brand)", color: "#03130c", fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}>
                Get quote
              </button>
            )}
            <p className="mono" style={{ fontSize: 10, color: "var(--ink-4)", margin: "12px 0 0", textAlign: "center", lineHeight: 1.6 }}>
              The exact token amount is fixed at live prices when you quote.
            </p>
          </>
        )}

        {/* ── Quoting spinner ── */}
        {phase.k === "quoting" && (
          <div style={{ textAlign: "center", padding: "28px 0 20px" }}>
            <span className="spin" style={{ width: 26, height: 26, border: "2px solid var(--line-2)", borderTopColor: "var(--emerald)", borderRadius: "50%", display: "inline-block", marginBottom: 14 }} />
            <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: 0 }}>Pricing your license from the live corpus…</p>
          </div>
        )}

        {/* ── Step 2: quoted — pay ── */}
        {phase.k === "quoted" && (
          <>
            <div style={{ borderRadius: 12, border: "1px solid var(--line)", background: "var(--glass-2)", padding: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Send exactly</span>
                <span className="mono" style={{ fontSize: 15, fontWeight: 600, color: "var(--emerald)" }}>
                  {fmtToken(phase.p.token_amount_due, phase.p.token)} {TOKENS[phase.p.token].symbol}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Memo</span>
                <span className="code-pill mono" style={{ fontSize: 11.5 }}>{phase.p.memo_code}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Quote locked for</span>
                <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-2)" }}>45 minutes</span>
              </div>
            </div>
            <button onClick={() => pay(phase.p, phase.claim)} style={{ width: "100%", height: 46, borderRadius: 12, border: "none", background: "var(--grad-brand)", color: "#03130c", fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}>
              Pay {fmtToken(phase.p.token_amount_due, phase.p.token)} {TOKENS[phase.p.token].symbol}
            </button>
            <p className="mono" style={{ fontSize: 10, color: "var(--ink-4)", margin: "12px 0 0", textAlign: "center", lineHeight: 1.6 }}>
              One transaction: transfer + memo. Your key never leaves the wallet.
            </p>
          </>
        )}

        {/* ── Paying — the staged loading screen ── */}
        {phase.k === "paying" && (
          <div style={{ padding: "6px 0" }}>
            {PAY_STEPS.map((s, i) => {
              const state = i < stepIndex ? "done" : i === stepIndex ? "active" : "todo";
              return (
                <div key={s.key} style={{ display: "flex", gap: 13, alignItems: "flex-start", padding: "10px 0", opacity: state === "todo" ? 0.38 : 1 }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: state === "done" ? "var(--emerald)" : "transparent", border: state === "done" ? "none" : `2px solid ${state === "active" ? "var(--emerald)" : "var(--line-2)"}` }}
                    className={state === "active" ? "spin-border" : undefined}>
                    {state === "done" && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#03130c" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>}
                    {state === "active" && <span className="spin" style={{ width: 10, height: 10, border: "2px solid transparent", borderTopColor: "var(--emerald)", borderRadius: "50%", display: "inline-block" }} />}
                  </span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: state === "active" ? 600 : 500 }}>{s.label}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 2 }}>{s.sub}</div>
                  </div>
                </div>
              );
            })}
            {phase.sig && (
              <p className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)", margin: "10px 0 0", wordBreak: "break-all" }}>
                tx: <a href={`https://solscan.io/tx/${phase.sig}`} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>{phase.sig.slice(0, 20)}…</a>
              </p>
            )}
          </div>
        )}

        {/* ── Granted ── */}
        {phase.k === "granted" && (
          <>
            <div style={{ textAlign: "center", margin: "6px 0 18px" }}>
              <span style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(52,211,153,0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
              </span>
              <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: 0, lineHeight: 1.55 }}>
                Payment verified on-chain. Your signed grant is live — the feed accepts it right now
                {phase.p.grant_expires_at ? ` until ${new Date(phase.p.grant_expires_at).toLocaleDateString()}` : ""}.
              </p>
            </div>
            <button onClick={() => downloadGrant(phase.p)} style={{ width: "100%", height: 46, borderRadius: 12, border: "none", background: "var(--grad-brand)", color: "#03130c", fontSize: 14.5, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>
              Download grant.json
            </button>
            <div style={{ marginBottom: 12 }}>
              <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", marginBottom: 7 }}>pull your entitled data</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--emerald)", background: "rgba(0,0,0,0.4)", border: "1px solid var(--line)", borderRadius: 9, padding: "10px 12px", lineHeight: 1.7, overflowX: "auto" }}>
                brainblast feed \<br />&nbsp;&nbsp;--remote registry.brainblast.tech \<br />&nbsp;&nbsp;--grant ./grant.json
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--amber)", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 10, padding: "10px 12px", lineHeight: 1.55 }}>
              <span className="mono">claim secret · {phase.claim}</span>
              <br />Save it — it re-downloads this grant if you lose the file, and it&apos;s shown only here.
              Your licenses also stay attached to your wallet on the access page.
            </div>
          </>
        )}

        {/* ── Error / underpaid ── */}
        {phase.k === "error" && (
          <>
            <p className="status-line error" style={{ lineHeight: 1.55 }}>{phase.msg}</p>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              {phase.p && phase.claim && phase.shortfall !== undefined && (
                <button onClick={() => pay(phase.p!, phase.claim!, phase.shortfall)} style={{ flex: 1, height: 44, borderRadius: 12, border: "none", background: "var(--grad-brand)", color: "#03130c", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Send the difference
                </button>
              )}
              {phase.p && phase.claim && phase.shortfall === undefined && (
                <button onClick={() => setPhase({ k: "quoted", p: phase.p!, claim: phase.claim! })} style={{ flex: 1, height: 44, borderRadius: 12, border: "none", background: "var(--grad-brand)", color: "#03130c", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Back to quote
                </button>
              )}
              <button onClick={() => setPhase({ k: "pick" })} style={{ flex: 1, height: 44, borderRadius: 12, border: "1px solid var(--line-2)", background: "var(--glass-2)", color: "var(--ink)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Start over
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
