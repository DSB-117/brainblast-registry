import { BOUNTY_POOL_WALLET } from "../../lib/solana";

export default function StakeLandingPage() {
  return (
    <main style={{ fontFamily: "monospace", maxWidth: 720, padding: "2rem" }}>
      <h1>Submission staking</h1>
      <p>
        Staking puts a small refundable deposit behind a pack/rule submission. If the
        rule graduates (5 distinct repo/user pairs fixed within 90 days), the stake
        contributes to the author bounty. If it's rejected, you can reclaim it.
      </p>

      <h2>1. Register your submission</h2>
      <p>
        Call <code>POST /api/stakes</code> with your pack/rule and wallet:
      </p>
      <pre style={{ background: "#f4f4f4", padding: "1rem", overflowX: "auto" }}>
{`curl -X POST https://registry.brainblast.tech/api/stakes \\
  -H "content-type: application/json" \\
  -d '{
    "pack_id": "your-pack-id",
    "rule_id": "your-rule-id",
    "author_wallet": "<your Solana wallet address>",
    "stake_usd": 5
  }'`}
      </pre>
      <p>The response includes a unique <code>memo_code</code>, e.g.:</p>
      <pre style={{ background: "#f4f4f4", padding: "1rem", overflowX: "auto" }}>
{`{
  "id": 3,
  "memo_code": "BB-c1accb2e",
  "pay_to": "${BOUNTY_POOL_WALLET}",
  "stake_usd": 5,
  "instructions": "Transfer 5 USD worth of $BRAIN, SOL, or USDC to ${BOUNTY_POOL_WALLET} with memo \\"BB-c1accb2e\\". $BRAIN payments get a 10% discount on the equivalent USD stake."
}`}
      </pre>

      <h2>2. Pay with the memo attached</h2>
      <p>
        Go to <code>/stake/&lt;memo_code&gt;</code> — for the example above, that's{" "}
        <a href="/stake/BB-c1accb2e">/stake/BB-c1accb2e</a>. That page shows your
        submission details and lets you connect a wallet (Phantom) to send SOL,
        USDC, or $BRAIN to the bounty pool wallet with the memo attached
        automatically — no manual memo step needed, and your private key never
        leaves your wallet extension.
      </p>
      <p>
        Wallets like Phantom don't expose a "add memo" field for normal sends, so
        attaching the memo yourself would require a separate tool. The
        <code>/stake/&lt;memo_code&gt;</code> page builds the transfer + memo as a
        single transaction for you.
      </p>

      <h2>3. Wait for confirmation</h2>
      <p>
        The indexer (<code>POST /api/stakes/sync</code>) periodically scans incoming
        transfers to <code>{BOUNTY_POOL_WALLET}</code>, matches your memo, and flips
        your submission's status from <code>pending_payment</code> to{" "}
        <code>staked</code>. You can check status any time:
      </p>
      <pre style={{ background: "#f4f4f4", padding: "1rem", overflowX: "auto" }}>
{`curl "https://registry.brainblast.tech/api/stakes?memo_code=BB-c1accb2e"`}
      </pre>

      <h2>Accepted tokens</h2>
      <ul>
        <li>SOL</li>
        <li>USDC</li>
        <li>$BRAIN (10% discount on the equivalent USD stake)</li>
      </ul>

      <hr style={{ margin: "2rem 0" }} />
      <p style={{ fontSize: "0.85em", color: "#666" }}>
        This is a v1, non-custodial-program flow — a future iteration should move
        staking to a trustless escrow program and automate refunds/payouts.
      </p>
    </main>
  );
}
