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
      db
        .from("stake_submissions")
        .select("token_amount")
        .in("status", ["staked", "graduated"])
        .eq("token_mint", BRAIN_MINT),
      db.from("stake_submissions").select("stake_usd").eq("status", "pending_payment"),
      db.from("telemetry_events").select("*", { count: "exact", head: true }),
    ]);

    // Sum of actual $BRAIN tokens staked (only stakes paid in $BRAIN — other
    // tokens contribute to the bounty pool but aren't counted here).
    let brainStaked = (stakedRes.data ?? []).reduce((sum, r: any) => sum + Number(r.token_amount ?? 0), 0);

    // Pending submissions haven't paid on-chain yet, so we don't know what
    // token they'll use — estimate the $BRAIN amount at today's price
    // (with the $BRAIN discount) so the stat isn't misleadingly low.
    const pendingUsd = (pendingRes.data ?? []).reduce((sum, r: any) => sum + Number(r.stake_usd ?? 0), 0);
    if (pendingUsd > 0) {
      try {
        const prices = await fetchUsdPrices([TOKENS.BRAIN.priceMint]);
        const brainPrice = prices[TOKENS.BRAIN.priceMint];
        if (brainPrice) {
          brainStaked += (pendingUsd * (1 - BRAIN_DISCOUNT)) / brainPrice;
        }
      } catch {
        // ignore — pending estimate just won't be included
      }
    }

    return {
      packsSubmitted: packsRes.count ?? 0,
      brainStaked,
      bugsPrevented: bugsRes.count ?? 0,
    };
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

function PackCard({ pack }: { pack: Pack }) {
  const category = inferCategory(pack.pack_id);
  return (
    <div className="pack-card">
      <div className="pack-card-topline">
        <span className="pack-category">{category}</span>
        {pack.latest_version && (
          <span className="pack-version-badge">v{pack.latest_version}</span>
        )}
      </div>
      <h3>{pack.name}</h3>
      {pack.description && <p>{pack.description}</p>}
      <p className="pack-id">{pack.pack_id}</p>
      <div className="pack-meta">
        {pack.author && <span>by {pack.author}</span>}
        <a href={pack.repo_url} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>
          repo →
        </a>
      </div>
    </div>
  );
}

const TICKER_ITEMS = ["STAKE", "GRADUATE", "EARN", "SOLANA", "ENFORCE", "RESEARCH", "COMPOUND", "GUARDRAILS"];
function TickerStrip() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="ticker-strip">
      <div className="ticker-track">
        {items.map((item, i) => (
          <span key={i}>{item} ·</span>
        ))}
      </div>
    </div>
  );
}

export default async function Home() {
  const [packs, stats] = await Promise.all([getPacks(), getStats()]);
  const newPacks = packs.slice(0, 4);
  const popularPacks = [...packs].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 4);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="card glass sidebar-card">
          <div className="brand" style={{ marginBottom: 14 }}>
            <span className="brand-name">brainblast</span>
            <span className="brand-sub">registry</span>
          </div>
          <WalletButton />
        </div>

        <WalletBalances />
        <MySubmissions />

        <a
          className="button button-secondary sidebar-link"
          href="https://brainblast.tech"
          target="_blank"
          rel="noreferrer"
        >
          brainblast.tech
        </a>
      </aside>

      <main className="main-content">
        <section>
          <p className="eyebrow">Rule pack registry &amp; staking</p>
          <h1 className="hero-title">The brainblast pack registry.</h1>
          <p className="hero-lede">
            Browse third-party rule packs for the{" "}
            <a href="https://github.com/DSB-117/brainblast" style={{ color: "var(--cyan)" }}>
              brainblast
            </a>{" "}
            auditor, track graduation telemetry toward the $BRAIN bounty pool, and stake $BRAIN,
            SOL, or USDC behind your own pack submissions.
          </p>
        </section>

        <div className="stat-grid">
          <div className="card glass stat-card">
            <p className="stat-label">Packs submitted</p>
            <p className="stat-value">{stats.packsSubmitted}</p>
          </div>
          <div className="card glass stat-card">
            <p className="stat-label">$BRAIN staked</p>
            <p className="stat-value">
              {stats.brainStaked.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="card glass stat-card">
            <p className="stat-label">Bugs prevented</p>
            <p className="stat-value">{stats.bugsPrevented}</p>
          </div>
        </div>

        <TickerStrip />

        <StakeSection packs={packs} />

        <div className="packs-section">
          <h2>New knowledge packs</h2>
          {newPacks.length === 0 ? (
            <p className="muted">No packs registered yet.</p>
          ) : (
            <div className="grid grid-4">
              {newPacks.map((p) => (
                <PackCard pack={p} key={p.pack_id} />
              ))}
            </div>
          )}
        </div>

        <div className="packs-section">
          <h2>Popular knowledge packs</h2>
          {popularPacks.length === 0 ? (
            <p className="muted">No packs registered yet.</p>
          ) : (
            <div className="grid grid-4">
              {popularPacks.map((p) => (
                <PackCard pack={p} key={p.pack_id} />
              ))}
            </div>
          )}
        </div>
      </main>

      <aside className="aside">
        <div className="card glass sidebar-card">
          <p className="sidebar-card-title">How it works</p>
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-body">
              <h3>Register</h3>
              <p>
                Connect a wallet, pick a pack and rule ID, and submit. You'll get a memo code and
                a USD-denominated stake amount.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-body">
              <h3>Stake</h3>
              <p>
                Pay your stake in SOL, USDC, or $BRAIN (10% discount). The amount shown is
                converted from USD using live prices. <strong>$5 is the suggested minimum</strong> —
                enough to cover indexer/gas costs and show you'll maintain the rule. Stake more
                for higher visibility once your pack graduates.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-body">
              <h3>Graduate</h3>
              <p>
                When <code className="code-pill">brainblast fix --apply</code> fixes a confirmed
                FAIL for your rule, it can record a graduation event. Once 5 distinct repo/user
                pairs fix it within 90 days, the rule graduates.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-body">
              <h3>Earn or reclaim</h3>
              <p>
                Graduated stakes feed the $BRAIN bounty pool that pays the author. Rejected
                submissions can reclaim their stake.
              </p>
            </div>
          </div>
        </div>

        <div className="card glass sidebar-card">
          <p className="sidebar-card-title">Bounty pool</p>
          <p className="muted" style={{ wordBreak: "break-all" }}>
            <span className="code-pill">{BOUNTY_POOL_WALLET}</span>
          </p>
          <p className="muted">
            Funded by graduated stakes — the basis for{" "}
            <code className="code-pill">POST /api/telemetry</code> graduation events.
          </p>
        </div>

        <div className="card glass sidebar-card">
          <p className="muted">
            brainblast registry — backend for the{" "}
            <a href="https://github.com/DSB-117/brainblast" style={{ color: "var(--cyan)" }}>
              brainblast
            </a>{" "}
            rule-pack incentive flywheel. See the{" "}
            <a href="https://github.com/DSB-117/brainblast-registry" style={{ color: "var(--cyan)" }}>
              README
            </a>{" "}
            for the full API.
          </p>
        </div>
      </aside>
    </div>
  );
}
