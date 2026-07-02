import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import Providers from "./providers";
import Sidebar from "../components/shell/Sidebar";
import Topbar from "../components/shell/Topbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-jb", display: "swap" });

export const metadata = {
  title: "Brainblast — Verified Trap Registry",
  description:
    "A marketplace for Verified Trap Instances: proven error→fix→test records of real SDK footguns, pinned to exact versions and re-provable on demand.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        <Providers>
          <div style={{ display: "flex", minHeight: "100vh", position: "relative", zIndex: 1 }}>
            <Sidebar />
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
              <Topbar />
              <main style={{ flex: 1, padding: "26px 28px 40px", maxWidth: 1460, width: "100%" }}>{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
