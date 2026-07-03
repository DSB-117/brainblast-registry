import AccessClient from "../../components/dash/AccessClient";

export default function Access() {
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 28px 20px", animation: "fade 0.4s ease" }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 12 }}>Access</div>
        <h1 style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.035em", margin: 0 }}>Get a grant</h1>
        <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "14px 0 0", maxWidth: 640, lineHeight: 1.6 }}>
          The catalog and the sample tier are always free and anonymous. Paid tiers are self-serve — prove your $BRAIN, get a signed grant, pull your entitled delta.
        </p>
      </div>
      <AccessClient />
    </div>
  );
}
