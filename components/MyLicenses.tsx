"use client";

// "Your licenses" — the purchased-data view. The wallet IS the account: the
// buyer signs a short timestamped message (no funds move, no session, no
// signup) and gets back every purchase attached to that wallet, with grant
// re-download and ready-to-run pull commands.

import { useMemo, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { LOTS, type LotName } from "../lib/lots";
import WalletButton from "./WalletButton";

// Must mirror lib/purchases.ts licensesMessage().
const message = (wallet: string, ts: number) => `brainblast:licenses:${wallet}:${ts}`;

// Minimal base58 (same alphabet as lib/brainblast/base58) — encode only, for
// the signature bytes. Kept local so a server-only barrel never leaks into the
// client bundle.
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function b58(bytes: Uint8Array): string {
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  const digits: number[] = [];
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  return "1".repeat(zeros) + digits.reverse().map((d) => B58[d]).join("");
}

interface PurchaseView {
  memo_code: string;
  lots: LotName[];
  tier: "standard" | "firehose";
  period: "mo" | "yr";
  usd_total: number;
  token: string;
  status: string;
  grant: unknown | null;
  grant_expires_at: string | null;
  created_at: string;
}

const STATUS_COLOR: Record<string, string> = {
  granted: "var(--emerald)",
  pending_payment: "var(--amber)",
  underpaid: "var(--amber)",
  paid: "var(--cyan)",
  expired: "var(--ink-4)",
};

export default function MyLicenses() {
  const { publicKey, signMessage } = useWallet();
  const [state, setState] = useState<"idle" | "signing" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [purchases, setPurchases] = useState<PurchaseView[]>([]);
  const grantUrlRef = useRef<string | null>(null);

  const active = useMemo(
    () => purchases.filter((p) => p.status === "granted" && (!p.grant_expires_at || Date.parse(p.grant_expires_at) > Date.now())),
    [purchases],
  );

  async function load() {
    if (!publicKey || !signMessage) return;
    setError("");
    try {
      setState("signing");
      const wallet = publicKey.toBase58();
      const ts = Date.now();
      const sig = await signMessage(new TextEncoder().encode(message(wallet, ts)));
      setState("loading");
      const res = await fetch("/api/purchases/mine", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet, ts, sig: b58(sig) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? `lookup failed (${res.status})`);
      setPurchases(json.purchases);
      setState("done");
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setState("error");
    }
  }

  function downloadGrant(p: PurchaseView) {
    if (grantUrlRef.current) URL.revokeObjectURL(grantUrlRef.current);
    const url = URL.createObjectURL(new Blob([JSON.stringify(p.grant, null, 2)], { type: "application/json" }));
    grantUrlRef.current = url;
    const a = document.createElement("a");
    a.href = url;
    a.download = `brainblast-grant-${p.memo_code}.json`;
    a.click();
  }

  return (
    <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 28, marginTop: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500 }}>Your licenses</div>
        {state === "done" && (
          <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)", padding: "5px 11px", borderRadius: 999, border: "1px solid var(--line)" }}>
            {active.length} active
          </span>
        )}
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 6px" }}>Already bought access?</h2>
      <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "0 0 18px", maxWidth: 560, lineHeight: 1.6 }}>
        Your wallet is your account. Sign a one-line message (nothing moves, nothing is spent) to list every license
        bought with it — re-download grants and grab the pull command.
      </p>

      {state !== "done" && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          {!publicKey && <WalletButton />}
          {publicKey && (
            <button onClick={load} disabled={state === "signing" || state === "loading"}
              style={{ height: 42, padding: "0 22px", borderRadius: 11, border: "1px solid var(--line-2)", background: "var(--glass-2)", color: "var(--ink)", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: state === "signing" || state === "loading" ? 0.6 : 1 }}>
              {state === "signing" ? "Check your wallet…" : state === "loading" ? "Loading…" : "View my licenses"}
            </button>
          )}
          {error && <span className="status-line error" style={{ margin: 0 }}>{error}</span>}
        </div>
      )}

      {state === "done" && purchases.length === 0 && (
        <p style={{ fontSize: 13.5, color: "var(--ink-3)", margin: 0 }}>No purchases on this wallet yet — configure a license above to get started.</p>
      )}

      {state === "done" && purchases.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {purchases.map((p) => (
            <div key={p.memo_code} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 13, border: "1px solid var(--line)", background: "var(--glass-2)", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>
                  {p.tier === "firehose" ? "Scale — everything" : p.lots.map((l) => LOTS[l]?.name ?? l).join(" + ")}
                </div>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
                  {p.memo_code} · ${p.usd_total.toLocaleString()}/{p.period} in {p.token} · bought {new Date(p.created_at).toLocaleDateString()}
                  {p.grant_expires_at && ` · until ${new Date(p.grant_expires_at).toLocaleDateString()}`}
                </div>
              </div>
              <span className="mono" style={{ fontSize: 11, color: STATUS_COLOR[p.status] ?? "var(--ink-3)" }}>{p.status.replace("_", " ")}</span>
              {p.status === "granted" && p.grant != null && (
                <button onClick={() => downloadGrant(p)}
                  style={{ height: 34, padding: "0 14px", borderRadius: 9, border: "1px solid var(--line-2)", background: "transparent", color: "var(--ink)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                  grant.json
                </button>
              )}
            </div>
          ))}
          <div style={{ marginTop: 6 }}>
            <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", marginBottom: 7 }}>pull your entitled data</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--emerald)", background: "rgba(0,0,0,0.4)", border: "1px solid var(--line)", borderRadius: 9, padding: "10px 12px", lineHeight: 1.7, overflowX: "auto" }}>
              curl -H &quot;x-brainblast-grant: $(base64 -i grant.json)&quot; \<br />
              &nbsp;&nbsp;&quot;https://registry.brainblast.tech/api/feed?limit=100&quot;
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
