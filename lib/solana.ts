// Minimal Solana RPC client for the stake indexer (Phase 6). Avoids
// @solana/web3.js — this only needs a couple of read-only JSON-RPC calls.

import { TOKENS } from "./tokens";

const MEMO_PROGRAM_IDS = new Set([
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr", // memo v2
  "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo", // memo v1
]);

export const BOUNTY_POOL_WALLET = "5roYMY7P1rWbfkvqGVFRjV39vE6FD66bwNZA9oEhcu2i";

export function defaultRpcUrl(): string {
  return process.env.SOLANA_RPC_URL ?? "https://solana-rpc.publicnode.com";
}

async function rpcCall<T>(rpcUrl: string, method: string, params: unknown[]): Promise<T> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) {
    throw new Error(`Solana RPC ${method} failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (json.error) {
    throw new Error(`Solana RPC ${method} error: ${json.error.message}`);
  }
  return json.result as T;
}

interface SignatureInfo {
  signature: string;
}

// SOL transfer to `wallet`, in lamports, or an SPL token transfer to a token
// account owned by `wallet` (mint + raw amount, decimals applied).
export interface IncomingTransfer {
  signature: string;
  memo: string | null;
  mint: string | null; // null => native SOL
  amount: number; // lamports (SOL) or token amount in human units (SPL)
}

// Token accounts owned by `wallet` for a given mint (usually just its ATA).
async function fetchTokenAccountAddresses(
  wallet: string,
  mint: string,
  rpcUrl: string,
): Promise<string[]> {
  const result = await rpcCall<{ value: any[] }>(rpcUrl, "getTokenAccountsByOwner", [
    wallet,
    { mint },
    { encoding: "jsonParsed" },
  ]);
  return (result.value ?? []).map((acc: any) => acc.pubkey);
}

// Fetches recent transactions for `wallet` and extracts any that carry a
// memo instruction, along with the net amount transferred *to* `wallet` in
// that transaction (best-effort: SOL balance delta, or SPL token balance
// delta for a token account owned by `wallet`).
//
// SPL token transfers to an *existing* associated token account never
// include the owner wallet's pubkey in the transaction's account keys, so
// getSignaturesForAddress(wallet) alone misses them. We additionally scan
// the wallet's known token accounts (one per accepted mint) and merge by
// signature.
export async function fetchIncomingTransfers(
  wallet: string,
  rpcUrl: string = defaultRpcUrl(),
  limit = 50,
): Promise<IncomingTransfer[]> {
  const tokenMints: string[] = [];
  for (const t of Object.values(TOKENS)) {
    if (typeof t.mint === "string") tokenMints.push(t.mint);
  }

  const tokenAccountLists = await Promise.all(
    tokenMints.map((mint) => fetchTokenAccountAddresses(wallet, mint, rpcUrl).catch(() => [])),
  );

  const addresses = [wallet, ...new Set(tokenAccountLists.flat())];

  const sigSets = await Promise.all(
    addresses.map((addr) =>
      rpcCall<SignatureInfo[]>(rpcUrl, "getSignaturesForAddress", [addr, { limit }]),
    ),
  );

  const seen = new Set<string>();
  const sigs: SignatureInfo[] = [];
  for (const set of sigSets) {
    for (const s of set) {
      if (!seen.has(s.signature)) {
        seen.add(s.signature);
        sigs.push(s);
      }
    }
  }

  const transfers: IncomingTransfer[] = [];

  for (const { signature } of sigs) {
    const tx = await rpcCall<any>(rpcUrl, "getTransaction", [
      signature,
      { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
    ]);
    const transfer = transferFromTx(tx, wallet, signature);
    if (transfer) transfers.push(transfer);
  }

  return transfers;
}

// Extracts the memo-tagged inbound transfer to `wallet` from a fetched
// transaction, or null if the tx failed, carries no memo, or moved nothing
// to the wallet. Shared by the batch indexer above and the by-signature
// verifier below so both apply identical rules.
function transferFromTx(tx: any, wallet: string, signature: string): IncomingTransfer | null {
  if (!tx || tx.meta?.err) return null;

  const memo = extractMemo(tx);
  if (!memo) return null;

  const accountKeys: string[] = tx.transaction.message.accountKeys.map((k: any) =>
    typeof k === "string" ? k : k.pubkey,
  );
  const walletIdx = accountKeys.indexOf(wallet);

  let mint: string | null = null;
  let amount = 0;

  if (walletIdx >= 0 && tx.meta.preBalances && tx.meta.postBalances) {
    const delta = tx.meta.postBalances[walletIdx] - tx.meta.preBalances[walletIdx];
    if (delta > 0) amount = delta; // lamports
  }

  if (amount === 0) {
    const pre = (tx.meta.preTokenBalances ?? []).filter((b: any) => b.owner === wallet);
    const post = (tx.meta.postTokenBalances ?? []).filter((b: any) => b.owner === wallet);
    for (const p of post) {
      const before = pre.find((b: any) => b.accountIndex === p.accountIndex);
      const preAmount = before?.uiTokenAmount?.uiAmount ?? 0;
      const postAmount = p.uiTokenAmount?.uiAmount ?? 0;
      if (postAmount > preAmount) {
        mint = p.mint;
        amount = postAmount - preAmount;
        break;
      }
    }
  }

  if (amount <= 0) return null;
  return { signature, memo, mint, amount };
}

// Fetches ONE transaction by signature and extracts its memo-tagged transfer
// to `wallet` — the instant-settlement path for checkout (the buyer hands us
// the signature their wallet returned, so there's nothing to scan for).
// `confirmed` commitment: the client waits for that level before calling.
export async function fetchTransferBySignature(
  signature: string,
  wallet: string,
  rpcUrl: string = defaultRpcUrl(),
): Promise<IncomingTransfer | null> {
  const tx = await rpcCall<any>(rpcUrl, "getTransaction", [
    signature,
    { encoding: "jsonParsed", maxSupportedTransactionVersion: 0, commitment: "confirmed" },
  ]);
  return transferFromTx(tx, wallet, signature);
}

// Firm on-chain SPL token balance held by `wallet` for `mint`, summed across
// all of the wallet's token accounts for that mint (usually just one ATA).
export async function fetchTokenBalance(
  wallet: string,
  mint: string,
  rpcUrl: string = defaultRpcUrl(),
): Promise<number> {
  const result = await rpcCall<{ value: any[] }>(rpcUrl, "getTokenAccountsByOwner", [
    wallet,
    { mint },
    { encoding: "jsonParsed" },
  ]);
  return (result.value ?? []).reduce((sum, acc: any) => {
    const uiAmount = acc.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0;
    return sum + Number(uiAmount);
  }, 0);
}

function extractMemo(tx: any): string | null {
  const instructions = tx.transaction?.message?.instructions ?? [];
  for (const ix of instructions) {
    const programId = ix.programId ?? ix.program;
    if (MEMO_PROGRAM_IDS.has(programId)) {
      if (typeof ix.parsed === "string") return ix.parsed;
      if (typeof ix.parsed?.info === "string") return ix.parsed.info;
    }
  }
  return null;
}
