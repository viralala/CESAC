import type { Metadata, Viewport } from "next";
import { Anton, Archivo, Playfair_Display } from "next/font/google";

import "./globals.css";
import { CookieNotice } from "@/components/site/cookie-notice";
import { SiteHeader } from "@/components/site/header";
import { PetalCursor } from "@/components/site/petal-cursor";

// Tall condensed headline voice.
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: ["400"],
});

// Heavy wide statement type, and the UI voice at lighter weights.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

// Elegant serif italic, for asides and pull quotes.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["italic", "normal"],
  weight: ["400", "500", "600"],
});

// next/font downloads these at build time and serves them from this origin, so
// a page load makes no request to Google. That is a privacy claim the policy
// page makes, so it has to stay true: do not swap these for <link> tags.

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CESAC: Computer Engineering Student Activities Committee, VIT Pune",
    template: "%s | CESAC",
  },
  description:
    "CESAC is the student activities committee of the Computer Engineering department at VIT Pune. We run the department's events, and students across the department run us.",
  applicationName: "CESAC",
  openGraph: {
    type: "website",
    siteName: "CESAC",
    title: "CESAC: Computer Engineering Student Activities Committee",
    description:
      "The student activities committee of the Computer Engineering department at VIT Pune.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CESAC: Computer Engineering Student Activities Committee",
    description:
      "The student activities committee of the Computer Engineering department at VIT Pune.",
  },
};

export const viewport: Viewport = {
  themeColor: "#12656f",
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
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-teal focus:px-5 focus:py-2.5 focus:text-cream"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <CookieNotice />
        <PetalCursor />
      </body>
    </html>
  );
}
