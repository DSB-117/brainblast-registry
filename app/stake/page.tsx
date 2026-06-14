import { supabaseAdmin } from "../../lib/supabase";
import { BOUNTY_POOL_WALLET, fetchTokenBalance } from "../../lib/solana";
import { TOKENS } from "../../lib/tokens";
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
    const [packsRes, bugsRes, brainStaked] = await Promise.all([
      db.from("pack_registry").select("*", { count: "exact", head: true }),
      db.from("telemetry_events").select("*", { count: "exact", head: true }),
      // Firm on-chain $BRAIN balance held by the bounty pool wallet — a
      // non-fluctuating figure rather than a price-dependent estimate.
      fetchTokenBalance(BOUNTY_POOL_WALLET, BRAIN_MINT).catch(() => 0),
    ]);

    return {
      packsSubmitted: packsRes.count ?? 0,
      brainStaked,
      bugsPrevented: bugsRes.count ?? 0,
    };
  } catch {
    return { packsSubmitted: 0, brainStaked: 0, bugsPrevented: 0 };
  }
}

function PackCard({ pack }: { pack: Pack }) {
  return (
    <div className="card glass pack-card">
      <h3>
        <span>{pack.name}</span>
        {pack.latest_version && <span className="code-pill">v{pack.latest_version}</span>}
      </h3>
      <p className="pack-id">{pack.pack_id}</p>
      {pack.description && <p style={{ marginTop: 8 }}>{pack.description}</p>}
      <div className="pack-meta">
        {pack.author && <span>by {pack.author}</span>}
        <a href={pack.repo_url} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>
          repo →
        </a>
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

        <StakeSection packs={packs} />

        <section>
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
        </section>

        <section>
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
        </section>
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
