/**
 * Participant-facing facts only.
 *
 * The sponsorship deck also carries the production plan — staffing, AV, grading
 * pipeline, pre-launch gates, fallback schedules. None of that belongs on a
 * page whose only job is to get a duo to register, so none of it is here.
 * Every number below is still transcribed from the deck; where the deck says
 * TBD, this file says TBA.
 */

export const EVENT = {
  name: "Attack on Token",
  kicker: "Prompt Engineering Hackathon",
  host: "CESAC / VIT Pune",
  tagline: "Three chapters. One battlefield.",
  jp: "進撃のトークン",
  creed: "Forge the prompt. Survive the token.",
  dateVenue: "10 October 2026 · Venue: TBA",
} as const;

/** The four numbers a team needs before they can decide to enter. */
export const VITALS = [
  { value: "80", label: "Teams", note: "160 students, capped" },
  { value: "2", label: "Per team", note: "Duos only" },
  { value: "₹125", label: "Entry", note: "₹62.50 a head" },
  { value: "2", label: "Days", note: "Chapters I–III" },
] as const;

export type Pop = "azure" | "violet" | "lime" | "pink";

export type Chapter = {
  id: string;
  numeral: string;
  index: string;
  title: string;
  jp: string;
  /** One line. If it needs two, it is not a chapter summary. */
  task: string;
  /** What the team actually hands in. */
  deliver: string;
  tools: string;
  from: string;
  to: string;
  weight: number;
  pop: Pop;
};

export const CHAPTERS: readonly Chapter[] = [
  {
    id: "vision-forge",
    numeral: "I",
    index: "01",
    title: "Vision Forge",
    jp: "幻視の鍛冶",
    task: "Prompt an anime-style still, then extend it into a 10 to 15 second video, in as few prompts as you can.",
    deliver: "Image + video + prompt log",
    tools: "Gemini · Google Flow (Veo)",
    from: "80",
    to: "20",
    weight: 20,
    pop: "azure",
  },
  {
    id: "token-trials",
    numeral: "II",
    index: "02",
    title: "Token Trials",
    jp: "token の試練",
    task: "Write one system prompt. It gets locked, then run against hidden adversarial tests on a live leaderboard.",
    deliver: "One system prompt",
    tools: "45–60 min · hard lock",
    from: "20",
    to: "8",
    weight: 35,
    pop: "violet",
  },
  {
    id: "fusion-awakening",
    numeral: "III",
    index: "03",
    title: "Fusion Awakening",
    jp: "融合の覚醒",
    task: "Draw three chits (a user, a capability, a twist) and build one coherent thing that uses all three.",
    deliver: "Prototype + 3-min pitch",
    tools: "2.5 hr build · mentors on call",
    from: "8",
    to: "1",
    weight: 45,
    pop: "lime",
  },
];

/**
 * Registration, and the one place its address lives.
 *
 * Entries and the entry fee are both taken on the form, and neither is taken
 * here. There is no payment gateway in front of it: a gateway charges a
 * percentage of every team's ₹125 to do a job a UPI code already does for
 * nothing.
 *
 * The QR code is deliberately not on this site. A payment code on a public
 * page invites somebody to pay without registering, which leaves ₹125 nobody
 * can attribute to a team, so it lives on the form beside the box that asks
 * for the reference. The image is served from `public/aot/upi-qr.jpg`, which
 * is where the form reads it from, so that file stays put.
 *
 * `formUrl` is the switch. Empty means the form is not live yet, and every
 * button on the event page says so rather than opening a dead link.
 */
export const REGISTER = {
  /**
   * PASTE THE FORM ADDRESS HERE. This one line is the whole of moving the
   * event onto a different form; nothing else on the site has to change.
   *
   * Use the address a student opens: a `forms.gle/...` link, or one ending in
   * `/viewform`. Never one ending in `/edit`, which would hand every student
   * the keys to the form itself.
   *
   * `scripts/attack-on-token-form.gs` builds the Google Forms version and
   * prints the address to paste when it finishes.
   */
  formUrl: "https://forms.gle/4yjh8qajJS8iixM47",
  amountInr: 125,
  /**
   * Not rendered anywhere. Kept here because the form carries these and the
   * two should not be allowed to drift apart without somebody noticing.
   */
  upi: {
    id: "viralnotviral@oksbi",
    payee: "Viral Not Viral",
    qr: "/aot/upi-qr.jpg",
  },
} as const;

/** Whether the form address has actually been filled in. */
export const REGISTRATION_IS_LIVE: boolean = REGISTER.formUrl.length > 0;

/**
 * The one event whose entries are collected on the form rather than in the
 * console. The console reads this so it hands a student to the form instead
 * of opening a second way in that nobody is reading the other end of.
 */
export const REGISTER_SLUG = "attack-on-token";

/** How a team gets in. Four steps, no prose. */
export const ENTRY = [
  { step: "01", title: "Find a partner", note: "Teams are exactly two, both on VIT addresses." },
  { step: "02", title: "Fill the form", note: "Both names, both emails, one WhatsApp number." },
  { step: "03", title: "Pay ₹125", note: "The UPI code is on the form. Keep the reference." },
  { step: "04", title: "Show up on Day 1", note: "All 80 teams start at Chapter I." },
] as const;

export const AWARDS = [
  { chapter: "I", title: "Best Vision Forge Piece", note: "Chapter I top score", pop: "azure" },
  { chapter: "II", title: "Top Token Tamer", note: "Leaderboard #1", pop: "violet" },
  { chapter: "III", title: "Best Frankenstein Build", note: "Strongest synthesis", pop: "lime" },
  { chapter: "III", title: "Most Useful", note: "Highest usefulness", pop: "lime" },
  { chapter: "III", title: "Best Pivot", note: "Smartest chit trade", pop: "lime" },
  { chapter: "★", title: "Audience Favourite", note: "Audience vote", pop: "pink" },
] as const;
