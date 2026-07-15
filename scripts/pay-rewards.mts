// pay-rewards — the payout leg of the contributor-reward loop (BRAIN-UTILITY.md #3).
//
// Operator-run (NOT an open endpoint — it moves real funds). Reads `accrued`
// contributor rewards, sends each contributor their $BRAIN from the REWARD
// TREASURY, and marks the row `paid` with the tx signature only AFTER the
// transfer confirms. Idempotent: a row is paid at most once (markRewardPaid
// flips it only while still `accrued`), so a re-run after a crash is safe.
//
// This treasury is the reward pool's disbursement wallet — funded from the FIXED
// reward budget, deliberately separate from sales revenue (keeps rewards "for
// work, not a profit share").
//
// Usage (env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, REWARD_TREASURY_SECRET,
//        optional SOLANA_RPC_URL):
//   npx tsx scripts/pay-rewards.mts --dry-run          # preview, no transfers
//   npx tsx scripts/pay-rewards.mts --min 1 --limit 50 # pay accrued ≥ 1 BRAIN
//
// REWARD_TREASURY_SECRET is a base58 64-byte Solana secret key (the reward
// treasury). Keep it out of the web deployment env — this is an ops script.

import {
  Connection, Keypair, PublicKey,
} from "@solana/web3.js";
import {
  getMint, getOrCreateAssociatedTokenAccount, transferChecked,
} from "@solana/spl-token";
import { TOKENS } from "../lib/tokens";
import { defaultRpcUrl } from "../lib/solana";
import { base58Decode } from "../lib/brainblast/base58";
import { listAccruedRewards, markRewardPaid } from "../lib/rewards";

function arg(n: string, d?: string) { const i = process.argv.indexOf(`--${n}`); return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d; }
const DRY = process.argv.includes("--dry-run");
const LIMIT = Number(arg("limit", "1000"));
const MIN = Number(arg("min", "0")); // skip dust below this many BRAIN

async function main() {
  const secret = process.env.REWARD_TREASURY_SECRET;
  if (!DRY && !secret) throw new Error("REWARD_TREASURY_SECRET is required for a live payout run (or pass --dry-run)");

  const loaded = await listAccruedRewards();
  if ("error" in loaded) throw new Error(loaded.error);
  const rows = loaded.rows.filter((r) => Number(r.amount_brain) >= MIN).slice(0, LIMIT);

  console.log(`pay-rewards${DRY ? " [DRY RUN]" : ""} · accrued=${loaded.rows.length} · payable=${rows.length} · total=${rows.reduce((s, r) => s + Number(r.amount_brain), 0)} $BRAIN`);
  if (!rows.length) return;

  if (DRY) {
    for (const r of rows) console.log(`  would pay ${Number(r.amount_brain)} $BRAIN → ${r.wallet}  (${r.reason}, ${r.trap_id})`);
    console.log("\n[DRY RUN] no transfers sent. Re-run without --dry-run to pay.");
    return;
  }

  const connection = new Connection(defaultRpcUrl(), "confirmed");
  const treasury = Keypair.fromSecretKey(base58Decode(secret!));
  const mint = new PublicKey(TOKENS.BRAIN.mint!);
  const mintInfo = await getMint(connection, mint);
  const from = await getOrCreateAssociatedTokenAccount(connection, treasury, mint, treasury.publicKey);
  console.log(`treasury ${treasury.publicKey.toBase58()} · mint ${mint.toBase58()} · decimals ${mintInfo.decimals}`);

  let paid = 0, failed = 0;
  for (const r of rows) {
    try {
      const recipient = new PublicKey(r.wallet);
      const to = await getOrCreateAssociatedTokenAccount(connection, treasury, mint, recipient);
      const raw = BigInt(Math.round(Number(r.amount_brain) * 10 ** mintInfo.decimals));
      const sig = await transferChecked(connection, treasury, from.address, mint, to.address, treasury, raw, mintInfo.decimals);
      // Confirm before recording paid — never mark paid on an unconfirmed transfer.
      await connection.confirmTransaction(sig, "confirmed");
      const marked = await markRewardPaid(r.id, sig);
      if (!marked.ok) { console.error(`  paid on-chain but DB mark failed for #${r.id}: ${marked.reason} (sig ${sig})`); }
      console.log(`  ✓ ${Number(r.amount_brain)} $BRAIN → ${r.wallet}  ${sig}`);
      paid++;
    } catch (e: any) {
      console.error(`  ✗ #${r.id} ${r.wallet}: ${e?.message ?? e}`);
      failed++;
    }
  }
  console.log(`\ndone · paid ${paid} · failed ${failed}`);
}

main().catch((e) => { console.error(e?.message ?? e); process.exit(1); });
