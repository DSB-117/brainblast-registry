import { redirect } from "next/navigation";

// Staking is coming soon — memo-code deep links redirect to the /stake
// coming-soon state. (Original payment page is in git history.)
export default function StakeMemo() {
  redirect("/stake");
}
