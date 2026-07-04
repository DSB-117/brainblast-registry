"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import StakePayment, { type StakeInfo } from "./StakePayment";
import { TOKENS, BRAIN_DISCOUNT, type TokenSymbol } from "../lib/tokens";
import { fetchUsdPrices } from "../lib/price";

export interface BondableVtiOption {
  trapId: string;
  sdk: string;
  class: string;
  severity: string;
  corroborationCount: number;
  score: number;
}

export default function StakeSection({ vtis }: { vtis: BondableVtiOption[] }) {
  const { publicKey } = useWallet();

  const [trapId, setTrapId] = useState(vtis[0]?.trapId ?? "");
  const [amountUsd, setAmountUsd] = useState("25");
  const [token, setToken] = useState<TokenSymbol>("BRAIN");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stake, setStake] = useState<StakeInfo | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [priceError, setPriceError] = useState("");

  const selected = useMemo(() => vtis.find((v) => v.trapId === trapId) ?? null, [vtis, trapId]);

  // Live USD price for the selected token, so the form can show roughly how much
  // the user is about to commit before they pay.
  useEffect(() => {
    let cancelled = false;
    setPrice(null);
    setPriceError("");
    fetchUsdPrices([TOKENS[token].priceMint])
      .then((prices) => {
        if (cancelled) return;
        const p = prices[TOKENS[token].priceMint];
        if (!p) return setPriceError("Live price unavailable.");
        setPrice(p);
      })
      .catch(() => {
        if (!cancelled) setPriceError("Live price lookup failed.");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const usdOwed = useMemo(() => {
    const usd = Number(amountUsd);
    if (!usd || usd <= 0) return null;
    return token === "BRAIN" ? usd * (1 - BRAIN_DISCOUNT) : usd;
  }, [amountUsd, token]);

  const estimatedAmount = useMemo(() => {
    if (!price || price <= 0 || usdOwed === null) return null;
    return usdOwed / price;
  }, [price, usdOwed]);

  async function register() {
    if (!publicKey) return;
    if (!trapId.trim()) {
      setError("Pick a VTI to bond behind.");
      return;
    }
    const usd = Number(amountUsd);
    if (!usd || usd <= 0) {
      setError("Bond amount must be a positive number.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/stakes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          trap_id: trapId.trim(),
          bonder_wallet: publicKey.toBase58(),
          amount_usd: usd,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `request failed (${res.status})`);
      setStake({
        memo_code: data.memo_code,
        trap_id: trapId.trim(),
        stake_usd: usd,
        status: "pending_payment",
        pay_to: data.pay_to,
      });
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card glass submission-card">
      <div className="card-header">
        <h3>{stake ? "Step 2 — pay your bond" : "Bond behind a VTI"}</h3>
      </div>

      {!publicKey && (
        <p className="muted">
          Connect a wallet (top left) to bond behind a proven VTI in SOL, USDC, or $BRAIN (10% off).
          Optional — never required to contribute. The bond amplifies your dividend share and is
          slashed if the VTI ever stops reproducing.
        </p>
      )}

      {publicKey && !stake && vtis.length === 0 && (
        <p className="muted">No proven VTIs in the corpus yet — nothing to bond behind.</p>
      )}

      {publicKey && !stake && vtis.length > 0 && (
        <div className="form-grid form-grid-wide">
          <label>
            VTI
            <select value={trapId} onChange={(e) => setTrapId(e.target.value)}>
              {vtis.map((v) => (
                <option key={v.trapId} value={v.trapId}>
                  {v.trapId} — {v.severity} · score {v.score}
                </option>
              ))}
            </select>
          </label>
          {selected && (
            <p className="field-hint" style={{ margin: 0 }}>
              {selected.sdk} · {selected.class} · corroborated across {selected.corroborationCount}{" "}
              repo{selected.corroborationCount === 1 ? "" : "s"} · dividend weight{" "}
              <strong style={{ color: "var(--ink)" }}>{selected.score}</strong>/100.
            </p>
          )}
          <div className="row-2">
            <label>
              Pay with
              <select value={token} onChange={(e) => setToken(e.target.value as TokenSymbol)}>
                {Object.keys(TOKENS).map((sym) => (
                  <option key={sym} value={sym}>
                    {TOKENS[sym as TokenSymbol].symbol}
                    {sym === "BRAIN" ? " (10% off)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Bond amount (USD)
              <input
                type="number"
                min="0"
                step="any"
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
              />
            </label>
          </div>
          <p className="field-hint" style={{ margin: 0 }}>
            The amount is your confidence signal — it amplifies your dividend share, and the
            reproduction gate slashes it if the VTI ever stops reproducing. On-chain settlement of
            dividends is rolling out.
          </p>
          {usdOwed !== null && (
            <p className={token === "BRAIN" ? "token-discount" : "muted"} style={{ margin: 0 }}>
              {token === "BRAIN" && <>You&apos;ll owe ~10% less than the ${amountUsd || "0"} USD bond — </>}
              {estimatedAmount !== null ? (
                <>
                  ≈ {estimatedAmount.toFixed(estimatedAmount < 1 ? 6 : 2)} {TOKENS[token].symbol} at
                  today&apos;s price (~${usdOwed.toFixed(2)}).
                </>
              ) : priceError ? (
                priceError
              ) : (
                "Fetching live price…"
              )}
            </p>
          )}
          <button className="button button-primary" onClick={register} disabled={busy}>
            {busy ? "Registering…" : "Register & bond"}
          </button>
          {error && <p className="status-line error">{error}</p>}
        </div>
      )}

      {stake && (
        <>
          <p className="muted" style={{ marginBottom: 16 }}>
            Bond registered — memo code <span className="code-pill">{stake.memo_code}</span>
          </p>
          <StakePayment stake={stake} initialToken={token} />
        </>
      )}
    </div>
  );
}
