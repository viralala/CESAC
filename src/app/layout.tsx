import type { Metadata, Viewport } from "next";
import { Fraunces, Rubik, JetBrains_Mono } from "next/font/google";
import { MotionConfig } from "framer-motion";

import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SkipLink } from "@/components/ui/skip-link";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CESAC: Community, Events & Programs",
    template: "%s | CESAC",
  },
  description:
    "CESAC is the community and events hub at Vishwakarma Institute of Technology, Pune: browse upcoming events, meet the people behind them, and register through the student portal.",
  openGraph: {
    type: "website",
    siteName: "CESAC",
    title: "CESAC: Community, Events & Programs",
    description:
      "The community and events hub at Vishwakarma Institute of Technology, Pune.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CESAC: Community, Events & Programs",
    description:
      "The community and events hub at Vishwakarma Institute of Technology, Pune.",
  },
};

export const viewport: Viewport = {
  themeColor: "#070c1a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${rubik.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col font-sans antialiased">
        <MotionConfig reducedMotion="user">
          <SkipLink />
          <SiteHeader />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </MotionConfig>
      </body>
    </html>
  );
}
