import { CESAC, CONTACT } from "@/lib/data/cesac";
import { REGISTER } from "@/lib/data/event";

/**
 * The questions the committee answers most, and the answers.
 *
 * Every answer here describes what the site actually does, checked against
 * the code on the day it was written, and says so where something is decided
 * elsewhere. Nothing is promised that the build does not do. When a feature
 * changes, the answer about it changes in the same commit, the same rule the
 * privacy page lives by.
 *
 * Grouped so the page can be scanned by topic, with an id per group so a
 * link can land on one.
 */

export type Faq = { q: string; a: readonly string[] };
export type FaqGroup = { id: string; title: string; items: readonly Faq[] };

export const FAQ: readonly FaqGroup[] = [
  {
    id: "cesac",
    title: "CESAC",
    items: [
      {
        q: "What is CESAC?",
        a: [
          `The ${CESAC.name}, of the ${CESAC.department} department at ${CESAC.institute}. ${CESAC.what}`,
        ],
      },
      {
        q: "How is the committee put together?",
        a: [
          `${CESAC.structure} The four are Technical, Media and Content, Event and Coordination, and Industry and Outreach. Everybody on it is on the People page, and every name there opens that person's own page.`,
        ],
      },
      {
        q: "Can I join the committee?",
        a: [
          `Committee intake happens through the department. Every ${CESAC.department} student can enter what CESAC runs, whether or not they are on the committee.`,
        ],
      },
      {
        q: "How do I reach the committee?",
        a: [
          CONTACT.email
            ? `Write to ${CONTACT.email}. Questions about your account or your record are best asked from the Questions tab in your console, where the answer stays next to the question.`
            : `${CONTACT.note} If you have an account, the Questions tab in your console is the quickest way: the answer comes back in the same place.`,
        ],
      },
    ],
  },
  {
    id: "account",
    title: "Your account",
    items: [
      {
        q: "Do I need to sign up?",
        a: [
          "Probably not. Accounts for the department's students were made ahead of time from the department's own lists, so on your first visit you only sign in. The Sign in page has a tab for making an account if yours is not there.",
        ],
      },
      {
        q: "What is my first password?",
        a: [
          "If the department made your account, your email is your VIT address and your password is that same address, typed again.",
          "You are asked to choose a new one straight away, and nothing else opens until you do, because everybody in your class knows the first one.",
        ],
      },
      {
        q: "Why am I asked for a photo?",
        a: [
          "Wherever the site ranks students, on the front page's standouts, on the full standouts list and on the ranking in your console, your name is shown with your photo. It is asked for once, right after your password, and your console opens as soon as it is saved.",
          "Your browser crops it square and shrinks it before it is sent, which also drops the location a phone photo carries. You can change it any time by pressing your photo in the bar at the top of your console.",
        ],
      },
      {
        q: "I have forgotten my password.",
        a: [
          "Press Forgot password, under the password box on the Sign in page, to have a reset link sent to the address on your account. If the link does not come, or that address no longer reaches you, ask the committee: an organiser can set a temporary password on your account, and you choose your own the first time you use it.",
          "If you first signed in with Google, GitHub or Facebook, use that same button; there is no password to reset.",
        ],
      },
      {
        q: "Can I change my email address?",
        a: [
          "Not yourself. It is what the account signs in with and what the department's lists were matched on. If it is wrong, ask the committee.",
        ],
      },
    ],
  },
  {
    id: "events",
    title: "Events and entries",
    items: [
      {
        q: "How do I enter an event?",
        a: [
          "From the Events tab in your console. Entries open one event at a time, so most events are locked most of the year; when the committee opens one, the form appears there.",
          `Attack on Token is the exception: teams register on its own form${REGISTER.formUrl ? ", linked from every Register button on the event page" : ", which opens from the event page when it is live"}.`,
        ],
      },
      {
        q: "Can I enter with a friend?",
        a: [
          "For an event entered in pairs, you name your partner by their VIT email. They need an account on the site, and neither of you can already be entered. Your partner sees the entry and your name on their own console; the fee, if there is one, is yours to record.",
        ],
      },
      {
        q: "How do I pay an entry fee?",
        a: [
          `There is no payment gateway on this site. You pay by UPI from your own banking app and type the transaction reference in, and an organiser checks it against the account. Attack on Token is ₹${REGISTER.amountInr} per team, paid on its registration form.`,
        ],
      },
      {
        q: "Can I put an event in my calendar?",
        a: [
          "Yes, once it has a date. Every event with one shows a countdown and an Add to calendar button, on the events page, on the front page, on the event's own page and in your console. Google Calendar opens with the event filled in, and the .ics file works with Apple Calendar, Outlook and phones. An event without a date says so, and the button appears when the date is set.",
        ],
      },
    ],
  },
  {
    id: "record",
    title: "Your record and the standouts",
    items: [
      {
        q: "What can I put on my record?",
        a: [
          "Hackathons, competitions, paper presentations and workshops, and publications: journal papers, conference papers, books and book chapters. Each one needs one file as proof when you add it, a PDF, PNG or JPEG of up to 4MB, and can carry three optional photos.",
        ],
      },
      {
        q: "How are points worked out?",
        a: [
          "Each record scores a base, which is what you came away with or what kind of publication it is, plus a bonus for how far it reached, from institute to international. The whole scale is on the Ranking tab of your console, read from the same numbers the board is counted with.",
          "A record counts from the moment it is saved. An organiser or verifier checks it afterwards.",
        ],
      },
      {
        q: "What is the standouts list?",
        a: [
          "The students the department is putting its name to, in categories the committee sets: most points, most places won, most published, and ones the committee names by hand. The front page shows the top of each; the Standouts page has everybody, with a search.",
          "It shows a name, a year, one number and a photo, and nothing else about you.",
        ],
      },
      {
        q: "I would rather not be on it.",
        a: [
          "Switch yourself off it from My record in your console. You disappear from the public standouts straight away and stay on the ranking inside the console, which only signed-in students see.",
        ],
      },
      {
        q: "How do I ask about my certificate?",
        a: [
          "From the Questions tab. Give it a title in your own words and say what happened. You can have five questions waiting at once, and the answer appears under the question.",
        ],
      },
    ],
  },
  {
    id: "site",
    title: "The site",
    items: [
      {
        q: "Is there a dark mode?",
        a: [
          "Yes. The sun and moon button in the menu bar switches it, and your browser remembers the choice. Until you choose, the site follows your device's own setting. The two event pages keep their own looks either way.",
        ],
      },
      {
        q: "Does the site track me?",
        a: [
          "No. No analytics, no advertising, no tracking cookies, and no cookies at all until you sign in. The Privacy policy lists everything the site stores, including the five preferences it keeps in your browser.",
        ],
      },
      {
        q: "How do I get my profile page changed?",
        a: [
          "Committee pages are filled from the committee's roster form. Ask the committee to change or remove anything on yours; organisers edit it from the console, and the change is live at once.",
        ],
      },
    ],
  },
];
