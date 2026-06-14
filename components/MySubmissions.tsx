"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

interface Submission {
  memo_code: string;
  pack_id: string;
  rule_id: string;
  stake_usd: number;
  status: string;
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

  const staked = (submissions ?? []).filter((s) => s.status === "staked" || s.status === "pending_payment");
  const graduated = (submissions ?? []).filter((s) => s.status === "graduated");

  const stakedTotal = staked.reduce((sum, s) => sum + Number(s.stake_usd), 0);
  const earningsTotal = graduated.reduce((sum, s) => sum + Number(s.stake_usd), 0);

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
          <p className="sidebar-stat-value">${stakedTotal.toFixed(2)}</p>
        </div>
        <div>
          <p className="sidebar-card-title">$BRAIN earnings</p>
          <p className="sidebar-stat-value">${earningsTotal.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
