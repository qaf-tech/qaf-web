import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import "@/styles/reset.css";
import "@/styles/tokens.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "QAF Wallet",
  description: "Privacy-first universal wallet on XRPL",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "QAF Wallet",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1a1a2e",
};

const themeFlashScript = `(function(){try{var t=localStorage.getItem("qaf-theme");if(t==="dark"||t==="light"){document.documentElement.dataset.theme=t;}}catch(e){}})();`;

const swRegistrationScript = `if ("serviceWorker" in navigator) { window.addEventListener("load", function() { navigator.serviceWorker.register("/sw.js").catch(function(){}); }); }`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: theme flash prevention must run synchronously before paint
          dangerouslySetInnerHTML={{ __html: themeFlashScript }}
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: inline SW registration keeps PWA bootstrap out of the React tree
          dangerouslySetInnerHTML={{ __html: swRegistrationScript }}
        />
      </body>
    </html>
  );
}
