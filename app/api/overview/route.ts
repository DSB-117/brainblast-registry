import { NextResponse } from "next/server";
import { loadDashboard } from "../../../lib/dashboardData";
import { TRAP_CLASSES } from "../../../lib/brainblast/vtiClass";

// GET /api/overview — the small, public, always-fresh corpus counters the
// homepage hero polls (every ~50s) so "Verified Trap Instances" ticks up without
// a page reload. Cheap: reuses the dashboard aggregation (which caches its source
// fetch for 45s), returns only the headline numbers, never fixtures.
export const revalidate = 45;

export async function GET() {
  const d = await loadDashboard();
  return NextResponse.json({
    vtis: d.totals.vtis,
    sdks: d.totals.sdks,
    classes: d.totals.classes,
    classesTotal: TRAP_CLASSES.length,
    classesLabel: `${d.totals.classes}/${TRAP_CLASSES.length}`,
    reproductionPct: d.totals.reproductionPct,
    generatedAt: d.generatedAt,
  });
}
