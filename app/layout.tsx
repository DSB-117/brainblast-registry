export const metadata = {
  title: "brainblast registry",
  description: "Registry & telemetry server for brainblast rule packs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
