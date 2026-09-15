/**
 * Participant-facing facts only, the same rule the Attack on Token data file
 * follows.
 *
 * What was actually supplied: free entry, a 100 to 200 seat audience, a
 * 2 to 3 hour interactive session, and a speaker with 30+ years of HR
 * experience based in Africa. The speaker's name is being withheld on
 * purpose ahead of the announcement, so nothing in this file carries one, a
 * real name, or a real photo.
 *
 * The agenda timings and the sample question prompts below are added
 * flavour, written with the user's explicit go-ahead to fill in a few
 * details for an event that is still TBA. They are framed as approximate and
 * illustrative on the page itself rather than stated as fact, which is the
 * line the rest of the site holds everywhere else.
 */

export const HRFB = {
  name: "HR Final Boss",
  kicker: "Speaker session",
  host: "CESAC / VIT Pune",
  tagline: "One boss fight. Every question you have been sitting on.",
  devanagari: "साक्षात्कार",
  devanagariGloss: "sākṣātkār — interview",
  creed: "No entry fee. No dress code. No mercy on hard questions.",
  dateVenue: "Date and venue: TBA",
  format: "In person, interactive Q&A",
} as const;

export type HRPop = "azure" | "maya" | "ink";

export const HR_VITALS = [
  { value: "Free", label: "Entry", note: "No registration fee" },
  { value: "100–200", label: "Audience", note: "Open seating" },
  { value: "2–3", label: "Hours", note: "One session, start to finish" },
  { value: "Live", label: "Q&A", note: "Ask anything, on mic" },
] as const;

/** What the page can say about the speaker without saying who they are. */
export const SPEAKER_TEASE = {
  status: "Boss file: access restricted",
  facts: [
    { label: "Experience", value: "30+ years in HR" },
    { label: "Based in", value: "Africa" },
    { label: "Class", value: "Final boss of the interview process" },
  ],
  note: "Full profile unlocks once the date is announced.",
} as const;

export type QuestionGroup = {
  id: string;
  title: string;
  pop: HRPop;
  prompts: readonly string[];
};

/**
 * Illustrative prompts, not a submitted question bank. The page says so.
 */
export const QUESTION_GROUPS: readonly QuestionGroup[] = [
  {
    id: "interview",
    title: "HR & interviews",
    pop: "azure",
    prompts: [
      "What actually happens after you submit a resume?",
      "How honest should you be about a gap or a low grade?",
      "What makes an answer to “tell me about yourself” land?",
      "Is salary negotiation realistic for a fresher?",
    ],
  },
  {
    id: "technical",
    title: "Technical rounds",
    pop: "maya",
    prompts: [
      "How much DSA does a real interview actually need?",
      "What do panels listen for in a system design answer?",
      "Is it ever fine to say “I don't know” out loud?",
      "How do interviewers read a candidate who freezes?",
    ],
  },
  {
    id: "career",
    title: "Career & growth",
    pop: "ink",
    prompts: [
      "Campus to corporate: what actually changes?",
      "How do you choose between two offers?",
      "Does a personal brand matter this early?",
      "What separates a good first year from a forgettable one?",
    ],
  },
] as const;

/** A rough shape for the room, not a locked schedule. */
export const AGENDA = [
  { step: "01", title: "Doors open", time: "~10 min", note: "Seats fill, no assigned seating." },
  { step: "02", title: "The keynote", time: "~45–60 min", note: "The session's main address." },
  {
    step: "03",
    title: "Ask anything",
    time: "~60–90 min",
    note: "Open floor and mic, HR and technical both fair game.",
  },
  { step: "04", title: "Closing", time: "~15 min", note: "Wrap up and thank yous." },
] as const;

/**
 * Left empty on purpose. Drop a LinkedIn vanity handle in here when there is
 * one to show, and the embed on the page starts rendering it. Whoever sets
 * this should weigh it against the tease above: a public LinkedIn badge
 * carries a name and a photo.
 */
export const LINKEDIN = {
  username: "",
  label: "Follow along on LinkedIn",
} as const;
