import type { Metadata } from "next";

import { Legal, type LegalBlock } from "@/components/sections/legal";
import { SiteFooter } from "@/components/site/footer";
import { CESAC, CONTACT } from "@/lib/data/cesac";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description:
    "The terms that apply to using the CESAC website and to entering CESAC events at VIT Pune.",
  alternates: { canonical: "/terms" },
};

const BLOCKS: readonly LegalBlock[] = [
  {
    heading: "Who runs this site",
    body: [
      `This website is operated by ${CESAC.abbr}, the ${CESAC.name}, a student body of the ${CESAC.department} department at ${CESAC.institute}.`,
      "Using the site means you accept the terms on this page. If you do not accept them, please do not use the site.",
    ],
  },
  {
    heading: "What is on the site",
    body: [
      "Event details on this site, including dates, venues, team sizes, entry fees, formats, judging and prizes, are published as they are confirmed and can change. Anything not yet fixed is marked as such rather than guessed at.",
      "Where a detail here conflicts with the rules given to participants at the event itself, the rules given at the event apply.",
      "Nothing on this site is an offer, a guarantee of a place, or a contract until a registration is confirmed to you directly.",
    ],
  },
  {
    heading: "Entering an event",
    body: [
      "Eligibility, team size and entry fees are stated on each event page and apply as written there.",
      "Entry fees, where charged, cover the running of the event. Refund and cancellation terms are given at the point of registration.",
      "Organisers may disqualify an entry for plagiarism, for breaking the stated rules of a round, for misrepresenting who did the work, or for conduct that disrupts the event or other participants.",
      "Events may be rescheduled, changed in format or cancelled. If that happens, registered participants are told directly.",
    ],
  },
  {
    heading: "Your work",
    body: [
      "You keep ownership of anything you create during a CESAC event.",
      "By entering, you allow CESAC and the department to show your submission and your name in event recaps, result announcements, galleries and future promotion of CESAC events, with credit. If you would rather your work were not shown, tell the organisers and it will not be.",
      "You are responsible for making sure you are allowed to submit what you submit, including anything generated with third-party tools, and for complying with the terms of any tool a round requires you to use.",
    ],
  },
  {
    heading: "Accounts",
    body: [
      "Accounts are not live on this site yet. When they are, you will be responsible for keeping your credentials to yourself and for anything done through your account, and these terms will be updated to cover it.",
    ],
  },
  {
    heading: "Acceptable use",
    body: [
      "Do not attempt to break, overload, scrape at scale, or gain unauthorised access to this site or anything behind it.",
      "Do not use CESAC branding or artwork from this site to imply that CESAC endorses something it does not.",
    ],
  },
  {
    heading: "Intellectual property",
    body: [
      "The CESAC name and logo belong to the committee and the department.",
      "The design, copy, illustrations and code of this site are original work made for CESAC. All artwork is original vector drawing. There are no character figures on the site and no licensed or third-party visual assets are used anywhere on it.",
      "Any resemblance in visual style to a genre is stylistic. No affiliation with, or endorsement by, any anime series, studio or publisher is claimed or implied.",
      "The background track on the event page is licensed or owned separately from the rest of the site and is not covered by any permission given here. Do not reuse it.",
    ],
  },
  {
    heading: "Links to other sites",
    body: [
      "Where this site links somewhere else, that site is not under our control and these terms do not cover it.",
    ],
  },
  {
    heading: "Liability",
    body: [
      "The site is provided as it is. We take reasonable care to keep it accurate and available, but we do not promise it will be uninterrupted or error free.",
      "Nothing in these terms limits any liability that cannot lawfully be limited.",
    ],
  },
  {
    heading: "Changes",
    body: [
      "These terms can change. The date at the top of this page shows when they last did. Continuing to use the site after a change means accepting the updated terms.",
    ],
  },
  {
    heading: "Governing law",
    body: [
      "These terms are governed by the laws of India, and the courts at Pune, Maharashtra have jurisdiction over any dispute arising from them.",
    ],
  },
  {
    heading: "Contact",
    body: [
      CONTACT.email
        ? `Questions about these terms can be sent to ${CONTACT.email}.`
        : `A committee inbox has not been published yet. ${CONTACT.note}`,
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <Legal
        kicker="Legal"
        title="Terms and conditions"
        updated="15 September 2026"
        intro="These terms cover using this website and entering the events listed on it. They are written in plain language on purpose."
        blocks={BLOCKS}
      />
      <SiteFooter />
    </>
  );
}
