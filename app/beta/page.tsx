"use client";

import { useEffect, useState } from "react";

export default function Beta() {
  const [key, setKey] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("e") === "1") setErr(true);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const k = key.trim();
    if (k) window.location.href = `/?key=${encodeURIComponent(k)}`;
  };

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div className="glass" style={{ width: "100%", maxWidth: 420, borderRadius: "var(--radius-xl)", padding: 36, textAlign: "center", animation: "fade 0.4s ease" }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: "var(--grad-brand)", margin: "0 auto 22px", boxShadow: "0 0 24px rgba(52,211,153,0.4)" }} />
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 10 }}>Private beta</div>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 10px" }}>Enter your invite</h1>
        <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "0 0 26px", lineHeight: 1.55 }}>
          Brainblast is in private beta. Paste the invite key from your email, or open your magic link directly.
        </p>

        <form onSubmit={submit}>
          <input
            value={key}
            onChange={(e) => { setKey(e.target.value); setErr(false); }}
            placeholder="invite key"
            className="mono"
            autoFocus
            style={{
              width: "100%",
              height: 46,
              padding: "0 16px",
              borderRadius: 12,
              background: "rgba(0,0,0,0.35)",
              border: `1px solid ${err ? "var(--rose)" : "var(--line-2)"}`,
              color: "var(--ink)",
              fontSize: 14,
              outline: "none",
              textAlign: "center",
              letterSpacing: "0.04em",
            }}
          />
          {err && <p style={{ fontSize: 12.5, color: "var(--rose)", margin: "10px 0 0" }}>That key isn&apos;t valid or has been revoked.</p>}
          <button
            type="submit"
            style={{
              width: "100%",
              height: 46,
              marginTop: 14,
              borderRadius: 12,
              border: "none",
              background: "var(--grad-brand)",
              color: "#03130c",
              fontSize: 14.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            Enter the beta
          </button>
        </form>

        <p style={{ fontSize: 12.5, color: "var(--ink-4)", margin: "22px 0 0" }}>
          Need access? <a href="mailto:contact@brainblast.tech?subject=Brainblast%20beta%20access" style={{ color: "var(--ink-2)" }}>Request an invite</a>
        </p>
      </div>
    </div>
  );
}
