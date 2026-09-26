import type { Enums } from "@/lib/supabase/database.types";

/**
 * The eleven shapes a student record can take, and every field each one asks
 * for.
 *
 * Four of them are transcribed from "Formats.xlsx", the sheet the department
 * actually files its publications on: journal, conference, book, book chapter.
 * `event` is the hackathon record the site always had. `extracurricular` is
 * for sports, cultural events, NCC, NSS, social work or anything else outside
 * the technical space. On 27 September 2026 the committee asked for
 * competitions to stand apart from hackathons and for workshops, internships
 * and the like to have their own sections, each asking its own questions, so
 * `competition`, `workshop`, `internship`, `certification` and `patent` joined
 * them.
 *
 * This is a plain data file, imported by both sides, for the same reason
 * options.ts is: the form renders itself from this list and the server action
 * validates what comes back against the same list, so a field cannot exist on
 * one side and not the other. A client component importing a server-only
 * module, or a constant out of a "use server" file, is what this avoids.
 *
 * **Three columns from the sheet are deliberately absent.** "Dept Name" is
 * always Computer Engineering, because that is whose site this is. "Sr. No." is
 * a row number and is generated on export. "Data entered by" is the signed-in
 * account. Asking a student to type any of the three would be asking them to
 * repeat something the site already knows, and giving them a chance to get it
 * wrong.
 */

export type Kind = Enums<"achievement_kind">;
export type Level = Enums<"achievement_level">;

/**
 * How far the work reached.
 *
 * The sheet only offers National and International against a publication. The
 * committee asked for the full ladder against both publications and
 * hackathons, because a zonal round and a national final are not the same
 * achievement and the board should not pretend they are.
 */
export const LEVELS: readonly { value: Level; label: string; note: string }[] = [
  { value: "international", label: "International", note: "Outside India, or open to entrants from outside it." },
  { value: "national", label: "National", note: "Open across India." },
  { value: "state", label: "State", note: "Across Maharashtra, or another single state." },
  { value: "zonal", label: "Zonal", note: "A region, a zone or a city." },
  { value: "institute", label: "Institute", note: "Inside VIT Pune, including our own events." },
  { value: "other", label: "Not sure", note: "Leave it here if none of the above fits." },
];

export const LEVEL_LABEL: Record<string, string> = Object.fromEntries(
  LEVELS.map((l) => [l.value, l.label]),
);

export type FieldType = "text" | "long" | "date" | "year" | "decimal" | "int" | "url" | "bool";

export type Field = {
  /** The form field name, which is also the database column. One name, so a
   *  field added here needs no second list keeping it in step. */
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  /** A fixed list, offered as a dropdown. The committee asked for a dropdown
   *  wherever there is a choice to make, rather than tiles or free typing. */
  options?: readonly string[];
  /** Whether the dropdown ends in "Other", which opens a box for anything the
   *  list does not name. A list that refuses an answer it has not heard of is
   *  worse than no list, so most lists have it. */
  other?: boolean;
  /** Half width on a wide screen. Most short fields are. */
  half?: boolean;
};

export type Layout = {
  kind: Kind;
  label: string;
  /** Which heading the kind sits under in the "What are you adding?" list. */
  group: string;
  /** What the record is, in one line, above the form. */
  blurb: string;
  /** What `event_name` is called for this kind. The column holds all of them. */
  titleLabel: string;
  titlePlaceholder: string;
  /** Hackathons and competitions ask what the student came away with. A
   *  paper, a workshop or an internship does not place, so they do not. */
  placed: boolean;
  /** Whether "how far did it reach" means anything. For an internship or an
   *  online course it does not, so they are not asked and score no level. */
  leveled: boolean;
  /** Whether the date is needed. A book carries a publication year instead. */
  dated: boolean;
  dateLabel: string;
  fields: readonly Field[];
};

