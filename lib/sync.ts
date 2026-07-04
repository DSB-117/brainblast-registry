import { supabaseAdmin } from "./supabase";
import { fetchIncomingTransfers, BOUNTY_POOL_WALLET } from "./solana";
import { provenTrapIds } from "./corpusIndex";

interface PackIndexEntry {
  pack_id: string;
  name: string;
  repo_url: string;
  author?: string;
  description?: string;
  latest_version?: string;
}

// Refreshes the pack_registry table from the GitHub-based index
// (PACK_REGISTRY_INDEX_URL, defaults to DSB-117/brainblast-pack-registry).
export async function syncPackRegistry(): Promise<{ synced: number } | { error: string }> {
  const indexUrl =
    process.env.PACK_REGISTRY_INDEX_URL ??
    "https://raw.githubusercontent.com/DSB-117/brainblast-pack-registry/main/packs.json";

  const res = await fetch(indexUrl, { cache: "no-store" });
  if (!res.ok) {
    return { error: `failed to fetch pack index: ${res.status}` };
  }

  const entries = (await res.json()) as PackIndexEntry[];
  if (!Array.isArray(entries)) {
    return { error: "pack index is not an array" };
  }

  const db = supabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await db.from("pack_registry").upsert(
    entries.map((e) => ({
      pack_id: e.pack_id,
      name: e.name,
      repo_url: e.repo_url,
      author: e.author ?? null,
      description: e.description ?? null,
      latest_version: e.latest_version ?? null,
      synced_at: now,
    })),
  );

  if (error) {
    return { error: error.message };
  }
  return { synced: entries.length };
}

// Scans recent transactions to BOUNTY_POOL_WALLET for memo-tagged transfers
// and matches them against pending_payment stake_submissions by memo_code,
// flipping matches to 'staked'.
export async function syncStakes(): Promise<
  { matched: number; checked: number; slashed: number } | { error: string }
> {
  const db = supabaseAdmin();

  // 1. Confirm pending bonds: match an on-chain memo → 'staked' (active).
  const { data: pending, error } = await db
    .from("stake_submissions")
    .select("id, memo_code")
    .eq("status", "pending_payment");
  if (error) return { error: error.message };

  let matched = 0;
  let checked = 0;
  if (pending && pending.length > 0) {
    const byMemo = new Map(pending.map((p) => [p.memo_code, p.id] as const));
    let transfers;
    try {
      transfers = await fetchIncomingTransfers(BOUNTY_POOL_WALLET);
    } catch (e: any) {
      return { error: e.message ?? String(e) };
    }
    checked = transfers.length;
    for (const t of transfers) {
      const stakeId = byMemo.get(t.memo ?? "");
      if (stakeId === undefined) continue;
      const { error: updateError } = await db
        .from("stake_submissions")
        .update({
          status: "staked",
          tx_signature: t.signature,
          token_mint: t.mint,
          token_amount: t.mint ? t.amount : t.amount / 1e9, // lamports -> SOL for native
          updated_at: new Date().toISOString(),
        })
        .eq("id", stakeId)
        .eq("status", "pending_payment");
      if (!updateError) matched++;
    }
  }

  // 2. Slash pass: a bond whose VTI no longer reproduces loses its backing. Check
  //    every active bond's trap_id against the live proven set. (Legacy pack-only
  //    rows have no trap_id and are left untouched.)
  let slashed = 0;
  const { data: active } = await db
    .from("stake_submissions")
    .select("id, trap_id")
    .eq("status", "staked")
    .not("trap_id", "is", null);
  if (active && active.length > 0) {
    let proven: Set<string>;
    try {
      proven = await provenTrapIds();
    } catch {
      // Corpus unavailable — never slash on a read failure (fail safe, not closed).
      return { matched, checked, slashed };
    }
    for (const bond of active) {
      if (bond.trap_id && !proven.has(bond.trap_id)) {
        const { error: slashErr } = await db
          .from("stake_submissions")
          .update({ status: "slashed", updated_at: new Date().toISOString() })
          .eq("id", bond.id)
          .eq("status", "staked");
        if (!slashErr) slashed++;
      }
    }
  }

  return { matched, checked, slashed };
}
