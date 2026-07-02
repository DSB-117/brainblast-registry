"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const BACKENDS = [
  { tier: "T0", name: "static-checker", detail: "AST pattern match · offline", time: "~4ms", color: "var(--green)", verdict: "GREEN" },
  { tier: "T1", name: "compiler", detail: "type-checks the pinned SDK", time: "~280ms", color: "var(--blue)", verdict: "GREEN" },
  { tier: "T2", name: "executed-test", detail: "runs a vetted contract test", time: "~1.2s", color: "var(--violet)", verdict: "RED" },
  { tier: "T2", name: "differential", detail: "candidate vs golden i/o", time: "~1.8s", color: "var(--violet)", verdict: "UNK" },
] as const;

const verdictStyle: Record<string, { bg: string; fg: string }> = {
  GREEN: { bg: "var(--green)", fg: "#04241c" },
  RED: { bg: "var(--red)", fg: "#3a0f1c" },
  UNK: { bg: "var(--amber)", fg: "#3a2e08" },
};

export default function ProofWidget() {
  const [lit, setLit] = useState<number>(-1);
  const [diff, setDiff] = useState(false);
  const [done, setDone] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const run = useCallback(() => {
    clear();
    setLit(-1);
    setDiff(false);
    setDone(false);
    const push = (fn: () => void, t: number) => timers.current.push(setTimeout(fn, t));
    push(() => setDiff(true), 300);
    BACKENDS.forEach((_, i) => push(() => setLit(i), 1000 + i * 480));
    push(() => setDone(true), 1000 + BACKENDS.length * 480 + 250);
  }, []);

  useEffect(() => {
    run();
    return clear;
  }, [run]);

  return (
    <div className="card" style={{ padding: 22, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--green)", marginBottom: 7 }}>Live proof</div>
          <h2 style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.015em", margin: 0 }}>
            Every record is a diff, not a claim
          </h2>
        </div>
        <button
          onClick={run}
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontSize: 12,
            color: "var(--green)",
            background: "var(--green-bg)",
            border: "1px solid rgba(36,242,168,0.25)",
            borderRadius: 9,
            padding: "7px 12px",
            cursor: "pointer",
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          prove again
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="mono" style={{ fontSize: 12, color: "var(--ink-2)" }}>jwt-verify-algorithm-none</span>
            <span className="mono" style={{ fontSize: 10.5, color: "var(--red)", background: "var(--red-bg)", padding: "2px 8px", borderRadius: 5 }}>critical</span>
          </div>

          <div className="mono" style={{ fontSize: 12.5, lineHeight: 2, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 11, padding: "12px 14px" }}>
            <div style={{ opacity: diff ? 1 : 0.22, transition: "opacity 0.4s", padding: "6px 11px", background: "var(--red-bg)", borderLeft: "2px solid var(--red)", borderRadius: "0 6px 6px 0", color: "#ff9db1" }}>
              - algorithms: [<span style={{ color: "var(--red)" }}>&apos;none&apos;</span>]
            </div>
            <div style={{ height: 6 }} />
            <div style={{ opacity: diff ? 1 : 0.22, transition: "opacity 0.4s 0.15s", padding: "6px 11px", background: "var(--green-bg)", borderLeft: "2px solid var(--green)", borderRadius: "0 6px 6px 0", color: "#8dffcf" }}>
              + algorithms: [<span style={{ color: "var(--green)" }}>&apos;RS256&apos;</span>]
            </div>
          </div>
          <p className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", margin: 0 }}>source · auth0/express-jwt · pinned jsonwebtoken@9</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {BACKENDS.map((b, i) => {
            const on = i <= lit;
            const win = done && i === 0;
            const vs = verdictStyle[b.verdict];
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "8px 11px",
                  borderRadius: 8,
                  background: "var(--panel-2)",
                  borderLeft: `2px solid ${b.color}`,
                  opacity: on ? 1 : 0.32,
                  boxShadow: win ? "0 0 0 1px var(--green), 0 0 22px -4px var(--green)" : "none",
                  transition: "opacity 0.35s, box-shadow 0.35s",
                }}
              >
                <span className="mono" style={{ fontSize: 9.5, color: b.color, background: "rgba(255,255,255,0.04)", padding: "1px 5px", borderRadius: 4 }}>{b.tier}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{b.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.detail}</div>
                </div>
                <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>{b.time}</span>
                <span
                  className="mono"
                  style={{
                    fontSize: 9.5,
                    color: vs.fg,
                    background: vs.bg,
                    padding: "2px 7px",
                    borderRadius: 4,
                    opacity: on ? 1 : 0,
                    transform: on ? "scale(1)" : "scale(0.6)",
                    transition: "opacity 0.3s, transform 0.3s",
                  }}
                >
                  {b.verdict}
                </span>
              </div>
            );
          })}
          <p className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", margin: "5px 0 0", minHeight: 15, opacity: done ? 1 : 0, transition: "opacity 0.3s" }}>
            proven <span style={{ color: "var(--green)" }}>RED→GREEN</span> via static-checker · corroborated by compiler
          </p>
        </div>
      </div>
    </div>
  );
}
