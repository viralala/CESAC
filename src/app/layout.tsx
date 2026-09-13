import type { Metadata, Viewport } from "next";
import { Anton, Archivo, Playfair_Display } from "next/font/google";

import "./globals.css";
import { SiteHeader } from "@/components/site/header";

// Crypko's tall condensed headline voice.
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: ["400"],
});

// Reika's heavy wide statement type, and the UI voice at lighter weights.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

// Yonika's elegant serif italic, for asides and pull quotes.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["italic", "normal"],
  weight: ["400", "500", "600"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Attack on Token — Prompt Engineering Hackathon | CESAC, VIT Pune",
    template: "%s | Attack on Token",
  },
  description:
    "Three chapters. One battlefield. Attack on Token is CESAC's prompt engineering hackathon at VIT Pune: Vision Forge, the Token Trials and Fusion Awakening.",
  openGraph: {
    type: "website",
    siteName: "Attack on Token",
    title: "Attack on Token — Prompt Engineering Hackathon",
    description: "Three chapters. One battlefield. Hosted by CESAC, Computer Engineering, VIT Pune.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Attack on Token — Prompt Engineering Hackathon",
    description: "Three chapters. One battlefield. Hosted by CESAC, Computer Engineering, VIT Pune.",
  },
};

export const viewport: Viewport = {
  themeColor: "#15141a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${anton.variable} ${archivo.variable} ${playfair.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-5 focus:py-2.5 focus:text-cream"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
