import { supabaseAdmin } from "../lib/supabase";
import { BOUNTY_POOL_WALLET } from "../lib/solana";
import StakeSection from "../components/StakeSection";

export const dynamic = "force-dynamic";

interface Pack {
  pack_id: string;
  name: string;
  repo_url: string;
  author: string | null;
  description: string | null;
  latest_version: string | null;
}

async function getPacks(): Promise<Pack[]> {
  try {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("pack_registry")
      .select("pack_id, name, repo_url, author, description, latest_version")
      .order("name", { ascending: true });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const packs = await getPacks();

  return (
    <div className="page">
      <header className="header">
        <div className="brand">
          <span className="brand-name">brainblast</span>
          <span className="brand-sub">registry</span>
        </div>
        <a className="button button-secondary" href="https://brainblast.tech" target="_blank" rel="noreferrer">
          brainblast.tech
        </a>
      </header>

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

      <section className="section">
        <h2>Pack registry</h2>
        <p className="section-intro">
          Third-party rule packs available via <code className="code-pill">--packs</code>. Each
          pack's checks become eligible for opt-in graduation telemetry once registered here.
        </p>

        {packs.length === 0 ? (
          <p className="muted">No packs registered yet.</p>
        ) : (
          <div className="grid grid-2">
            {packs.map((p) => (
              <div className="card pack-card" key={p.pack_id}>
                <h3>
                  <span>{p.name}</span>
                  {p.latest_version && <span className="code-pill">v{p.latest_version}</span>}
                </h3>
                <p className="pack-id">{p.pack_id}</p>
                {p.description && <p style={{ marginTop: 8 }}>{p.description}</p>}
                <div className="pack-meta">
                  {p.author && <span>by {p.author}</span>}
                  <a href={p.repo_url} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>
                    repo →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2>Stake $BRAIN on a submission</h2>
        <p className="section-intro">
          Staking puts a small refundable deposit behind a pack/rule submission. If the rule
          graduates (5 distinct repo/user pairs fixed within 90 days), the stake contributes to
          the author bounty; if it's rejected, you can reclaim it. Connect a wallet, register your
          submission, and pay in one step — $BRAIN gets a 10% discount on the equivalent USD
          stake.
        </p>
        <StakeSection packs={packs} />
      </section>

      <section className="section">
        <h2>How telemetry works</h2>
        <p className="section-intro">
          When <code className="code-pill">brainblast fix --apply</code> mechanically fixes a
          confirmed FAIL for a rule that belongs to a registered pack, it can optionally record a
          one-way-hashed graduation event (<code className="code-pill">POST /api/telemetry</code>
          ). A rule graduates once 5 distinct repo/user pairs have fixed it within a 90-day
          window — the basis for the $BRAIN bounty pool at{" "}
          <span className="code-pill">{BOUNTY_POOL_WALLET}</span>.
        </p>
      </section>

      <footer className="footer">
        <p>
          brainblast registry — backend for the{" "}
          <a href="https://github.com/DSB-117/brainblast" style={{ color: "var(--cyan)" }}>
            brainblast
          </a>{" "}
          rule-pack incentive flywheel. See the{" "}
          <a
            href="https://github.com/DSB-117/brainblast-registry"
            style={{ color: "var(--cyan)" }}
          >
            README
          </a>{" "}
          for the full API.
        </p>
      </footer>
    </div>
  );
}
