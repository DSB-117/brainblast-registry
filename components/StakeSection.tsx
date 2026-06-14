"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import StakePayment, { type StakeInfo } from "./StakePayment";

interface PackOption {
  pack_id: string;
  name: string;
}

export default function StakeSection({ packs }: { packs: PackOption[] }) {
  const { publicKey } = useWallet();

  const [packId, setPackId] = useState(packs[0]?.pack_id ?? "");
  const [ruleId, setRuleId] = useState("");
  const [stakeUsd, setStakeUsd] = useState("5");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stake, setStake] = useState<StakeInfo | null>(null);

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
    <div className="card">
      <div style={{ marginBottom: 16 }}>
        <WalletMultiButton />
      </div>

      {!publicKey && (
        <p className="muted">
          Connect a wallet to register a submission and pay your stake in SOL, USDC, or $BRAIN
          (10% discount).
        </p>
      )}

      {publicKey && !stake && (
        <div className="form-grid">
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
          <button className="button button-primary" onClick={register} disabled={busy}>
            {busy ? "Registering…" : "Register submission"}
          </button>
          {error && <p className="status-line error">{error}</p>}
        </div>
      )}

      {stake && (
        <>
          <h3 style={{ marginBottom: 8 }}>
            Submission registered — <span className="code-pill">{stake.memo_code}</span>
          </h3>
          <StakePayment stake={stake} />
        </>
      )}
    </div>
  );
}
