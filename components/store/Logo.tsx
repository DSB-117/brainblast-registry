import Image from "next/image";

// Brainblast logo — the neon brain-circuit coin (transparent bevel PNG).
export default function Logo({ size = 26 }: { size?: number }) {
  return (
    <Image
      src="/brainblast-logo.png"
      alt="Brainblast"
      width={size}
      height={size}
      priority
      style={{ display: "block", flexShrink: 0 }}
    />
  );
}
