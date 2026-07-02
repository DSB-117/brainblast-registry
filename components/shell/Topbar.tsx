"use client";

export default function Topbar() {
  return (
    <header
      style={{
        height: "var(--topbar-h)",
        flexShrink: 0,
        borderBottom: "1px solid var(--line)",
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 26px",
        position: "sticky",
        top: 0,
        zIndex: 2,
        background: "rgba(7,8,9,0.72)",
        backdropFilter: "blur(14px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          flex: 1,
          maxWidth: 420,
          height: 38,
          padding: "0 13px",
          borderRadius: 10,
          border: "1px solid var(--line)",
          background: "var(--panel)",
          color: "var(--ink-3)",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" />
        </svg>
        <input
          placeholder="Search traps, SDKs, classes…"
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            color: "var(--ink)",
            fontSize: 13,
            fontFamily: "var(--font-sans)",
            flex: 1,
          }}
        />
        <kbd className="mono" style={{ fontSize: 10, color: "var(--ink-4)", border: "1px solid var(--line-strong)", borderRadius: 5, padding: "1px 5px" }}>/</kbd>
      </div>

      <div style={{ flex: 1 }} />

      <a
        href="https://www.npmjs.com/package/brainblast"
        className="chip"
        style={{ borderColor: "var(--line)", color: "var(--ink-2)" }}
      >
        <span className="mono">npm</span>
        <span className="mono" style={{ color: "var(--green)" }}>v0.9.10</span>
      </a>

      <button
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          height: 38,
          padding: "0 15px",
          borderRadius: 10,
          border: "1px solid var(--line-strong)",
          background: "var(--panel-2)",
          color: "var(--ink)",
          fontSize: 13,
          fontFamily: "var(--font-sans)",
          cursor: "pointer",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="6" width="20" height="13" rx="3" />
          <path d="M2 10h20M16 15h2" />
        </svg>
        Connect wallet
      </button>
    </header>
  );
}
