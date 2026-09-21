import type { Metadata } from "next";

import { Legal, type LegalBlock } from "@/components/sections/legal";
import { SiteFooter } from "@/components/site/footer";
import { CESAC, CONTACT } from "@/lib/data/cesac";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What the CESAC website collects, what it does not, and who to contact about it. No analytics and no tracking cookies.",
  alternates: { canonical: "/privacy" },
};

/**
 * This describes what the site does TODAY, verified against the source.
 *
 * It changed substantially when accounts and registration landed: there is now
 * a database, an authentication provider, optional social sign-in and an
 * optional payment gateway. Every one of those is named below, because a
 * policy that still claimed "no third parties" would be a lie by omission.
 *
 * If any of it changes again, this page changes in the same commit. A privacy
 * policy that describes an intention rather than the build is worthless.
 */
const BLOCKS: readonly LegalBlock[] = [
  {
    heading: "The short version",
    body: [
      "This website does not track you. It runs no analytics, embeds no social widgets and shows no advertising. Nothing it holds is sold or shared with anyone outside the committee.",
      "You can read every page of this site, including the whole event brief, without signing in and without giving us anything at all. Browsing signed out sets no cookies.",
      "Everything we hold about a person exists because they made an account and registered a team. That is described in full below.",
    ],
  },
  {
    heading: "Where your data lives",
    body: [
      "Accounts, teams, payments records and chapter hand-ins are stored in a Supabase project hosted in Mumbai, India. Supabase is our database and authentication provider and processes this data on our behalf.",
      "The pages themselves are served by Vercel. Like any web server it records standard request information so pages can be delivered and abuse blocked, typically your IP address, the page requested, the time and your browser's user-agent string. We do not use those logs to build a profile of you and we do not combine them with your account.",
      "Nothing is copied to a third service for analysis, and no part of this data is used to train anything.",
    ],
  },
  {
    heading: "Making an account",
    body: [
      "You can sign up with an email address and a password, or with Google, GitHub or Facebook.",
      "If you use an email and password, we store your email address, the name you type, and a one-way hash of your password. The hash cannot be turned back into your password, and nobody on the committee can read it. Password checking is handled by Supabase Auth and the password you type is never written to our own tables or logs.",
      "If you use Google, GitHub or Facebook, you are sent to them to sign in and you give us no password at all. They then tell us your email address, your display name, and the address of your profile picture. We store those three things and nothing else. We do not receive, and cannot see, your password or anything else in that account.",
      "Choosing one of those buttons means your browser contacts that company, and that visit is covered by their privacy policy as well as this one. Nothing on this site contacts them until you press the button.",
    ],
  },
  {
    heading: "Cookies and local storage",
    body: [
      "The site sets no cookies for analytics, advertising or profiling, and none at all until you sign in.",
      "Signing in sets session cookies whose names begin with sb-, placed by Supabase Auth. They hold the tokens that keep you signed in and identify your account to the server. They are HttpOnly, so no script on the page can read them, and SameSite=Lax, so they are not sent from other sites. Signing out clears them.",
      "These cookies are strictly necessary: they exist only because you asked to sign in, they do nothing else, and there is no version of a sign-in that works without them.",
      "Four preferences are saved in your browser's local storage and nothing else is: cesac.consent records your answer to the cookie notice so it does not reappear on every page, cesac.music and cesac.music.volume remember whether you turned the music on the Attack on Token page on or off and how loud you set it, and cesac.cursor remembers whether you switched the cursor animation off.",
      "Local storage stays on your device. It is not sent to our server, not attached to requests, and nothing in it identifies you. You can clear it at any time through your browser's site-data settings.",
    ],
  },
  {
    heading: "Registering a team",
    body: [
      "Making a team stores the team name, a join code, and which two accounts belong to it. If the captain fills in the optional partner name and partner email before their partner joins, those are stored too, as a note for the organisers.",
      "Your team's details are visible to you, to your partner, and to CESAC organisers. They are not visible to other teams.",
      "Once organisers publish the leaderboard, every signed-in participant can see every registered team's name and score. Until they publish it, each team sees only its own. Nothing about a team is visible to anyone signed out.",
    ],
  },
  {
    heading: "The entry fee",
    body: [
      "There is no payment gateway on this site and no checkout window. You pay the entry fee by scanning a UPI code with your own banking app, and that payment happens entirely between your app and the bank.",
      "We never see, receive or store card numbers, UPI PINs, bank credentials or anything else you enter in your banking app. What reaches us is the transaction reference you choose to type in, so an organiser can match the payment against your entry.",
      "If an organiser records a payment for you, we store what they type: the method, the reference and any note they add.",
    ],
  },
  {
    heading: "Registering on a form",
    body: [
      "Entries for Attack on Token are collected on a form hosted by another company, not on this site. What you put into that form is held by them under their own privacy policy, and it reaches CESAC as a list of entries.",
      "We ask for your name, your team name, a WhatsApp number, and your partner's name, plus a VIT email address for each of you. The email addresses are what let us check that both of you are students here.",
      "Nothing you type into that form passes through this website, and this website sets no cookie on it.",
    ],
  },
  {
    heading: "Chapter hand-ins",
    body: [
      "What you hand in for each chapter is stored against your team: the text you write, and any files you upload.",
      "Uploaded files are held in private storage. They are not public, they have no guessable address, and they cannot be listed or read by other teams. When an organiser opens one for grading, the link generated expires within the hour.",
      "Hand-ins and scores are visible to your team and to organisers. Grading notes written by organisers are internal and are not shown to participants.",
    ],
  },
  {
    heading: "What organisers do is recorded",
    body: [
      "When an organiser verifies a payment, opens or closes a chapter, sets a score, applies a cut or changes somebody's role, that action is written to a log with their account and the time.",
      "That record exists so a disputed decision on the day can be checked. It is visible only to organisers.",
    ],
  },
  {
    heading: "How long it is kept",
    body: [
      "Account, team, payment and hand-in records are kept while the event runs and for as long as the committee needs them to settle results, issue certificates and reconcile the entry fees.",
      "After that they are of no further use to us, and you can ask for yours to be removed at any point before or after.",
    ],
  },
  {
    heading: "Children",
    body: [
      "This site is aimed at students and staff of the Computer Engineering department and the wider institute. It is not directed at children.",
    ],
  },
  {
    heading: "Your rights",
    body: [
      "If you have never signed in, the site holds nothing about you and there is nothing to export, correct or erase.",
      "If you hold an account, you can see everything attached to it from your console: your name and email, your team, your payment state and your hand-ins.",
      "Ask the Technical vertical to correct anything that is wrong, or to delete your account. Deleting an account removes the profile and, if you made the team, the team and its hand-ins with it.",
      "If you believe something on this site is handling your data in a way this page does not describe, tell us and we will fix it.",
    ],
  },
  {
    heading: "Changes to this policy",
    body: [
      "If the site starts collecting anything new, this page is updated in the same change that introduces it, and the date at the top moves.",
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
