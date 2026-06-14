import { supabaseAdmin } from "../../../lib/supabase";
import { BOUNTY_POOL_WALLET } from "../../../lib/solana";
import WalletProviders from "./WalletProviders";
import StakePayment, { type StakeInfo } from "./StakePayment";

export default async function StakePage({ params }: { params: { memoCode: string } }) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("stake_submissions")
    .select("memo_code, pack_id, rule_id, stake_usd, status")
    .eq("memo_code", params.memoCode)
    .maybeSingle();

  if (error || !data) {
    return (
      <main style={{ fontFamily: "monospace", padding: "2rem" }}>
        <h1>Stake not found</h1>
        <p>No stake submission with memo code {params.memoCode}.</p>
      </main>
    );
  }

  const stake: StakeInfo = { ...data, pay_to: BOUNTY_POOL_WALLET };

  return (
    <WalletProviders>
      <StakePayment stake={stake} />
    </WalletProviders>
  );
}
