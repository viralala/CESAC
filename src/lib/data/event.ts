/**
 * Every number, rule and rubric here is transcribed from the
 * "Attack on Token" CESAC / VIT Pune sponsorship deck. Nothing is invented:
 * where the deck says TBD or placeholder, this file says TBA.
 */

export const EVENT = {
  name: "Attack on Token",
  kicker: "Prompt Engineering Hackathon",
  host: "CESAC / VIT Pune",
  tagline: "Three chapters. One battlefield.",
  jp: "進撃のトークン",
  lede: "Where prompt engineering stops being a skill test — and becomes a progression arc, built for CESAC, VIT Pune.",
  creed: "Forge the prompt. Survive the token. Build what comes next.",
  dateVenue: "Date / venue to be announced",
} as const;

export const SNAPSHOT = [
  { value: "100", label: "Student cap", note: "50 teams maximum" },
  { value: "2", label: "Team size", note: "Duo only" },
  { value: "₹200", label: "Entry / team", note: "₹100 per head" },
  { value: "3", label: "Chapters", note: "Vision → Trials → Build" },
] as const;

export const WHY = [
  {
    n: "1",
    title: "Visible",
    body: "Your brand lives inside the competition system — challenge identity, live leaderboard moments, finalist build sprint, awards and final showcase.",
  },
  {
    n: "2",
    title: "Relevant",
    body: "Centered on practical prompt engineering: visual generation, adversarial instruction design, automated evaluation and prototype synthesis.",
  },
  {
    n: "3",
    title: "Memorable",
    body: "The chapter format creates a narrative arc: forge the vision, survive the trials, then fuse three constraints into one working idea.",
  },
] as const;

export type Chapter = {
  id: string;
  numeral: string;
  index: string;
  wall: string;
  title: string;
  jp: string;
  blurb: string;
  from: string;
  to: string;
  advances: string;
  weight: number;
  objective: string;
  flow: readonly string[];
  table?: { head: readonly [string, string]; rows: readonly (readonly [string, string])[] };
  rubric?: readonly { label: string; pct: number }[];
  note?: { label: string; body: string };
};

export const CHAPTERS: readonly Chapter[] = [
  {
    id: "vision-forge",
    numeral: "I",
    index: "01",
    wall: "Wall I",
    title: "Vision Forge",
    jp: "幻視の鍛冶",
    blurb: "Image + video generation, with prompt efficiency as the hidden weapon.",
    from: "50",
    to: "20",
    advances: "Top 20",
    weight: 20,
    objective:
      "Translate a creative brief into a coherent anime-style image, then extend that image into a 10–15 second video — using as few prompts as possible.",
    flow: [
      "Inspiration reel — ~5 min",
      "Stage A: image generation in Gemini",
      "Stage B: video in Google Flow / Veo",
      "Submit image + video + full prompt log",
    ],
    table: {
      head: ["Element", "Locked format"],
      rows: [
        ["Image tool", "Gemini — standardized across teams"],
        ["Video tool", "Google Flow, Veo model only"],
        ["Verification", "Prompt log / screen recording / history"],
        ["Disqualification", "Wrong tool, non-AI assets, missed deadline"],
      ],
    },
    rubric: [
      { label: "Image–video correlation / coherence", pct: 30 },
      { label: "Thematic understanding & creativity", pct: 35 },
      { label: "Prompt efficiency", pct: 20 },
      { label: "Technical / aesthetic quality", pct: 15 },
    ],
    note: {
      label: "Production note",
      body: "Load-test the venue network and tool access before event day. The plan assumes up to 50 teams can be active around the same time.",
    },
  },
  {
    id: "token-trials",
    numeral: "II",
    index: "02",
    wall: "Wall II",
    title: "Token Trials",
    jp: "token の試練",
    blurb:
      "Pure prompt engineering. One system prompt. Hidden adversarial tests. Live leaderboard.",
    from: "20",
    to: "8",
    advances: "Top 8",
    weight: 35,
    objective:
      "Each team writes one system prompt for the same fixed instruction-tuned model. The prompt is tested against public samples, then locked and run through a hidden benchmark.",
    flow: [
      "Tier 1: deterministic Python / regex tests",
      "Tier 2: LLM-as-a-Judge scoring /20",
      "Normalize 50 + 50 = leaderboard /100",
      "Reveal results live as grading completes",
    ],
    table: {
      head: ["Team experience", "Detail"],
      rows: [
        ["Writing window", "45–60 min prompt-writing window"],
        ["Lock", "Hard submission lock"],
        ["Grading", "Automated grading → live leaderboard"],
        ["Cut", "Top 8 advance"],
      ],
    },
    note: {
      label: "Source note",
      body: "The implementation plan lists the signature challenge as one of three pre-built options; the plan marks the final Round 2 pick as the remaining open decision. Confirm lock before final print.",
    },
  },
  {
    id: "fusion-awakening",
    numeral: "III",
    index: "03",
    wall: "Wall III",
    title: "Fusion Awakening",
    jp: "融合の覚醒",
    blurb:
      "A physical build sprint: three chits, one coherent solution, no ignoring the hand you draw.",
    from: "8",
    to: "Final",
    advances: "Champion",
    weight: 45,
    objective:
      "2.5+ hours of build time, with mentor checkpoints, followed by a 3-minute pitch and a one-page project card. Every final chit must appear in the concept.",
    flow: [
      "Working prototype / clickable mockup / blueprint",
      "3-minute pitch + live demo",
      "One-page project card",
    ],
    rubric: [
      { label: "Synthesis", pct: 30 },
      { label: "Usefulness", pct: 25 },
      { label: "Execution", pct: 25 },
      { label: "Pitch", pct: 20 },
    ],
    note: {
      label: "Chit market",
      body: "10–15 min mutual-agreement exchange. One wildcard redraw per team, if offered. Final chits lock at the bell.",
    },
  },
];

