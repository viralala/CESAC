import type { Enums } from "@/lib/supabase/database.types";

/**
 * The five shapes a student record can take, and every field each one asks for.
 *
 * Four of them are transcribed from "Formats.xlsx", the sheet the department
 * actually files its publications on: journal, conference, book, book chapter.
 * The fifth, `event`, is the hackathon and competition record the site already
 * had, now carrying a level and a date like the rest.
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

export type FieldType = "text" | "long" | "date" | "year" | "decimal" | "bool";

export type Field = {
  /** The form field name, which is also the database column. One name, so a
   *  field added here needs no second list keeping it in step. */
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  /** Suggestions offered in a datalist. Free text either way: a list that
   *  refuses an answer it has not heard of is worse than no list. */
  options?: readonly string[];
  /** Half width on a wide screen. Most short fields are. */
  half?: boolean;
};

export type Layout = {
  kind: Kind;
  label: string;
  /** What the record is, in one line, above the form. */
  blurb: string;
  /** What `event_name` is called for this kind. The column holds all five. */
  titleLabel: string;
  titlePlaceholder: string;
  /** Hackathons ask what the student came away with. Publications do not
   *  place, so they do not. */
  placed: boolean;
  /** A date is meaningful for an event, a conference and a journal issue. A
   *  book carries a publication year instead. */
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

export const LAYOUTS: readonly Layout[] = [
  {
    kind: "event",
    label: "Hackathon or competition",
    blurb:
      "Anything you entered and have a certificate for: a hackathon, a coding contest, a paper presentation, a workshop.",
    titleLabel: "Name of the event",
    titlePlaceholder: "Smart India Hackathon 2026",
    placed: true,
    dated: true,
    dateLabel: "Date of the event",
    fields: [
      {
        name: "venue_name",
        label: "Organised by",
        type: "text",
        hint: "The institute, company or body that ran it.",
        half: true,
      },
      {
        name: "location",
        label: "Where it was held",
        type: "text",
        placeholder: "Pune",
        half: true,
      },
    ],
  },
  {
    kind: "journal",
    label: "Journal publication",
    blurb: "A paper published in a journal.",
    titleLabel: "Title of the publication",
    titlePlaceholder: "A survey of prompt injection defences",
    placed: false,
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
        placeholder: "Scopus",
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
    blurb: "A paper published in the proceedings of a conference.",
    titleLabel: "Title of the publication",
    titlePlaceholder: "Adversarial prompts in classroom assessment",
    placed: false,
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
    blurb: "A book you wrote or edited.",
    titleLabel: "Book title",
    titlePlaceholder: "Foundations of prompt engineering",
    placed: false,
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
    blurb: "A chapter you wrote in somebody's book. The title above is the book's, not the chapter's.",
    titleLabel: "Book title",
    titlePlaceholder: "Foundations of prompt engineering",
    placed: false,
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
];

export const LAYOUT: Record<string, Layout> = Object.fromEntries(
  LAYOUTS.map((l) => [l.kind, l]),
);

export const KIND_LABEL: Record<string, string> = Object.fromEntries(
  LAYOUTS.map((l) => [l.kind, l.label]),
);

/** Publications, as one test, because six places ask the same question. */
export function isPublication(kind: Kind): boolean {
  return kind !== "event";
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
