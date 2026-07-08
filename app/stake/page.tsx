export const metadata = { title: "Staking — coming soon · Brainblast" };

// Staking / $BRAIN confidence bonds are not open yet. The full wallet + bonding
// implementation lives in git history (restore when it launches); until then
// /stake shows a coming-soon state. /stake/[memoCode] redirects here.
export default function Stake() {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "120px 28px 90px", textAlign: "center", animation: "fade 0.4s ease" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, border: "1px solid var(--line)", background: "var(--glass)", fontSize: 12.5, color: "var(--ink-2)", marginBottom: 26 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--amber)", boxShadow: "0 0 8px var(--amber)" }} />
        Coming soon
      </div>
      <h1 style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.035em", margin: 0 }}>Staking is on the way</h1>
      <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "16px auto 32px", maxWidth: 520, lineHeight: 1.6 }}>
        Bonding $BRAIN behind your verified traps — and the on-chain payout of the data dividend — is rolling out. Contribution itself is already open: prove a trap RED→GREEN and submit it from the CLI.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <a href="/earn" style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 22px", borderRadius: 12, background: "var(--grad-brand)", color: "#03130c", fontSize: 14.5, fontWeight: 600 }}>How earning works</a>
        <a href="/docs" style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 22px", borderRadius: 12, background: "var(--glass-2)", color: "var(--ink)", fontSize: 14.5, fontWeight: 600, border: "1px solid var(--line-2)" }}>Read the docs</a>
      </div>
    </div>
  );
}