export const SIGNATURE_CHALLENGE = {
  eyebrow: "Round 2 signature challenge",
  title: "The Scrambled Clock Mystery",
  body: "Force the model to output a correctly sorted, exact-timestamp JSON timeline from a transcript containing jumping, backward and relative timestamps — without arithmetic hallucination.",
  alternates: ["Text-based scratch card game", 'The "worst interface" assistant'],
} as const;

export const CHITS = [
  { title: "User / Setting", body: "Who or where the project serves" },
  { title: "Capability", body: "The building-block tech or feature" },
  { title: "Twist", body: "The rule that forces practicality" },
] as const;

export const RUN_OF_SHOW = [
  ["00:00–00:15", "Welcome / rules / examples"],
  ["00:15–00:25", "Draw three chits"],
  ["00:25–00:40", "Chit Market"],
  ["00:40–03:10", "Build sprint + mentor checkpoints"],
  ["03:10–03:30", "Submission + pitch order"],
  ["03:30–04:30", "Pitches + judging + audience vote"],
  ["04:30–04:45", "Awards + photos"],
] as const;

export const AWARDS = [
  { chapter: "Chapter I", title: "Best Vision Forge Piece", note: "Round 1 top score" },
  { chapter: "Chapter II", title: "Top Token Tamer", note: "Round 2 leaderboard #1" },
  { chapter: "Chapter III", title: "Best Frankenstein Build", note: "Strongest synthesis" },
  { chapter: "Chapter III", title: "Most Useful", note: "Highest usefulness" },
  { chapter: "Chapter III", title: "Best Pivot", note: "Smartest trade-round exchange" },
  { chapter: "Chapter III", title: "Audience Favourite", note: "Audience vote" },
] as const;

export const FORMAT = [
  {
    day: "Day 1",
    body: "Registration → Chapter I for all 50 teams → Top 20 announced → Chapter II → Top 8 finalists revealed",
  },
  {
    day: "Day 2",
    body: "Chapter III half-day finale → overall Champion announcement → awards + photos",
  },
] as const;

export const RESOURCES = [
  ["Judges", "Round-specific panels / technical reviewer"],
  ["Mentors", "Round 3 build sprint checkpoints"],
  ["Tech / AV", "Live leaderboard, timer, bell, strong venue Wi-Fi"],
  ["Volunteers", "Registration, ID checks, chit market, logistics"],
  ["Print", "Chit decks, trade cards, project cards"],
] as const;

export const SPONSOR_SLOTS = [
  { title: "Chapter Power", body: "Own the visual identity of a chapter opener / section." },
  { title: "Token Trials", body: "Brand the challenge surface, leaderboard wall or result reveal." },
  { title: "Fusion Sprint", body: "Support mentor zone, prototype showcase or final pitch stage." },
  { title: "Awards", body: "Present an award category and appear in the winner showcase." },
  { title: "Tech Partner", body: "Back APIs, tools, credits or technical infrastructure." },
  { title: "Showcase Partner", body: "Own the post-event project display / recap touchpoint." },
] as const;
