import { loadDashboard } from "../../lib/dashboardData";
import BrowseClient from "../../components/dash/BrowseClient";

export const revalidate = 300;

export default async function Browse() {
  const d = await loadDashboard();
  const classes = [...new Set(d.ledger.map((r) => r.class))].sort();

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Corpus · {d.totals.vtis} verified traps</div>
        <h1 style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>Browse traps</h1>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "7px 0 0", maxWidth: 620 }}>
          Every record is a proven RED→GREEN fix pinned to an exact SDK version. Metadata and proof receipts are open; fixture bodies unlock with a grant.
        </p>
      </div>
      <BrowseClient rows={d.ledger} sdks={d.coverage.sdks} classes={classes} />
    </div>
  );
}
