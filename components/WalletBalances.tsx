"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { TOKENS, type TokenSymbol } from "../lib/tokens";
import { fetchUsdPrices } from "../lib/price";

const DISPLAY_TOKENS: TokenSymbol[] = ["BRAIN", "SOL", "USDC"];

export default function WalletBalances() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balances, setBalances] = useState<Record<TokenSymbol, number> | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!publicKey) {
      setBalances(null);
      return;
    }
    let cancelled = false;

    (async () => {
      const next: Record<TokenSymbol, number> = { BRAIN: 0, SOL: 0, USDC: 0 };

      const lamports = await connection.getBalance(publicKey).catch(() => 0);
      next.SOL = lamports / 1e9;

      for (const sym of ["USDC", "BRAIN"] as const) {
        const mint = TOKENS[sym].mint;
        if (!mint) continue;
        try {
          const ata = await getAssociatedTokenAddress(new PublicKey(mint), publicKey);
          const bal = await connection.getTokenAccountBalance(ata);
          next[sym] = bal.value.uiAmount ?? 0;
        } catch {
          next[sym] = 0;
        }
      }

      if (!cancelled) setBalances(next);
    })();

    fetchUsdPrices(DISPLAY_TOKENS.map((sym) => TOKENS[sym].priceMint))
      .then((p) => {
        if (!cancelled) setPrices(p);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [publicKey, connection]);

  if (!publicKey) return null;

  const totalUsd = balances
    ? DISPLAY_TOKENS.reduce((sum, sym) => {
        const price = prices[TOKENS[sym].priceMint];
        if (!price) return sum;
        return sum + balances[sym] * price;
      }, 0)
    : null;

  return (
    <div className="card glass sidebar-card">
      <p className="sidebar-card-title">Wallet balance</p>
      <div className="balance-list">
        {DISPLAY_TOKENS.map((sym) => {
          const amount = balances?.[sym];
          const price = prices[TOKENS[sym].priceMint];
          const usd = amount !== undefined && price ? amount * price : null;
          return (
            <div className="balance-row" key={sym}>
              <span className="balance-token">{TOKENS[sym].symbol}</span>
              <span className="balance-amount">
                {amount !== undefined ? amount.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "…"}
              </span>
              <span className="balance-usd">{usd !== null ? `$${usd.toFixed(2)}` : "—"}</span>
            </div>
          );
        })}
      </div>
      <div className="balance-total">
        <span>Total USD value</span>
        <strong>{totalUsd !== null ? `$${totalUsd.toFixed(2)}` : "—"}</strong>
      </div>
    </div>
  );
}
