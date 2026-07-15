// Contributor-reward accrual (BRAIN-UTILITY.md function #3).
//
// Called when a VTI first proves RED→GREEN (markProofVerified flips it true). If
// the contributor attached a payout wallet at ingest, they accrue $BRAIN from a
// FIXED, CAPPED pool, weighted by WORK DELIVERED:
//   - establishing a NOVEL proven pattern → per_pattern_brain
//   - corroborating an already-proven pattern → per_corroboration_brain
// Never weighted by token price or sales. Idempotent (one accrual per trap_id).
// Best-effort: a reward failure never blocks the proof itself.

import { supabaseAdmin } from "./supabase";
import { patternKey } from "./lots";

const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export interface AccrualResult {
  accrued: boolean;
  reason?: "no-wallet" | "already-rewarded" | "pool-exhausted" | "no-pool" | "error" | string;
  amount?: number;
  kind?: "novel-pattern" | "corroboration";
}

// Accrue a reward for `trapId` whose stored `record` just became proof_verified.
// Pass the same supabase client the caller holds.
export async function accrueRewardOnProof(
  db: ReturnType<typeof supabaseAdmin>,
  trapId: string,
  record: Record<string, any>,
): Promise<AccrualResult> {
  const wallet = typeof record?.rewardWallet === "string" ? record.rewardWallet : null;
  if (!wallet || !SOLANA_ADDRESS_RE.test(wallet)) return { accrued: false, reason: "no-wallet" };

  // Idempotent: never accrue twice for the same VTI.
  const { data: existing } = await db.from("contributor_rewards").select("id").eq("trap_id", trapId).maybeSingle();
  if (existing) return { accrued: false, reason: "already-rewarded" };

  // Pool config + remaining budget (the cap). No pool row ⇒ rewards disabled.
  const { data: pool } = await db.from("reward_pool").select("*").eq("id", 1).maybeSingle();
  if (!pool) return { accrued: false, reason: "no-pool" };
  const remaining = Number(pool.total_budget_brain) - Number(pool.emitted_brain);
  if (remaining <= 0) return { accrued: false, reason: "pool-exhausted" };

  // Novel pattern vs corroboration — the work signal.
  const pk = patternKey(record);
  const { data: priorForPattern } = await db
    .from("contributor_rewards")
    .select("id")
    .eq("pattern_key", pk)
    .in("status", ["accrued", "paid"])
    .limit(1);
  const novel = !priorForPattern || priorForPattern.length === 0;
  const base = novel ? Number(pool.per_pattern_brain) : Number(pool.per_corroboration_brain);
  const amount = Math.min(base, remaining);
  if (amount <= 0) return { accrued: false, reason: "pool-exhausted" };

  const reason = novel ? "novel-pattern" : "corroboration";
  const { error: insErr } = await db.from("contributor_rewards").insert({
    trap_id: trapId, pattern_key: pk, wallet, amount_brain: amount, reason, status: "accrued",
  });
  if (insErr) {
    // Unique-violation ⇒ a concurrent accrual won; treat as already-rewarded.
    return { accrued: false, reason: insErr.message.includes("duplicate") ? "already-rewarded" : insErr.message };
  }

  // Advance the emission counter (the cap). Guarded so we never over-emit past budget.
  await db
    .from("reward_pool")
    .update({ emitted_brain: Number(pool.emitted_brain) + amount, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .lte("emitted_brain", Number(pool.total_budget_brain) - amount);

  return { accrued: true, amount, kind: reason };
}

// Operator view: rewards awaiting payout (grouped for a weekly batch, like refunds).
export async function listAccruedRewards(): Promise<
  { rows: any[]; totalBrain: number } | { error: string }
> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("contributor_rewards")
    .select("id, trap_id, pattern_key, wallet, amount_brain, reason, created_at")
    .eq("status", "accrued")
    .order("created_at", { ascending: true });
  if (error) return { error: error.message };
  const rows = data ?? [];
  return { rows, totalBrain: rows.reduce((s, r) => s + Number(r.amount_brain), 0) };
}

// Operator marks a reward paid after sending the on-chain $BRAIN transfer.
export async function markRewardPaid(id: number, txSignature: string): Promise<{ ok: boolean; reason?: string }> {
  const db = supabaseAdmin();
  const { error } = await db
    .from("contributor_rewards")
    .update({ status: "paid", tx_signature: txSignature, paid_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "accrued");
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}
