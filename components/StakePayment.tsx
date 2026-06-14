"use client";

import { useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
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
import { TOKENS, BRAIN_DISCOUNT, type TokenSymbol } from "../lib/tokens";
import { fetchUsdPrices } from "../lib/price";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

export interface StakeInfo {
  memo_code: string;
  pack_id: string;
  rule_id: string;
  stake_usd: number;
  status: string;
  pay_to: string;
}

export default function StakePayment({
  stake,
  initialToken = "BRAIN",
}: {
  stake: StakeInfo;
  initialToken?: TokenSymbol;
}) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [token, setToken] = useState<TokenSymbol>(initialToken);
  const [amount, setAmount] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [priceError, setPriceError] = useState("");
  const [status, setStatus] = useState<string>("");
  const [statusKind, setStatusKind] = useState<"" | "error" | "success">("");
  const [signature, setSignature] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const payTo = useMemo(() => new PublicKey(stake.pay_to), [stake.pay_to]);

  // Convert the USD stake into a token amount so users don't have to do the
  // math themselves. SOL/USDC are priced at face value; $BRAIN gets the 10%
  // discount applied to the USD owed before converting.
  const suggestedAmount = useMemo(() => {
    if (!price || price <= 0) return null;
    const usdOwed = token === "BRAIN" ? stake.stake_usd * (1 - BRAIN_DISCOUNT) : stake.stake_usd;
    return usdOwed / price;
  }, [price, token, stake.stake_usd]);

  // Fetch a fresh USD price whenever the selected token changes, and
  // pre-fill the amount field with the suggested value (unless the user has
  // already started editing it for this token).
  useEffect(() => {
    let cancelled = false;
    setPrice(null);
    setPriceError("");
    setAmountTouched(false);

    fetchUsdPrices([TOKENS[token].priceMint])
      .then((prices) => {
        if (cancelled) return;
        const p = prices[TOKENS[token].priceMint];
        if (!p) {
          setPriceError("Price unavailable — enter the amount manually.");
          return;
        }
        setPrice(p);
      })
      .catch(() => {
        if (!cancelled) setPriceError("Price lookup failed — enter the amount manually.");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (amountTouched || suggestedAmount === null) return;
    setAmount(suggestedAmount.toFixed(suggestedAmount < 1 ? 6 : 2));
  }, [suggestedAmount, amountTouched]);

  async function pay() {
    if (!publicKey) return;
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      setStatus("Enter a positive amount.");
      setStatusKind("error");
      return;
    }

    setBusy(true);
    setStatus("Building transaction…");
    setStatusKind("");
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
      setStatusKind("success");
    } catch (err: any) {
      setStatus(`Error: ${err?.message ?? String(err)}`);
      setStatusKind("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p>
        Pack: <span className="code-pill">{stake.pack_id}</span> · Rule:{" "}
        <span className="code-pill">{stake.rule_id}</span>
      </p>
      <p>
        Stake: <strong style={{ color: "var(--ink)" }}>${stake.stake_usd}</strong> · status:{" "}
        <span className="code-pill">{stake.status}</span>
      </p>
      <p className="muted">Pay to: {stake.pay_to}</p>

      {stake.status !== "pending_payment" ? (
        <p style={{ color: "var(--amber)" }}>
          This stake is already <strong>{stake.status}</strong> — no payment needed.
        </p>
      ) : (
        <>
          {!publicKey && <p className="muted">Connect a wallet above to pay.</p>}

          {publicKey && (
            <div className="form-grid" style={{ marginTop: 16 }}>
              <label>
                Token
                <select value={token} onChange={(e) => setToken(e.target.value as TokenSymbol)}>
                  {Object.keys(TOKENS).map((sym) => (
                    <option key={sym} value={sym}>
                      {TOKENS[sym as TokenSymbol].symbol}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Amount
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setAmountTouched(true);
                  }}
                  placeholder={`amount in ${TOKENS[token].symbol}`}
                />
              </label>
              {price && suggestedAmount !== null && (
                <p className="muted" style={{ margin: 0 }}>
                  ≈ {suggestedAmount.toFixed(suggestedAmount < 1 ? 6 : 2)} {TOKENS[token].symbol} at
                  ${price < 0.01 ? price.toFixed(8) : price.toFixed(2)}/token
                  {token === "BRAIN" && ` (10% discount applied to the $${stake.stake_usd} stake)`}.
                  {amountTouched && (
                    <>
                      {" "}
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => {
                          setAmount(suggestedAmount.toFixed(suggestedAmount < 1 ? 6 : 2));
                          setAmountTouched(false);
                        }}
                      >
                        Use suggested
                      </button>
                    </>
                  )}
                </p>
              )}
              {priceError && <p className="status-line error" style={{ margin: 0 }}>{priceError}</p>}
              <button className="button button-primary" onClick={pay} disabled={busy}>
                {busy ? "Sending…" : `Send with memo "${stake.memo_code}"`}
              </button>
            </div>
          )}
        </>
      )}

      {status && <p className={`status-line ${statusKind}`}>{status}</p>}
      {signature && (
        <p className="status-line">
          Tx:{" "}
          <a href={`https://solscan.io/tx/${signature}`} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>
            {signature}
          </a>
        </p>
      )}

      <hr className="divider" />
      <p className="muted">
        This builds a single transaction containing your transfer plus an SPL Memo instruction
        carrying the code <span className="code-pill">{stake.memo_code}</span>. Your private key
        never leaves your wallet extension — this page only requests a signature.
      </p>
    </div>
  );
}
