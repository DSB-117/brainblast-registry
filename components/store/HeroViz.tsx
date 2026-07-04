"use client";

import { useEffect, useRef, useState } from "react";

function areaPath(series: number[], w: number, h: number, pad = 6) {
  const max = Math.max(...series);
  const min = Math.min(...series);
  const rng = max - min || 1;
  const step = (w - pad * 2) / (series.length - 1);
  const pts = series.map((v, i) => [pad + i * step, h - pad - ((v - min) / rng) * (h - pad * 2)]);
  let line = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    line += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  const area = `${line} L ${pts[pts.length - 1][0]} ${h} L ${pts[0][0]} ${h} Z`;
  return { line, area, last: pts[pts.length - 1] };
}

function useCountUp(target: number, ms = 1100) {
  const [v, setV] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      // Animate from the PREVIOUS value to the new target, so a live +1 tick
      // (from polling) glides up instead of snapping back to 0 and recounting.
      setV(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export default function HeroViz({
  vtis,
  sdks,
  classesLabel,
  reproductionPct,
  growth,
}: {
  vtis: number;
  sdks: number;
  classesLabel: string;
  reproductionPct: number;
  growth: number[];
}) {
  const chart = areaPath(growth, 340, 128);

  // Live corpus counters — seed from the server-rendered props, then poll the
  // lightweight /api/overview every ~50s so the numbers tick up without a reload.
  const [stats, setStats] = useState({ vtis, sdks, classesLabel, reproductionPct });
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const r = await fetch("/api/overview", { cache: "no-store" });
        if (!r.ok || !alive) return;
        const d = await r.json();
        if (!alive || typeof d?.vtis !== "number") return;
        setStats({ vtis: d.vtis, sdks: d.sdks, classesLabel: d.classesLabel, reproductionPct: d.reproductionPct });
      } catch {
        // keep the last-known numbers on a transient failure
      }
    };
    const id = setInterval(poll, 50_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const count = useCountUp(stats.vtis);
  const repro = useCountUp(stats.reproductionPct, 1400);
  const [drawn, setDrawn] = useState(false);
  const dotRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="glass" style={{ borderRadius: "var(--radius-xl)", padding: 26, boxShadow: "0 30px 80px -30px rgba(0,0,0,0.7)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 12.5, color: "var(--ink-3)", letterSpacing: "0.02em", marginBottom: 8 }}>Verified Trap Instances</div>
          <div className="mono" style={{ fontSize: 46, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1 }}>{count}</div>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "rgba(52,211,153,0.14)", color: "var(--emerald)", fontSize: 12.5, fontWeight: 500 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--emerald)", boxShadow: "0 0 8px var(--emerald)", animation: "livepulse 1.8s ease-in-out infinite" }} />
          growing
        </div>
      </div>

      <svg width="100%" viewBox="0 0 340 132" style={{ display: "block", margin: "8px 0 18px" }} aria-hidden="true">
        <defs>
          <linearGradient id="afill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#34d399" stopOpacity="0.42" />
            <stop offset="1" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="aline" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#34d399" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <path d={chart.area} fill="url(#afill)" style={{ opacity: drawn ? 1 : 0, transition: "opacity 1s ease 0.4s" }} />
        <path
          d={chart.line}
          fill="none"
          stroke="url(#aline)"
          strokeWidth="2.5"
          strokeLinecap="round"
          pathLength={1}
          style={{ strokeDasharray: 1, strokeDashoffset: drawn ? 0 : 1, transition: "stroke-dashoffset 1.3s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <circle ref={dotRef} cx={chart.last[0]} cy={chart.last[1]} r="4" fill="#34d399" style={{ opacity: drawn ? 1 : 0, transition: "opacity 0.4s ease 1.2s" }} />
        <circle cx={chart.last[0]} cy={chart.last[1]} r="8" fill="#34d399" opacity={drawn ? 0.25 : 0} style={{ transition: "opacity 0.4s ease 1.2s", animation: drawn ? "livepulse 1.8s ease-in-out infinite" : "none" }} />
      </svg>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
        {[["SDKs", String(stats.sdks), "var(--cyan)"], ["Classes", stats.classesLabel, "var(--violet)"], ["Reproduced", `${repro}%`, "var(--emerald)"]].map(([l, v, c]) => (
          <div key={l}>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginBottom: 5 }}>{l}</div>
            <div className="mono" style={{ fontSize: 19, fontWeight: 600, color: c }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
