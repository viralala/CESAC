import type { Metadata } from "next";

import { Legal, type LegalBlock } from "@/components/sections/legal";
import { SiteFooter } from "@/components/site/footer";
import { CESAC, CONTACT } from "@/lib/data/cesac";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What the CESAC website collects, what it does not, and who to contact about it. No analytics, no tracking cookies, no third-party scripts.",
  alternates: { canonical: "/privacy" },
};

/**
 * This describes what the site does TODAY, verified against the source: no
 * analytics package is installed, no cookie is set, no third-party script is
 * loaded, fonts are self-hosted at build time by next/font, and the sign-in
 * form has no backend behind it.
 *
 * If any of that changes, this page changes in the same commit. A privacy
 * policy that describes an intention rather than the build is worthless.
 */
const BLOCKS: readonly LegalBlock[] = [
  {
    heading: "The short version",
    body: [
      "This website does not track you. It sets no cookies, runs no analytics, embeds no social widgets, and loads no third-party scripts. There is no advertising on it and nothing on it is sold or shared.",
      "You can read every page of this site without giving us anything at all.",
    ],
  },
  {
    heading: "Cookies and local storage",
    body: [
      "The site sets no cookies for analytics, advertising or profiling.",
      "Three preferences are saved in your browser's local storage, and nothing else is: cesac.consent records your answer to the cookie notice so it does not reappear on every page, and cesac.music and cesac.music.volume remember whether you turned the music on the Attack on Token page on or off and how loud you set it.",
      "Local storage stays on your device. It is not a cookie, it is not sent to our server, it is not attached to requests, and it is not readable by anyone else. Nothing in it identifies you.",
      "You can clear it at any time through your browser's site-data settings. The notice will simply ask again and the music control will go back to its default.",
    ],
  },
  {
    heading: "What our host records",
    body: [
      "The site is served by Vercel. Like any web server, it records standard request information so that pages can be delivered and abuse can be blocked. That typically includes your IP address, the page requested, the time, and your browser's user-agent string.",
      "We do not use those logs to build a profile of you, and we do not combine them with anything else. They are handled under Vercel's own privacy terms as our hosting provider.",
    ],
  },
  {
    heading: "Fonts and images",
    body: [
      "Typefaces are downloaded at build time and served from this site's own domain, so loading a page does not send a request to Google Fonts or any other font host.",
      "All artwork on the site is original vector work created for CESAC. There are no character figures anywhere on it and no third-party or licensed assets are embedded in it.",
    ],
  },
  {
    heading: "Music and motion",
    body: [
      "The Attack on Token page can play a background track. The audio file is served from this site's own domain, not from a streaming service or an embedded player, so playing it contacts nobody. It can be turned off with the control in the bottom right corner, and once it is off it stays off.",
      "The falling petals that follow your cursor are drawn locally in your browser. Your pointer position is never recorded, stored or transmitted. If your device is set to reduce motion, or has no mouse pointer, they do not run at all.",
    ],
  },
  {
    heading: "The sign-in form",
    body: [
      "The sign-in page is a front-end shell. It is not yet connected to any server, database or authentication provider. Nothing you type into it is transmitted anywhere, stored, or logged, and submitting it only shows a message on screen.",
      "When accounts and event registration go live, this page will be updated before that happens to describe exactly what is collected, why, how long it is kept and who can see it.",
    ],
  },
  {
    heading: "Event registration",
    body: [
      "Registration for CESAC events is not currently handled on this website. If you register for an event through a form, spreadsheet or portal run elsewhere, that process is covered by whatever notice is given to you at the time, not by this page.",
    ],
  },
  {
    heading: "Children",
    body: [
      "This site is aimed at students and staff of the Computer Engineering department and the wider institute. It is not directed at children, and it collects nothing from anyone.",
    ],
  },
  {
    heading: "Your rights",
    body: [
      "Because the site holds no personal data about you, there is nothing for us to export, correct or erase. If that changes, this page will describe how to make such a request.",
      "If you believe something on this site is handling your data in a way this page does not describe, tell us and we will fix it.",
    ],
  },
  {
    heading: "Changes to this policy",
    body: [
      "If the site starts collecting anything, this page is updated in the same change that introduces it, and the date at the top moves.",
    ],
  },
  {
    heading: "Contact",
    body: [
      CONTACT.email
        ? `Questions about this policy can be sent to ${CONTACT.email}.`
        : `A committee inbox has not been published yet. ${CONTACT.note}`,
      `${CESAC.abbr}, ${CESAC.department}, ${CESAC.institute}.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Legal
        kicker="Legal"
        title="Privacy policy"
        updated="15 September 2026"
        intro="This page describes exactly what this website does with information about the people who visit it. It is written against the code that is actually deployed, not against an intention."
        blocks={BLOCKS}
      />
      <SiteFooter />
    </>
  );
}
