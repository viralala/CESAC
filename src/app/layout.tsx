import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Anton, Archivo, Baloo_2, Kalam, Oswald, Playfair_Display } from "next/font/google";

import "./globals.css";
import { CookieNotice } from "@/components/site/cookie-notice";
import { CursorToggle } from "@/components/site/cursor-toggle";
import { SiteHeader } from "@/components/site/header";
import { ThemeTransition } from "@/components/site/theme-transition";
import { getViewer } from "@/lib/auth/guard";
import { PetalCursor } from "@/components/site/petal-cursor";
import { THEME_SCRIPT } from "@/lib/theme";

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

// The HR Final Boss route's own voices: a round cartoon display, and a
// cursive that also carries Devanagari for the occasional Hindi word.
const baloo2 = Baloo_2({
  variable: "--font-baloo2",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin", "devanagari"],
  weight: ["300", "400", "700"],
});

// The Attack on Token route's voice, and the one the sponsorship deck is set
// in. Scoped to that route by .theme-aot in globals.css.
const oswald = Oswald({
  variable: "--font-oswald-src",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#12656f" },
    { media: "(prefers-color-scheme: dark)", color: "#0e171b" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The header is a client component and cannot read a session, so the one
  // fact it needs is read here and handed down. getViewer is memoised per
  // request, so a page that also guards on it does not pay for this twice.
  const viewer = await getViewer();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${anton.variable} ${archivo.variable} ${playfair.variable} ${baloo2.variable} ${kalam.variable} ${oswald.variable} h-full`}
      // The theme script below sets data-theme on this element before React
      // gets to it, so the server's copy and the browser's differ on purpose.
      suppressHydrationWarning
    >
      <head>
        {/* Light or dark, decided before the first paint so a dark device
            never sees a frame of the light site. See lib/theme.ts. Inline
            and tiny on purpose: it is the one script that has to run before
            anything else is drawn. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-teal focus:px-5 focus:py-2.5 focus:text-cream"
        >
          Skip to content
        </a>
        <SiteHeader signedIn={Boolean(viewer)} consoleHref={viewer?.isAdmin ? "/admin" : "/dashboard"} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <CookieNotice />
        <PetalCursor />
        <CursorToggle />
        <ThemeTransition />
        {/* Visitor counts, cookieless: see the privacy page for what it keeps. */}
        <Analytics />
      </body>
    </html>
  );
}
