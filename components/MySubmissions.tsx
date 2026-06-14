"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { TOKENS } from "../lib/tokens";

const BRAIN_MINT = TOKENS.BRAIN.mint;

interface Submission {
  memo_code: string;
  pack_id: string;
  rule_id: string;
  stake_usd: number;
  status: string;
  token_mint: string | null;
  token_amount: number | null;
}

export default function MySubmissions() {
  const { publicKey } = useWallet();
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setSubmissions(null);
      return;
    }
    let cancelled = false;

    fetch(`/api/stakes?author_wallet=${publicKey.toBase58()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSubmissions(data.stakes ?? []);
      })
      .catch(() => {
        if (!cancelled) setSubmissions([]);
      });

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  if (!publicKey) return null;

  const staked = (submissions ?? []).filter((s) => s.status === "staked");
  const graduated = (submissions ?? []).filter((s) => s.status === "graduated");
  const pending = (submissions ?? []).filter((s) => s.status === "pending_payment");

  const brainAmount = (s: Submission) => (s.token_mint === BRAIN_MINT ? Number(s.token_amount ?? 0) : 0);

  const stakedTotal = staked.reduce((sum, s) => sum + brainAmount(s), 0);
  const earningsTotal = graduated.reduce((sum, s) => sum + brainAmount(s), 0);
  const pendingTotal = pending.reduce((sum, s) => sum + Number(s.stake_usd), 0);

  return (
    <div className="card glass sidebar-card">
      <p className="sidebar-card-title">Packs you've submitted</p>

      {submissions === null && <p className="muted">Loading…</p>}
      {submissions?.length === 0 && <p className="muted">No submissions yet.</p>}

      {submissions && submissions.length > 0 && (
        <div className="submission-list">
          {submissions.slice(0, 5).map((s) => (
            <div className="submission-row" key={s.memo_code}>
              <div>
                <p className="submission-pack">{s.pack_id}</p>
                <p className="submission-rule">{s.rule_id}</p>
              </div>
              <span className={`code-pill status-${s.status}`}>{s.status}</span>
            </div>
          ))}
        </div>
      )}

      <div className="sidebar-stats">
        <div>
          <p className="sidebar-card-title">$BRAIN staked</p>
          <p className="sidebar-stat-value">
            {stakedTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="sidebar-card-title">$BRAIN earnings</p>
          <p className="sidebar-stat-value">
            {earningsTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      {pending.length > 0 && (
        <p className="muted" style={{ marginTop: 10 }}>
          {pending.length} submission{pending.length === 1 ? "" : "s"} awaiting payment (
          ${pendingTotal.toFixed(2)} USD pending — not yet counted as staked).
        </p>
      )}
    </div>
  );
}
