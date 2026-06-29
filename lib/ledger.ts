// Authoritative server-side metering for the distribution endpoint (R3).
//
// Every gated feed pull is appended to the hash-chained `usage_ledger` table —
// the same chain primitive (appendUsage) the CLI uses, persisted in Supabase
// instead of a file. `seq` is the table's primary key, so a concurrent race
// produces a duplicate-key error (the request 500s and the client retries)
// rather than a forked chain.

import { appendUsage, type UsageEntry, type UsageRecord } from "./brainblast";
import { supabaseAdmin } from "./supabase";

export async function meterPull(rec: UsageRecord): Promise<void> {
  const db = supabaseAdmin();
  const { data: last, error: readErr } = await db
    .from("usage_ledger")
    .select("seq, hash")
    .order("seq", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (readErr) throw new Error(`ledger read failed: ${readErr.message}`);

  // appendUsage only needs the prior chain's tail (seq + hash) to extend it.
  const prior = (last ? [{ seq: last.seq, hash: last.hash } as UsageEntry] : []) as UsageEntry[];
  const entry = appendUsage(prior, rec);

  const { error } = await db.from("usage_ledger").insert({
    seq: entry.seq,
    prev_hash: entry.prevHash,
    hash: entry.hash,
    ts: entry.ts,
    buyer: entry.buyer,
    tier: entry.tier,
    lots: entry.lots,
    records_served: entry.recordsServed,
    cursor: entry.cursor,
    query: entry.query ?? null,
  });
  if (error) throw new Error(`ledger insert failed: ${error.message}`);
}