const AUTHORS: readonly Field[] = [
  {
    name: "primary_author",
    label: "Primary author",
    type: "text",
    required: true,
    hint: "Filled in with your name. Change it if the first author is somebody else.",
    half: true,
  },
  {
    name: "secondary_authors",
    label: "Other authors",
    type: "text",
    hint: "Separated by commas. Write NIL if you are the only author.",
    placeholder: "NIL",
    half: true,
  },
];

const INDEXING = ["Scopus", "SCI", "SCIE", "Web of Science", "UGC-CARE", "ESCI", "PubMed", "None"];

const ORGANISED_BY: Field = {
  name: "venue_name",
  label: "Organised by",
  type: "text",
  hint: "The institute, company or body that ran it.",
  half: true,
};

const WHERE: Field = {
  name: "location",
  label: "Where it was held",
  type: "text",
  placeholder: "Pune",
  half: true,
};

const MODE: Field = {
  name: "mode",
  label: "Mode",
  type: "text",
  options: ["In person", "Online", "Hybrid"],
  half: true,
};

export const LAYOUTS: readonly Layout[] = [
  {
    kind: "event",
    label: "Hackathon",
    group: "Competitions",
    blurb: "A hackathon or ideathon: a team building something against the clock.",
    titleLabel: "Name of the hackathon",
    titlePlaceholder: "Smart India Hackathon 2026",
    placed: true,
    leveled: true,
    dated: true,
    dateLabel: "Date of the hackathon",
    fields: [
      ORGANISED_BY,
      WHERE,
      MODE,
      { name: "team_name", label: "Team name", type: "text", half: true },
      {
        name: "team_size",
        label: "Team size",
        type: "int",
        placeholder: "4",
        hint: "Including you.",
        half: true,
      },
      {
        name: "theme",
        label: "Track or problem statement",
        type: "text",
        placeholder: "Smart education",
        half: true,
      },
      {
        name: "project_title",
        label: "What your team built",
        type: "text",
        placeholder: "An offline attendance app for rural schools",
      },
      {
        name: "rank_detail",
        label: "Where you finished",
        type: "text",
        placeholder: "Top 10 of 300 teams",
        hint: "Worth filling in when you went a long way without taking a prize.",
      },
    ],
  },
  {
    kind: "competition",
    label: "Competition",
    group: "Competitions",
    blurb:
      "A coding contest, a paper or poster presentation, a quiz, a CTF, a project exhibition or any other contest you entered.",
    titleLabel: "Name of the competition",
    titlePlaceholder: "CodeChef Starters 150",
    placed: true,
    leveled: true,
    dated: true,
    dateLabel: "Date of the competition",
    fields: [
      {
        name: "specialization",
        label: "Type of competition",
        type: "text",
        required: true,
        options: [
          "Coding contest",
          "Paper presentation",
          "Poster presentation",
          "Project exhibition",
          "Quiz",
          "Capture the flag",
          "Case study",
          "Design",
          "Robotics",
        ],
        other: true,
        half: true,
      },
      { ...ORGANISED_BY, hint: "The college, company or platform that ran it." },
      WHERE,
      MODE,
      {
        name: "team_size",
        label: "Team size",
        type: "int",
        placeholder: "1",
        hint: "1 if you entered on your own.",
        half: true,
      },
      {
        name: "rank_detail",
        label: "Rank or score",
        type: "text",
        placeholder: "Rank 42 of 12,000",
        half: true,
      },
    ],
  },
  {
    kind: "workshop",
    label: "Workshop or bootcamp",
    group: "Learning and work",
    blurb:
      "A workshop, bootcamp, seminar or training programme you attended, or one you ran yourself.",
    titleLabel: "Name of the workshop",
    titlePlaceholder: "Hands-on Kubernetes",
    placed: false,
    leveled: true,
    dated: true,
    dateLabel: "First day",
    fields: [
      {
        name: "role_title",
        label: "Your role",
        type: "text",
        required: true,
        options: ["Attended", "Conducted or taught it", "Volunteered or organised it"],
        half: true,
      },
      {
        name: "specialization",
        label: "Topic",
        type: "text",
        placeholder: "Cloud and DevOps",
        half: true,
      },
      { ...ORGANISED_BY, label: "Conducted by" },
      WHERE,
      MODE,
      {
        name: "duration",
        label: "How long it ran",
        type: "text",
        placeholder: "2 days",
        half: true,
      },
    ],
  },
  {
    kind: "internship",
    label: "Internship",
    group: "Learning and work",
    blurb: "An internship at a company, a startup, a lab or a research group.",
    titleLabel: "Role or position",
    titlePlaceholder: "Software engineering intern",
    placed: false,
    leveled: false,
    dated: true,
    dateLabel: "First day",
    fields: [
      {
        name: "venue_name",
        label: "Company or organisation",
        type: "text",
        required: true,
        half: true,
      },
      {
        name: "specialization",
        label: "Domain",
        type: "text",
        options: [
          "Software development",
          "Web development",
          "Mobile development",
          "Data science, ML or AI",
          "Cybersecurity",
          "Cloud or DevOps",
          "Embedded or IoT",
          "Research",
          "Design",
          "Product or business",
        ],
        other: true,
        half: true,
      },
      {
        name: "ended_on",
        label: "Last day",
        type: "date",
        hint: "Leave it blank if you are still there.",
        half: true,
      },
      {
        name: "mode",
        label: "Mode",
        type: "text",
        options: ["On site", "Remote", "Hybrid"],
        half: true,
      },
      WHERE,
      {
        name: "stipend_inr",
        label: "Stipend a month, in rupees",
        type: "int",
        placeholder: "15000",
        hint: "Blank or 0 if it was unpaid.",
        half: true,
      },
      { name: "ppo", label: "Got a pre-placement offer", type: "bool", half: true },
      {
        name: "skills",
        label: "Skills and tools you used",
        type: "text",
        placeholder: "React, Node.js, PostgreSQL",
      },
    ],
  },
  {
    kind: "certification",
    label: "Online course or certification",
    group: "Learning and work",
    blurb:
      "A course or certification you completed: NPTEL, Coursera, a cloud certification and the like.",
    titleLabel: "Name of the course",
    titlePlaceholder: "Programming, Data Structures and Algorithms using Python",
    placed: false,
    leveled: false,
    dated: true,
    dateLabel: "Date you completed it",
    fields: [
      {
        name: "venue_name",
        label: "Platform or issuer",
        type: "text",
        required: true,
        options: [
          "NPTEL",
          "Coursera",
          "Udemy",
          "edX",
          "Google",
          "Microsoft",
          "Amazon Web Services",
          "Cisco",
          "Oracle",
          "IBM",
          "Infosys Springboard",
        ],
        other: true,
        half: true,
      },
      {
        name: "specialization",
        label: "Subject",
        type: "text",
        placeholder: "Data structures",
        half: true,
      },
      { name: "duration", label: "Length", type: "text", placeholder: "8 weeks", half: true },
      {
        name: "score",
        label: "Score or grade",
        type: "text",
        placeholder: "Elite + Silver, 82%",
        half: true,
      },
      {
        name: "credential_url",
        label: "Credential link",
        type: "url",
        placeholder: "https://",
        hint: "The page that proves it, if the issuer gives one.",
      },
    ],
  },
  {
    kind: "patent",
    label: "Patent",
    group: "Publications and patents",
    blurb: "A patent you filed, or that was published or granted, with you as an inventor.",
    titleLabel: "Title of the invention",
    titlePlaceholder: "A system for detecting counterfeit notes",
    placed: false,
    leveled: true,
    dated: true,
    dateLabel: "Date of filing",
    fields: [
      {
        name: "application_no",
        label: "Application number",
        type: "text",
        required: true,
        placeholder: "202621045678",
        half: true,
      },
      {
        name: "patent_status",
        label: "Status",
        type: "text",
        required: true,
        options: ["Filed", "Published", "Granted"],
        half: true,
      },
      {
        name: "location",
        label: "Patent office",
        type: "text",
        options: ["India", "PCT (international)", "United States", "Europe"],
        other: true,
        half: true,
      },
      {
        name: "specialization",
        label: "Field",
        type: "text",
        placeholder: "Computer vision",
        half: true,
      },
      { ...AUTHORS[0], label: "First inventor" },
      { ...AUTHORS[1], label: "Other inventors", hint: "Separated by commas." },
    ],
  },
  {
    kind: "journal",
    label: "Journal publication",
    group: "Publications and patents",
    blurb: "A paper published in a journal.",
    titleLabel: "Title of the publication",
    titlePlaceholder: "A survey of prompt injection defences",
    placed: false,
    leveled: true,
    dated: true,
    dateLabel: "Date of publication",
    fields: [
      ...AUTHORS,
      { name: "venue_name", label: "Name of the journal", type: "text", required: true },
      {
        name: "indexing",
        label: "Indexing",
        type: "text",
        options: INDEXING,
        other: true,
        half: true,
      },
      {
        name: "quartile",
        label: "Quartile",
        type: "text",
        options: ["Q1", "Q2", "Q3", "Q4"],
        half: true,
      },
      {
        name: "impact_factor",
        label: "Impact factor",
        type: "decimal",
        placeholder: "3.412",
        half: true,
      },
      { name: "specialization", label: "Area of specialisation", type: "text", half: true },
      { name: "peer_reviewed", label: "Peer reviewed", type: "bool", half: true },
      { name: "e_journal", label: "It is an e-journal", type: "bool", half: true },
      { name: "volume", label: "Volume", type: "text", half: true },
      { name: "edition", label: "Edition number", type: "text", half: true },
      { name: "isbn_issn", label: "ISBN or ISSN", type: "text", half: true },
    ],
  },
  {
    kind: "conference",
    label: "Conference publication",
    group: "Publications and patents",
    blurb: "A paper published in the proceedings of a conference.",
    titleLabel: "Title of the publication",
    titlePlaceholder: "Adversarial prompts in classroom assessment",
    placed: false,
    leveled: true,
    dated: true,
    dateLabel: "Date of the conference",
    fields: [
      ...AUTHORS,
      { name: "venue_name", label: "Name of the conference", type: "text", required: true },
      {
        name: "indexing",
        label: "Conference paper indexing",
        type: "text",
        options: INDEXING,
        other: true,
        half: true,
      },
      { name: "location", label: "Where the conference was held", type: "text", half: true },
      { name: "page_numbers", label: "Page numbers", type: "text", placeholder: "114-121", half: true },
      { name: "place_of_publication", label: "Place of publication", type: "text", half: true },
      { name: "publisher", label: "Publisher of the proceedings", type: "text", half: true },
      { name: "isbn_issn", label: "ISBN or ISSN", type: "text", half: true },
    ],
  },
  {
    kind: "book",
    label: "Book",
    group: "Publications and patents",
    blurb: "A book you wrote or edited.",
    titleLabel: "Book title",
    titlePlaceholder: "Foundations of prompt engineering",
    placed: false,
    leveled: true,
    dated: false,
    dateLabel: "Date of publication",
    fields: [
      ...AUTHORS,
      { name: "publisher", label: "Publisher", type: "text", required: true, half: true },
      {
        name: "publication_year",
        label: "Publication year",
        type: "year",
        required: true,
        placeholder: "2026",
        half: true,
      },
      { name: "edition", label: "Book edition", type: "text", placeholder: "First", half: true },
      { name: "place_of_publication", label: "Place of publication", type: "text", half: true },
      { name: "isbn_issn", label: "ISBN or ISSN", type: "text", half: true },
      { name: "is_edited", label: "The book is edited", type: "bool", half: true },
    ],
  },
  {
    kind: "book_chapter",
    label: "Book chapter",
    group: "Publications and patents",
    blurb: "A chapter you wrote in somebody's book. The title above is the book's, not the chapter's.",
    titleLabel: "Book title",
    titlePlaceholder: "Foundations of prompt engineering",
    placed: false,
    leveled: true,
    dated: false,
    dateLabel: "Date of publication",
    fields: [
      {
        name: "chapter_name",
        label: "Chapter number and name",
        type: "text",
        required: true,
        placeholder: "4. Retrieval and its failure modes",
      },
      ...AUTHORS,
      { name: "publisher", label: "Publisher", type: "text", required: true, half: true },
      {
        name: "publication_year",
        label: "Publication year",
        type: "year",
        required: true,
        placeholder: "2026",
        half: true,
      },
      { name: "edition", label: "Book edition", type: "text", half: true },
      { name: "place_of_publication", label: "Place of publication", type: "text", half: true },
      { name: "isbn_issn", label: "ISBN or ISSN", type: "text", half: true },
      { name: "is_edited", label: "The book is edited", type: "bool", half: true },
    ],
  },
  {
    kind: "extracurricular",
    label: "Non-technical or extracurricular",
    group: "Beyond the classroom",
    blurb:
      "Sports, cultural events, NCC, NSS, social work, a club or society, or anything else outside the technical space.",
    titleLabel: "Name of the activity",
    titlePlaceholder: "Inter-college basketball tournament",
    placed: true,
    leveled: true,
    dated: true,
    dateLabel: "Date of the activity",
    fields: [
      {
        name: "specialization",
        label: "Type of activity",
        type: "text",
        required: true,
        options: ["Sports", "Cultural", "NCC", "NSS", "Social work", "Club or society"],
        other: true,
        half: true,
      },
      {
        name: "role_title",
        label: "Your role",
        type: "text",
        options: ["Participant", "Captain or lead", "Performer", "Volunteer", "Organiser"],
        other: true,
        half: true,
      },
      ORGANISED_BY,
      WHERE,
    ],
  },
];

