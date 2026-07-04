import { supabaseAdmin } from "../../../lib/supabase";
import { BOUNTY_POOL_WALLET } from "../../../lib/solana";
import StakePayment, { type StakeInfo } from "../../../components/StakePayment";
import WalletButton from "../../../components/WalletButton";

export default async function StakePage({ params }: { params: { memoCode: string } }) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("stake_submissions")
    .select("memo_code, trap_id, pack_id, rule_id, stake_usd, status")
    .eq("memo_code", params.memoCode)
    .maybeSingle();

  if (error || !data) {
    return (
      <div className="page">
        <h1 className="hero-title">Bond not found</h1>
        <p>
          No bond with memo code <span className="code-pill">{params.memoCode}</span>.
          Go to the <a href="/stake" style={{ color: "var(--cyan)" }}>staking app</a> to register one.
        </p>
      </div>
    );
  }

  const stake: StakeInfo = { ...data, pay_to: BOUNTY_POOL_WALLET };

  return (
    <div className="page">
      <h1 className="hero-title" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
        Stake payment — {stake.memo_code}
      </h1>
      <div className="card" style={{ maxWidth: 640 }}>
        <div style={{ marginBottom: 16 }}>
          <WalletButton />
        </div>
        <StakePayment stake={stake} />
      </div>
    </div>
  );
}
