import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "brainblast registry",
  description: "Registry, pack index & $BRAIN staking for the brainblast rule-pack flywheel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
