"use client";

import { useId } from "react";

// Brainblast brain-circuit mark — a coin with an organic brain hemisphere (left)
// meeting circuit traces (right) at a bright core, in the brand gradient.
export default function Logo({ size = 26 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  const g = `bbg-${id}`;
  const core = `bbc-${id}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id={g} x1="6" y1="14" x2="94" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="0.5" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <radialGradient id={core} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#a7f3e0" />
          <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* coin */}
      <circle cx="50" cy="50" r="46" fill="#0a0a14" stroke={`url(#${g})`} strokeWidth="3" />

      <g stroke={`url(#${g})`} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* left hemisphere — brain lobes */}
        <path d="M50 22 C40 20 30 22 27 30 C20 31 18 39 24 43 C18 46 19 55 26 56 C25 64 32 72 44 72 C48 74 50 72 50 68" />
        {/* central fissure */}
        <path d="M50 22 V78" strokeWidth="2.6" opacity="0.55" />
        {/* right hemisphere — outer trace */}
        <path d="M50 22 C60 20 70 24 72 32 M50 78 C62 80 74 74 74 62" strokeWidth="2.8" opacity="0.85" />

        {/* left circuit spurs */}
        <path d="M50 46 L38 40 L30 40 M50 46 L36 54 L30 58" strokeWidth="2.6" />
        {/* right circuit traces → pins */}
        <path d="M50 46 L66 38 L78 38 M50 46 L70 46 L82 46 M50 46 L68 56 L80 62" strokeWidth="2.6" />
      </g>

      {/* nodes */}
      <g fill="#34d399">
        <circle cx="30" cy="40" r="3.4" />
        <circle cx="30" cy="58" r="3.4" />
      </g>
      <g fill="#22d3ee">
        <rect x="78" y="35" width="8" height="6" rx="1.5" />
        <rect x="82" y="43" width="8" height="6" rx="1.5" />
        <rect x="80" y="59" width="8" height="6" rx="1.5" />
      </g>

      {/* core spark */}
      <circle cx="50" cy="46" r="9" fill={`url(#${core})`} />
      <circle cx="50" cy="46" r="2.6" fill="#ffffff" />
    </svg>
  );
}
