import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import Providers from "./providers";
import StoreNav from "../components/store/StoreNav";
import Footer from "../components/store/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-jb", display: "swap" });

export const metadata = {
  title: "Brainblast — The verified AI-training-data marketplace",
  description:
    "Subscribe to machine-verified Verified Trap Instances: proven error→fix→test records of real SDK bugs, pinned to exact versions and re-provable on demand.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        <Providers>
          <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <StoreNav />
            <main style={{ flex: 1 }}>{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
