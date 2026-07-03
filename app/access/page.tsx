import AccessClient from "../../components/dash/AccessClient";

export default function Access() {
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 28px 20px", animation: "fade 0.4s ease" }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 12 }}>Training access</div>
        <h1 style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.035em", margin: 0 }}>Access the full corpus</h1>
        <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "14px 0 0", maxWidth: 640, lineHeight: 1.6 }}>
          Browsing and the sample feed are always free. To license the full fixtures and the live delta, pay in USD — or hold $BRAIN for a standing 10% discount. Check what your $BRAIN qualifies for below; either way we issue a signed grant.
        </p>
      </div>
      <AccessClient />
    </div>
  );
}