/** The headings of the "What are you adding?" dropdown, in order. */
export const LAYOUT_GROUPS: readonly string[] = [...new Set(LAYOUTS.map((l) => l.group))];

export const LAYOUT: Record<string, Layout> = Object.fromEntries(
  LAYOUTS.map((l) => [l.kind, l]),
);

export const KIND_LABEL: Record<string, string> = Object.fromEntries(
  LAYOUTS.map((l) => [l.kind, l.label]),
);

const PUBLICATION_KINDS = new Set<Kind>(["journal", "conference", "book", "book_chapter"]);

/**
 * Publications, as one test, because six places ask the same question.
 *
 * Not "anything that is not an event" any more: `extracurricular` is not an
 * event and not a publication either, so this names the four publication
 * kinds directly rather than inferring them by elimination. A patent is not
 * one of them: the department files patents on a sheet of their own.
 */
export function isPublication(kind: Kind): boolean {
  return PUBLICATION_KINDS.has(kind);
}

/** Whether this kind of record places: participation, or first, second, third. */
export function isPlaced(kind: Kind): boolean {
  return LAYOUT[kind]?.placed ?? false;
}

/**
 * The four files a record may carry, all of them optional.
 *
 * The certificate is on the record's own row and the other three are rows in
 * certificate_files. They are listed together here because the student sees
 * four upload buttons and should not have to know which is which.
 *
 * Each is uploaded on its own. A server action on Vercel refuses a request
 * body over 4.5MB whatever Next.js is told to allow, so four files of the size
 * this site accepts cannot travel together, and a form that looked as though
 * they could would fail on exactly the records that had the most to show.
 */
export type Slot = "certificate" | "prize" | "event" | "hod" | "other";

export const SLOTS: readonly { slot: Slot; label: string; hint: string }[] = [
  { slot: "certificate", label: "The certificate", hint: "The certificate itself, or the paper." },
  { slot: "prize", label: "The prize", hint: "A photo of the trophy, the cheque or the medal." },
  { slot: "event", label: "You at the event", hint: "A photo of you there." },
  { slot: "hod", label: "With the HOD", hint: "The photo taken with the head of department." },
];

export const SLOT_LABEL: Record<string, string> = Object.fromEntries(
  SLOTS.map((s) => [s.slot, s.label]),
);

/** The three that live in certificate_files. The fourth is on the record. */
export const EXTRA_SLOTS = SLOTS.filter((s) => s.slot !== "certificate");
