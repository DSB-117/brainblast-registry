import { supabaseAdmin } from "../../lib/supabase";
import { BOUNTY_POOL_WALLET } from "../../lib/solana";
import { TOKENS, BRAIN_DISCOUNT } from "../../lib/tokens";
import { fetchUsdPrices } from "../../lib/price";
import StakeSection from "../../components/StakeSection";
import WalletButton from "../../components/WalletButton";
import WalletBalances from "../../components/WalletBalances";
import MySubmissions from "../../components/MySubmissions";

export const dynamic = "force-dynamic";

interface Pack {
  pack_id: string;
  name: string;
  repo_url: string;
  author: string | null;
  description: string | null;
  latest_version: string | null;
  synced_at: string;
}

interface Stats {
  packsSubmitted: number;
  brainStaked: number;
  bugsPrevented: number;
}

const BRAIN_MINT = TOKENS.BRAIN.mint;

async function getPacks(): Promise<Pack[]> {
  try {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("pack_registry")
      .select("pack_id, name, repo_url, author, description, latest_version, synced_at")
      .order("name", { ascending: true });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

async function getStats(): Promise<Stats> {
  try {
    const db = supabaseAdmin();
    const [packsRes, stakedRes, pendingRes, bugsRes] = await Promise.all([
      db.from("pack_registry").select("*", { count: "exact", head: true }),
      db.from("stake_submissions").select("token_amount").in("status", ["staked", "graduated"]).eq("token_mint", BRAIN_MINT),
      db.from("stake_submissions").select("stake_usd").eq("status", "pending_payment"),
      db.from("telemetry_events").select("*", { count: "exact", head: true }),
    ]);

    let brainStaked = (stakedRes.data ?? []).reduce((sum, r: any) => sum + Number(r.token_amount ?? 0), 0);
    const pendingUsd = (pendingRes.data ?? []).reduce((sum, r: any) => sum + Number(r.stake_usd ?? 0), 0);
    if (pendingUsd > 0) {
      try {
        const prices = await fetchUsdPrices([TOKENS.BRAIN.priceMint]);
        const brainPrice = prices[TOKENS.BRAIN.priceMint];
        if (brainPrice) brainStaked += (pendingUsd * (1 - BRAIN_DISCOUNT)) / brainPrice;
      } catch {
        // ignore — pending estimate just won't be included
      }
    }

    return { packsSubmitted: packsRes.count ?? 0, brainStaked, bugsPrevented: bugsRes.count ?? 0 };
  } catch {
    return { packsSubmitted: 0, brainStaked: 0, bugsPrevented: 0 };
  }
}

function inferCategory(pack_id: string): string {
  if (/solana|spl|anchor|metaplex|pump|jito|raydium/i.test(pack_id)) return "Solana";
  if (/stripe|payment|webhook|billing/i.test(pack_id)) return "Payments";
  if (/auth|privy|oauth|jwt|token/i.test(pack_id)) return "Auth";
  if (/openai|anthropic|llm|ai|agent/i.test(pack_id)) return "AI";
  if (/aws|gcp|azure|cloud/i.test(pack_id)) return "Cloud";
  return "Web3";
}

const STEPS = [
  ["Register", "Connect a wallet, pick your pack and rule ID, and submit. You get a memo code and a USD-denominated stake amount — no account, no approval."],
  ["Stake", "Pay in SOL, USDC, or $BRAIN (10% off), converted from USD at live prices. $5 is the suggested minimum — enough to cover indexer/gas and show you'll maintain the rule."],
  ["Graduate", "When brainblast confirms your rule's RED→GREEN fix across 5 distinct repos within 90 days, it graduates — the corroboration that makes a rule worth a buyer's money."],
  ["Earn or reclaim", "Graduated stakes feed the $BRAIN bounty pool that pays you as the author. A rejected submission can always reclaim its stake."],
];

function PackCard({ pack }: { pack: Pack }) {
  return (
    <div className="glass lift" style={{ borderRadius: "var(--radius-lg)", padding: 20, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 999, background: "var(--glass-2)", color: "var(--ink-2)" }}>{inferCategory(pack.pack_id)}</span>
        {pack.latest_version && <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>v{pack.latest_version}</span>}
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>{pack.name}</h3>
      {pack.description && <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: "0 0 12px", lineHeight: 1.5 }}>{pack.description}</p>}
      <div className="mono" style={{ fontSize: 11.5, color: "var(--ink-4)", marginBottom: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pack.pack_id}</div>
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5, color: "var(--ink-3)" }}>
        {pack.author && <span>by {pack.author}</span>}
        <a href={pack.repo_url} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)", marginLeft: "auto" }}>repo →</a>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: "20px 22px" }}>
      <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 8 }}>{label}</div>
      <div className="mono grad-text" style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>{value}</div>
    </div>
  );
}

export default async function StakePage() {
  const [packs, stats] = await Promise.all([getPacks(), getStats()]);

  return (
    <div className="stake-app" style={{ maxWidth: 1120, margin: "0 auto", padding: "56px 28px 20px", animation: "fade 0.4s ease" }}>
      <div style={{ marginBottom: 30 }}>
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 12 }}>Contribute · Stake</div>
        <h1 style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em", margin: 0 }}>Stake behind your rules</h1>
        <p style={{ fontSize: 15.5, color: "var(--ink-2)", margin: "12px 0 0", maxWidth: 660, lineHeight: 1.6 }}>
          Author a rule that catches an SDK bug, stake behind it, and earn from the $BRAIN bounty pool when it graduates across real repos. Graduated rules become VTIs in the corpus buyers train and evaluate on. New here? <a href="/earn" style={{ color: "var(--emerald)" }}>Read the contributor guide →</a>
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Rules staked" value={String(stats.packsSubmitted)} />
        <Stat label="$BRAIN staked" value={stats.brainStaked.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
        <Stat label="Fixes recorded" value={String(stats.bugsPrevented)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 22, alignItems: "start" }}>
        {/* Left — the app */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card glass sidebar-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Your wallet</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Connect to register and pay a stake.</div>
            </div>
            <WalletButton />
          </div>
          <WalletBalances />
          <StakeSection packs={packs} />
          <MySubmissions />
        </div>

        {/* Right — how it works + bounty pool */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 84 }}>
          <div className="card glass sidebar-card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>How it works</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {STEPS.map(([t, b], i) => (
                <div key={t} style={{ display: "flex", gap: 13 }}>
                  <span className="mono" style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--glass-2)", color: "var(--emerald)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, fontWeight: 600 }}>{i + 1}</span>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3 }}>{t}</div>
                    <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: 0, lineHeight: 1.55 }}>{b}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card glass sidebar-card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Bounty pool</div>
            <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: "0 0 10px", lineHeight: 1.55 }}>Funded by graduated stakes — the source that pays rule authors.</p>
            <div className="mono" style={{ fontSize: 11, color: "var(--ink-2)", wordBreak: "break-all", background: "rgba(0,0,0,0.35)", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px" }}>{BOUNTY_POOL_WALLET}</div>
          </div>
        </div>
      </div>

      {/* Registry */}
      <div style={{ marginTop: 44 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 16px" }}>Rules in the registry</h2>
        {packs.length === 0 ? (
          <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: "36px 24px", textAlign: "center", color: "var(--ink-3)", fontSize: 14 }}>No rules registered yet — be the first to stake one.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
            {packs.map((p) => <PackCard pack={p} key={p.pack_id} />)}
          </div>
        )}
      </div>
    </div>
  );
}
