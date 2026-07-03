import { loadDashboard } from "../../lib/dashboardData";
import BrowseClient from "../../components/dash/BrowseClient";

export const revalidate = 300;

export default async function Browse() {
  const d = await loadDashboard();
  const classes = [...new Set(d.ledger.map((r) => r.class))].sort();

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 28px 20px", animation: "fade 0.4s ease" }}>
      <div style={{ marginBottom: 30 }}>
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 12 }}>Marketplace · {d.totals.vtis} VTIs</div>
        <h1 style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em", margin: 0 }}>Browse the catalog</h1>
        <p style={{ fontSize: 15.5, color: "var(--ink-2)", margin: "12px 0 0", maxWidth: 640, lineHeight: 1.6 }}>
          Every record is a proven RED→GREEN fix pinned to an exact SDK version. Metadata and proof receipts are open; fixture bodies unlock with a grant.
        </p>
      </div>
      <BrowseClient rows={d.ledger} sdks={d.coverage.sdks} classes={classes} />
    </div>
  );
}
