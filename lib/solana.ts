// Minimal Solana RPC client for the stake indexer (Phase 6). Avoids
// @solana/web3.js — this only needs a couple of read-only JSON-RPC calls.

const MEMO_PROGRAM_IDS = new Set([
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr", // memo v2
  "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo", // memo v1
]);

export const BOUNTY_POOL_WALLET = "5roYMY7P1rWbfkvqGVFRjV39vE6FD66bwNZA9oEhcu2i";

export function defaultRpcUrl(): string {
  return process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
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

// Fetches recent transactions for `wallet` and extracts any that carry a
// memo instruction, along with the net amount transferred *to* `wallet` in
// that transaction (best-effort: SOL balance delta, or SPL token balance
// delta for a token account owned by `wallet`).
export async function fetchIncomingTransfers(
  wallet: string,
  rpcUrl: string = defaultRpcUrl(),
  limit = 50,
): Promise<IncomingTransfer[]> {
  const sigs = await rpcCall<SignatureInfo[]>(rpcUrl, "getSignaturesForAddress", [
    wallet,
    { limit },
  ]);

  const transfers: IncomingTransfer[] = [];

  for (const { signature } of sigs) {
    const tx = await rpcCall<any>(rpcUrl, "getTransaction", [
      signature,
      { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
    ]);
    if (!tx || tx.meta?.err) continue;

    const memo = extractMemo(tx);
    if (!memo) continue;

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

    if (amount > 0) {
      transfers.push({ signature, memo, mint, amount });
    }
  }

  return transfers;
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
