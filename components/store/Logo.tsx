import Image from "next/image";

// Brainblast logo — the neon brain-circuit coin. Clipped to a circle so the
// square black corners never show against the near-black canvas.
export default function Logo({ size = 26 }: { size?: number }) {
  return (
    <Image
      src="/brainblast-logo.png"
      alt="Brainblast"
      width={size}
      height={size}
      priority
      style={{ display: "block", flexShrink: 0, borderRadius: "50%" }}
    />
  );
}
