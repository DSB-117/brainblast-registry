"use client";

import { useMemo, type FC, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import type { Adapter } from "@solana/wallet-adapter-base";

import "@solana/wallet-adapter-react-ui/styles.css";

// The Solana wallet-adapter packages ship their own nested @types/react (React
// 19), whose FC return type (ReactNode | Promise<ReactNode>) is incompatible
// with this app's pinned React 18 JSX. Re-type the provider components through
// their real prop shapes so the build type-checks without a dependency-tree
// churn. Behavior is unchanged — this is purely a types bridge.
const Connection = ConnectionProvider as unknown as FC<{ endpoint: string; children: ReactNode }>;
const Wallet = WalletProvider as unknown as FC<{ wallets: Adapter[]; autoConnect?: boolean; children: ReactNode }>;
const Modal = WalletModalProvider as unknown as FC<{ children: ReactNode }>;

// The default public Solana RPC (api.mainnet-beta.solana.com) returns 403 for
// browser-origin requests. publicnode.com's mirror allows CORS and works for
// the light read/send usage these pages need. Override with
// NEXT_PUBLIC_SOLANA_RPC_URL for a dedicated provider (Helius, Triton, etc.).
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://solana-rpc.publicnode.com";

export default function Providers({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <Connection endpoint={RPC_URL}>
      <Wallet wallets={wallets} autoConnect>
        <Modal>{children}</Modal>
      </Wallet>
    </Connection>
  );
}
