"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import StakePayment, { type StakeInfo } from "./StakePayment";
import { TOKENS, BRAIN_DISCOUNT, type TokenSymbol } from "../lib/tokens";
import { fetchUsdPrices } from "../lib/price";

interface PackOption {
  pack_id: string;
  name: string;
}

export default function StakeSection({ packs }: { packs: PackOption[] }) {
  const { publicKey } = useWallet();

  const [packId, setPackId] = useState(packs[0]?.pack_id ?? "");
  const [ruleId, setRuleId] = useState("");
  const [stakeUsd, setStakeUsd] = useState("5");
  const [token, setToken] = useState<TokenSymbol>("BRAIN");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stake, setStake] = useState<StakeInfo | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [priceError, setPriceError] = useState("");

  // Live USD price for the selected token, so the registration form can show
  // roughly how much the user is about to commit before they pay.
  useEffect(() => {
    let cancelled = false;
    setPrice(null);
    setPriceError("");

    fetchUsdPrices([TOKENS[token].priceMint])
      .then((prices) => {
        if (cancelled) return;
        const p = prices[TOKENS[token].priceMint];
        if (!p) {
          setPriceError("Live price unavailable.");
          return;
        }
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
    const usd = Number(stakeUsd);
    if (!usd || usd <= 0) return null;
    return token === "BRAIN" ? usd * (1 - BRAIN_DISCOUNT) : usd;
  }, [stakeUsd, token]);

  const estimatedAmount = useMemo(() => {
    if (!price || price <= 0 || usdOwed === null) return null;
    return usdOwed / price;
  }, [price, usdOwed]);

  async function register() {
    if (!publicKey) return;
    if (!packId.trim() || !ruleId.trim()) {
      setError("Pack ID and rule ID are required.");
      return;
    }
    const usd = Number(stakeUsd);
    if (!usd || usd <= 0) {
      setError("Stake amount must be a positive number.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/stakes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pack_id: packId.trim(),
          rule_id: ruleId.trim(),
          author_wallet: publicKey.toBase58(),
          stake_usd: usd,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? `request failed (${res.status})`);
      }
      setStake({
        memo_code: data.memo_code,
        pack_id: packId.trim(),
        rule_id: ruleId.trim(),
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
        <h3>{stake ? "Step 2 — pay your stake" : "Submit a knowledge pack"}</h3>
      </div>

      {!publicKey && (
        <p className="muted">
          Connect a wallet (top left) to register a submission and pay your stake in SOL, USDC,
          or $BRAIN (10% discount on the equivalent USD stake).
        </p>
      )}

      {publicKey && !stake && (
        <div className="form-grid form-grid-wide">
          <div className="row-2">
            <label>
              Pack ID
              <input
                value={packId}
                onChange={(e) => setPackId(e.target.value)}
                placeholder="e.g. spl-amount-scaling"
                list="pack-ids"
              />
              <datalist id="pack-ids">
                {packs.map((p) => (
                  <option key={p.pack_id} value={p.pack_id}>
                    {p.name}
                  </option>
                ))}
              </datalist>
            </label>
            <label>
              Rule ID
              <input
                value={ruleId}
                onChange={(e) => setRuleId(e.target.value)}
                placeholder="e.g. spl-token-amount-lamports-per-sol"
              />
            </label>
          </div>
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
              Stake amount (USD)
              <input
                type="number"
                min="0"
                step="any"
                value={stakeUsd}
                onChange={(e) => setStakeUsd(e.target.value)}
              />
            </label>
          </div>
          <p className="field-hint" style={{ margin: 0 }}>
            $5 suggested — covers indexer/gas costs and signals you'll maintain this rule. Stake
            more for higher visibility once your pack graduates.
          </p>
          {usdOwed !== null && (
            <p className={token === "BRAIN" ? "token-discount" : "muted"} style={{ margin: 0 }}>
              {token === "BRAIN" && (
                <>You'll owe ~10% less than the ${stakeUsd || "0"} USD stake — </>
              )}
              {estimatedAmount !== null ? (
                <>
                  ≈ {estimatedAmount.toFixed(estimatedAmount < 1 ? 6 : 2)} {TOKENS[token].symbol} at
                  today's price (~${usdOwed.toFixed(2)}).
                </>
              ) : priceError ? (
                priceError
              ) : (
                "Fetching live price…"
              )}
            </p>
          )}
          <button className="button button-primary" onClick={register} disabled={busy}>
            {busy ? "Registering…" : "Submit knowledge pack"}
          </button>
          {error && <p className="status-line error">{error}</p>}
        </div>
      )}

      {stake && (
        <>
          <p className="muted" style={{ marginBottom: 16 }}>
            Submission registered — memo code <span className="code-pill">{stake.memo_code}</span>
          </p>
          <StakePayment stake={stake} initialToken={token} />
        </>
      )}
    </div>
  );
}
