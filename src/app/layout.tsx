import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? "/nandix" : "";

export const metadata: Metadata = {
  title: "NANDIX | The Sovereign Deployment",
  description: "Powered by AETHER P2P Infrastructure.",
  manifest: `${basePath}/manifest.json`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AETHER",
  },
  icons: {
    icon: `${basePath}/favicon.ico`,
  },
};

export const viewport = {
  themeColor: "#00FFFF",
};

import { AetherProvider } from "@/lib/aether/sdk/context/AetherContext";
import { PWARegistry } from "@/components/sentinel/PWARegistry";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${firaCode.variable} antialiased sentinel-grid min-h-screen`}
      >
        <AetherProvider>
          <PWARegistry />
          {children}
        </AetherProvider>
      </body>
    </html>
  );
}
