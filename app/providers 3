"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";

import "@solana/wallet-adapter-react-ui/styles.css";

// The default public Solana RPC (api.mainnet-beta.solana.com) returns 403 for
// browser-origin requests. publicnode.com's mirror allows CORS and works for
// the light read/send usage these pages need. Override with
// NEXT_PUBLIC_SOLANA_RPC_URL for a dedicated provider (Helius, Triton, etc.).
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://solana-rpc.publicnode.com";

export default function Providers({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
