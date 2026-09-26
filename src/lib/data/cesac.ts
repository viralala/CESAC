/**
 * CESAC, the community.
 *
 * Every fact here comes from the build brief or from "CESAC TEAM.xlsx". There
 * are no attendance figures, no founding year, no past-event counts and no
 * testimonials, because none of those were supplied. Where something is not
 * known yet it says so in the copy rather than being filled in with a
 * plausible number. Do not add one.
 */

export const CESAC = {
  abbr: "CESAC",
  name: "Computer Engineering Student Activities Committee",
  department: "Computer Engineering",
  institute: "Vishwakarma Institute of Technology, Pune",
  short: "VIT Pune",
  /** The hero has to answer "what is this" in one read. This is that sentence. */
  what:
    "Not a club. A community built by the Computer Engineering department at VIT Pune, for the department. We run the department's events, and students from across the department run us.",
  /** Used under the identity plate. Structural facts only. */
  structure:
    "CESAC sits under the department's faculty leadership. A board of executives steers it, and four verticals carry the work.",
} as const;

/**
 * What the committee actually does, framed as the four things a student can
 * turn up for. These describe the committee's own remit, not outcomes.
 */
export const DOES = [
  {
    id: "events",
    index: "01",
    title: "Events",
    jp: "行事",
    body: "Competitions, workshops and department-wide activities, planned and run end to end by students.",
    pop: "azure",
  },
  {
    id: "build",
    index: "02",
    title: "Build",
    jp: "制作",
    body: "The platforms, tooling and leaderboards our events run on are built in-house by the Technical vertical.",
    pop: "violet",
  },
  {
    id: "tell",
    index: "03",
    title: "Tell",
    jp: "発信",
    body: "Key art, copy, capture and recaps, so what happens in the department does not stay in one room.",
    pop: "lime",
  },
  {
    id: "connect",
    index: "04",
    title: "Connect",
    jp: "渉外",
    body: "Sponsors, partners, judges and mentors, bringing people from outside the campus into the room.",
    pop: "pink",
  },
] as const;

export type EventStatus = "open" | "announced" | "past";

/**
 * When an event is, as a calendar needs it.
 *
 * Separate from `when`, which is the sentence the cards print and can say
 * "venue TBA" in a way a timestamp cannot. Null until there is a real date,
 * and the site says so rather than counting down to a guess. An all-day event
 * is counted in India time, start and end both inclusive.
 *
 * The committee sets these from the Entries page of the console now, and the
 * database copy wins; these are what the site shows when it cannot ask.
 */
export type EventSchedule = {
  /** ISO 8601 with an offset. For an all-day event, midnight IST on day one. */
  start: string;
  /** Same shape. For an all-day event, midnight IST on the last day. */
  end: string | null;
  allDay: boolean;
  venue: string | null;
};

export type CesacEvent = {
  slug: string;
  name: string;
  jp: string;
  kicker: string;
  blurb: string;
  /** Free text, because the date genuinely is not set yet. */
  when: string;
  status: EventStatus;
  href: string;
  schedule: EventSchedule | null;
};

/**
 * The events index.
 *
 * Two entries, because two events have been supplied. An empty-looking list
 * is the correct output here: padding it with invented past events would be
 * exactly the fabrication the brief rules out.
 */
export const EVENTS: readonly CesacEvent[] = [
  {
    slug: "attack-on-token",
    name: "Attack on Token",
    jp: "進撃のトークン",
    kicker: "Prompt engineering hackathon",
    blurb:
      "Eighty teams of two, three chapters, one champion. Prompt an anime still into a film, survive a locked-prompt leaderboard, then build something out of three drawn chits.",
    when: "10 October 2026 · Venue: TBA",
    status: "announced",
    href: "/events/attack-on-token",
    // No hours and no venue have been set, so it goes into a calendar as one
    // whole day.
    schedule: {
      start: "2026-10-10T00:00:00+05:30",
      end: "2026-10-10T23:59:59+05:30",
      allDay: true,
      venue: null,
    },
  },
  {
    slug: "hr-final-boss",
    name: "HR Final Boss",
    jp: "साक्षात्कार",
    kicker: "Speaker session",
    blurb:
      "Free entry, open to 100 to 200 people. A speaker with 30+ years in HR, based in Africa, takes HR and technical interview questions live. Name withheld until announced.",
    when: "Date and venue to be announced",
    status: "announced",
    href: "/events/hr-final-boss",
    schedule: null,
  },
];

/** The band that runs across the community page. */
export const RIBBON_WORDS = [
  "Computer Engineering",
  "VIT Pune",
  "学生委員会",
  "Student run",
  "CESAC",
] as const;

/**
 * Where to reach the committee.
 *
 * No public inbox or social handle has been supplied for CESAC, so the page
 * says how to reach the department instead of printing an address that might
 * not be monitored. Replace `email` with the real committee inbox when there
 * is one, and the contact card will start rendering it.
 */
export const CONTACT = {
  email: "",
  note: "The committee is reachable through the Computer Engineering department office at VIT Pune.",
} as const;
