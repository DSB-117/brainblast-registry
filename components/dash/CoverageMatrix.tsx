import type { CoverageCell } from "../../lib/dashboardData";
import type { TrapClass } from "../../lib/brainblast/vtiClass";

const CLASS_COLOR: Record<string, string> = {
  "auth-bypass": "#ff4d77",
  "missing-slippage-guard": "#2af0ff",
  "silent-zero-revenue": "#24f2a8",
  "unconfirmed-state": "#4d84ff",
  "missing-verification": "#8a6bff",
  "unchecked-staleness": "#ffc24d",
  "wrong-constant": "#a488ff",
  other: "#5dcaa5",
  "immutable-after-deploy": "#ffc24d",
};

function label(c: string) {
  return c.replace(/-/g, " ");
}

export default function CoverageMatrix({
  classes,
  sdks,
  cells,
  uncovered,
}: {
  classes: TrapClass[];
  sdks: string[];
  cells: CoverageCell[];
  uncovered: TrapClass[];
}) {
  const map = new Map(cells.map((c) => [`${c.class}|${c.sdk}`, c.count]));
  const rows: (TrapClass | { gap: TrapClass })[] = [
    ...classes,
    ...uncovered.slice(0, 1).map((g) => ({ gap: g })),
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: `132px repeat(${sdks.length}, minmax(0, 1fr))`, gap: 3, alignItems: "center" }}>
        <div />
        {sdks.map((s) => (
          <div key={s} className="mono" style={{ fontSize: 8.5, color: "var(--ink-4)", textAlign: "center", height: 40, display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "visible" }}>
            <span style={{ transform: "rotate(-42deg)", transformOrigin: "center", whiteSpace: "nowrap" }}>{s}</span>
          </div>
        ))}

        {rows.map((row, ri) => {
          const isGap = typeof row === "object";
          const cls = isGap ? row.gap : row;
          const color = CLASS_COLOR[cls] ?? "var(--ink-2)";
          return (
            <div key={ri} style={{ display: "contents" }}>
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  color: isGap ? "var(--amber)" : "var(--ink-2)",
                  textAlign: "right",
                  paddingRight: 9,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={label(cls)}
              >
                {label(cls)}
              </div>
              {sdks.map((sdk) => {
                const v = map.get(`${cls}|${sdk}`);
                if (isGap) {
                  return <div key={sdk} style={{ height: 23, border: "1px dashed rgba(255,194,77,0.35)", borderRadius: 4, animation: "bb-pulse 2.6s infinite" }} />;
                }
                if (v) {
                  return (
                    <div
                      key={sdk}
                      title={`${label(cls)} × ${sdk} = ${v}`}
                      className="mono"
                      style={{
                        height: 23,
                        background: color,
                        opacity: v > 1 ? 1 : 0.66,
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        color: "#070809",
                        fontWeight: 600,
                      }}
                    >
                      {v}
                    </div>
                  );
                }
                return <div key={sdk} style={{ height: 23, background: "var(--panel-2)", borderRadius: 4 }} />;
              })}
            </div>
          );
        })}
      </div>

      {uncovered.length > 0 && (
        <p className="mono" style={{ fontSize: 10.5, color: "var(--amber)", marginTop: 15, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 9, height: 9, border: "1px dashed var(--amber)", borderRadius: 2, flexShrink: 0 }} />
          {label(uncovered[0])} — the one open class the scout fleet is hunting now
        </p>
      )}
    </div>
  );
}
