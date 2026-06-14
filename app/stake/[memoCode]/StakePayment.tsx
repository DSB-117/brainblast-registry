"use client";

import { useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getMint,
} from "@solana/spl-token";
import { TOKENS, type TokenSymbol } from "../../../lib/tokens";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

export interface StakeInfo {
  memo_code: string;
  pack_id: string;
  rule_id: string;
  stake_usd: number;
  status: string;
  pay_to: string;
}

export default function StakePayment({ stake }: { stake: StakeInfo }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  const [token, setToken] = useState<TokenSymbol>("BRAIN");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const payTo = useMemo(() => new PublicKey(stake.pay_to), [stake.pay_to]);

  async function pay() {
    if (!publicKey) return;
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      setStatus("Enter a positive amount.");
      return;
    }

    setBusy(true);
    setStatus("Building transaction…");
    setSignature("");

    try {
      const tx = new Transaction();
      const tokenInfo = TOKENS[token];

      if (tokenInfo.mint === null) {
        // Native SOL transfer.
        tx.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: payTo,
            lamports: Math.round(amountNum * 1e9),
          }),
        );
      } else {
        const mint = new PublicKey(tokenInfo.mint);
        const mintInfo = await getMint(connection, mint);
        const rawAmount = BigInt(Math.round(amountNum * 10 ** mintInfo.decimals));

        const fromAta = await getAssociatedTokenAddress(mint, publicKey);
        const toAta = await getAssociatedTokenAddress(mint, payTo);

        // Create the recipient's token account if it doesn't exist yet.
        try {
          await getAccount(connection, toAta);
        } catch {
          tx.add(
            createAssociatedTokenAccountInstruction(publicKey, toAta, payTo, mint),
          );
        }

        tx.add(createTransferInstruction(fromAta, toAta, publicKey, rawAmount));
      }

      // Memo instruction — required so the indexer can match this payment to
      // this stake submission.
      tx.add(
        new TransactionInstruction({
          keys: [],
          programId: MEMO_PROGRAM_ID,
          data: Buffer.from(stake.memo_code, "utf8"),
        }),
      );

      setStatus("Awaiting signature in wallet…");
      const sig = await sendTransaction(tx, connection);
      setSignature(sig);
      setStatus("Submitted. Waiting for confirmation…");

      await connection.confirmTransaction(sig, "confirmed");
      setStatus("Confirmed! The indexer will pick this up shortly and mark this stake as 'staked'.");
    } catch (err: any) {
      setStatus(`Error: ${err?.message ?? String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ fontFamily: "monospace", maxWidth: 640, padding: "2rem" }}>
      <h1>Stake payment — {stake.memo_code}</h1>
      <p>
        Pack: <code>{stake.pack_id}</code> / Rule: <code>{stake.rule_id}</code>
      </p>
      <p>
        Stake: <strong>${stake.stake_usd}</strong> (status: <code>{stake.status}</code>)
      </p>
      <p>
        Pay to: <code>{stake.pay_to}</code>
      </p>

      {stake.status !== "pending_payment" && (
        <p style={{ color: "darkorange" }}>
          This stake is already <code>{stake.status}</code> — no payment needed.
        </p>
      )}

      <div style={{ margin: "1rem 0" }}>
        <WalletMultiButton />
      </div>

      {connected && stake.status === "pending_payment" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 320 }}>
          <label>
            Token:{" "}
            <select value={token} onChange={(e) => setToken(e.target.value as TokenSymbol)}>
              {Object.keys(TOKENS).map((sym) => (
                <option key={sym} value={sym}>
                  {TOKENS[sym as TokenSymbol].symbol}
                </option>
              ))}
            </select>
          </label>
          <label>
            Amount:{" "}
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`amount in ${TOKENS[token].symbol}`}
            />
          </label>
          <button onClick={pay} disabled={busy}>
            {busy ? "Sending…" : `Send with memo "${stake.memo_code}"`}
          </button>
        </div>
      )}

      {status && <p style={{ marginTop: "1rem" }}>{status}</p>}
      {signature && (
        <p>
          Tx:{" "}
          <a href={`https://solscan.io/tx/${signature}`} target="_blank" rel="noreferrer">
            {signature}
          </a>
        </p>
      )}

      <hr style={{ margin: "2rem 0" }} />
      <p style={{ fontSize: "0.85em", color: "#666" }}>
        This page builds a single transaction containing your transfer plus an SPL Memo
        instruction carrying the code <code>{stake.memo_code}</code>. Your private key never
        leaves your wallet extension — this page only requests a signature.
      </p>
    </div>
  );
}
