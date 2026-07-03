import AccessClient from "../../components/dash/AccessClient";

export default function Access() {
  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Access</div>
        <h1 style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>Get a grant</h1>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "7px 0 0", maxWidth: 620 }}>
          The catalog and the sample tier are always free and anonymous. Paid tiers are self-serve — prove your $BRAIN, get a signed grant, pull your entitled delta.
        </p>
      </div>
      <AccessClient />
    </div>
  );
}
