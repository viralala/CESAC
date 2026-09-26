import { EVENTS } from "@/lib/data/cesac";
import { AWARDS, CHAPTERS, ENTRY, EVENT, REGISTER, VITALS } from "@/lib/data/event";
import {
  AGENDA,
  HR_VITALS,
  HRFB,
  LINKEDIN,
  QUESTION_GROUPS,
  SPEAKER_TEASE,
} from "@/lib/data/hr-final-boss";

/**
 * What an organiser can change on each running event's page, and what it says
 * until they do.
 *
 * A plain module, imported by the console form, the server action that saves
 * it and the loader that renders the pages, so a field cannot be editable on
 * one side and ignored on the other. The defaults are the text in
 * lib/data/event.ts and lib/data/hr-final-boss.ts as it stands, which is why
 * clearing a section puts the page back exactly as it was.
 *
 * Every value is a string here, the way a form sends it. The loader in
 * event-content.ts turns the few numbers back into numbers.
 */

export type FieldSpec = {
  key: string;
  label: string;
  /** A paragraph rather than a line. */
  long?: boolean;
  /** One item per line, stored as a list. */
  lines?: boolean;
  max?: number;
  hint?: string;
  kind?: "text" | "url" | "number";
};

export type SectionSpec = {
  key: string;
  label: string;
  note?: string;
  /** An object of fields, or a list of rows that each have those fields. */
  shape: "object" | "list";
  fields: readonly FieldSpec[];
  /** The most rows a list can have. */
  max?: number;
};

export type EventSchema = { slug: string; name: string; href: string; sections: readonly SectionSpec[] };

export type Row = Record<string, string | string[]>;
export type Content = Record<string, Row | Row[]>;

const CARD: SectionSpec = {
  key: "card",
  label: "The card on the events list and the front page",
  shape: "object",
  fields: [
    { key: "name", label: "Name", max: 80 },
    { key: "kicker", label: "Kind of event", max: 80 },
    { key: "blurb", label: "Blurb", long: true, max: 400 },
    { key: "when", label: "When and where, as the card prints it", max: 120 },
  ],
};

const VITALS_FIELDS: readonly FieldSpec[] = [
  { key: "value", label: "Number", max: 24 },
  { key: "label", label: "Label", max: 40 },
  { key: "note", label: "Note", max: 80 },
];

export const EVENT_SCHEMAS: Record<string, EventSchema> = {
  "attack-on-token": {
    slug: "attack-on-token",
    name: "Attack on Token",
    href: "/events/attack-on-token",
    sections: [
      CARD,
      {
        key: "event",
        label: "The top of the page",
        shape: "object",
        fields: [
          { key: "name", label: "Name", max: 80 },
          { key: "kicker", label: "Kind of event", max: 80 },
          { key: "host", label: "Hosted by", max: 80 },
          { key: "tagline", label: "Tagline", max: 160 },
          { key: "jp", label: "Japanese title", max: 40 },
          { key: "creed", label: "Creed", max: 160 },
          { key: "dateVenue", label: "Date and venue line", max: 120 },
        ],
      },
      {
        key: "register",
        label: "Registration",
        shape: "object",
        fields: [
          {
            key: "formUrl",
            label: "Form address",
            kind: "url",
            max: 300,
            hint: "The link a student opens, never one ending in /edit. Empty switches every register button off.",
          },
          { key: "amountInr", label: "Entry fee per team, in rupees", kind: "number", max: 7 },
        ],
      },
      {
        key: "strips",
        label: "The three register lines between sections",
        shape: "object",
        fields: [
          { key: "one", label: "After the vitals", max: 160 },
          { key: "two", label: "After the chapters", max: 160 },
          { key: "three", label: "After the prizes", max: 160 },
        ],
      },
      { key: "vitals", label: "The four numbers", shape: "list", fields: VITALS_FIELDS, max: 6 },
      {
        key: "chapters",
        label: "Chapters",
        note: "Numbered I, II, III in the order below.",
        shape: "list",
        max: 6,
        fields: [
          { key: "title", label: "Title", max: 60 },
          { key: "jp", label: "Japanese title", max: 40 },
          { key: "task", label: "Task", long: true, max: 300 },
          { key: "deliver", label: "What the team hands in", max: 120 },
          { key: "tools", label: "Tools or time", max: 120 },
          { key: "from", label: "Teams going in", max: 8 },
          { key: "to", label: "Teams coming out", max: 8 },
          { key: "weight", label: "Weight, in percent", kind: "number", max: 3 },
        ],
      },
      {
        key: "entry",
        label: "How to get in",
        note: "Numbered in the order below.",
        shape: "list",
        max: 6,
        fields: [
          { key: "title", label: "Step", max: 60 },
          { key: "note", label: "Note", max: 160 },
        ],
      },
      {
        key: "awards",
        label: "Awards",
        shape: "list",
        max: 12,
        fields: [
          { key: "chapter", label: "Chapter (I, II, III, or ★ for the whole event)", max: 4 },
          { key: "title", label: "Award", max: 80 },
          { key: "note", label: "Given for", max: 120 },
        ],
      },
    ],
  },
  "hr-final-boss": {
    slug: "hr-final-boss",
    name: "HR Final Boss",
    href: "/events/hr-final-boss",
    sections: [
      CARD,
      {
        key: "event",
        label: "The top of the page",
        shape: "object",
        fields: [
          { key: "name", label: "Name", max: 80 },
          { key: "kicker", label: "Kind of event", max: 80 },
          { key: "host", label: "Hosted by", max: 80 },
          { key: "tagline", label: "Tagline", max: 160 },
          { key: "devanagari", label: "Devanagari title", max: 40 },
          { key: "devanagariGloss", label: "What the title means", max: 80 },
          { key: "creed", label: "Creed", max: 160 },
          { key: "dateVenue", label: "Date and venue line", max: 120 },
          { key: "format", label: "Format", max: 80 },
        ],
      },
      { key: "vitals", label: "The four numbers", shape: "list", fields: VITALS_FIELDS, max: 6 },
      {
        key: "speaker",
        label: "The speaker file",
        shape: "object",
        fields: [
          { key: "status", label: "Status line", max: 80 },
          { key: "note", label: "Note under the file", max: 200 },
        ],
      },
      {
        key: "speakerFacts",
        label: "Facts in the speaker file",
        shape: "list",
        max: 8,
        fields: [
          { key: "label", label: "Label", max: 40 },
          { key: "value", label: "Value", max: 80 },
        ],
      },
      {
        key: "questions",
        label: "Question groups",
        shape: "list",
        max: 6,
        fields: [
          { key: "title", label: "Group", max: 60 },
          { key: "prompts", label: "Questions, one per line", lines: true, long: true, max: 1200 },
        ],
      },
      {
        key: "agenda",
        label: "Agenda",
        note: "Numbered in the order below.",
        shape: "list",
        max: 8,
        fields: [
          { key: "title", label: "Step", max: 60 },
          { key: "time", label: "Time", max: 24 },
          { key: "note", label: "Note", max: 160 },
        ],
      },
      {
        key: "linkedin",
        label: "LinkedIn badge",
        shape: "object",
        fields: [
          {
            key: "username",
            label: "LinkedIn handle",
            max: 100,
            hint: "The part after linkedin.com/in/. A badge shows a name and a photo, so leave it empty while the speaker is secret.",
          },
          { key: "label", label: "Heading", max: 80 },
        ],
      },
    ],
  },
};

/** The events whose pages can be edited, in the order the console lists them. */
export const EDITABLE_EVENTS = Object.keys(EVENT_SCHEMAS);

function card(slug: string): Row {
  const e = EVENTS.find((x) => x.slug === slug);
  return { name: e?.name ?? "", kicker: e?.kicker ?? "", blurb: e?.blurb ?? "", when: e?.when ?? "" };
}

const str = (o: Record<string, unknown>, keys: readonly string[]): Row =>
  Object.fromEntries(keys.map((k) => [k, String(o[k] ?? "")]));

/** Every section as the source has it today. */
export function eventDefaults(slug: string): Content {
  if (slug === "attack-on-token") {
    return {
      card: card(slug),
      event: str(EVENT, ["name", "kicker", "host", "tagline", "jp", "creed", "dateVenue"]),
      register: { formUrl: REGISTER.formUrl, amountInr: String(REGISTER.amountInr) },
      strips: {
        one: "Two people, ₹125, one form. That is the whole of getting in.",
        two: "Three chapters, and every team starts at the first one.",
        three: "Six awards, 80 teams, and entries close when the last seat goes.",
      },
      vitals: VITALS.map((v) => str(v, ["value", "label", "note"])),
      chapters: CHAPTERS.map((c) =>
        str(c, ["title", "jp", "task", "deliver", "tools", "from", "to", "weight"]),
      ),
      entry: ENTRY.map((e) => str(e, ["title", "note"])),
      awards: AWARDS.map((a) => str(a, ["chapter", "title", "note"])),
    };
  }
  if (slug === "hr-final-boss") {
    return {
      card: card(slug),
      event: str(HRFB, [
        "name",
        "kicker",
        "host",
        "tagline",
        "devanagari",
        "devanagariGloss",
        "creed",
        "dateVenue",
        "format",
      ]),
      vitals: HR_VITALS.map((v) => str(v, ["value", "label", "note"])),
      speaker: { status: SPEAKER_TEASE.status, note: SPEAKER_TEASE.note },
      speakerFacts: SPEAKER_TEASE.facts.map((f) => str(f, ["label", "value"])),
      questions: QUESTION_GROUPS.map((g) => ({ title: g.title, prompts: [...g.prompts] })),
      agenda: AGENDA.map((a) => str(a, ["title", "time", "note"])),
      linkedin: { username: LINKEDIN.username, label: LINKEDIN.label },
    };
  }
  return {};
}

/**
 * The saved sections laid over the defaults.
 *
 * An object section is merged field by field, so a field added to the schema
 * later still shows its default. A list replaces the default list whole,
 * because "the second chapter" means whatever is second now. Anything the
 * schema does not name is dropped, whatever the row holds.
 */
export function mergeContent(slug: string, saved: unknown): Content {
  const schema = EVENT_SCHEMAS[slug];
  const out = eventDefaults(slug);
  if (!schema || !saved || typeof saved !== "object") return out;
  const stored = saved as Record<string, unknown>;

  for (const section of schema.sections) {
    const value = stored[section.key];
    if (value === undefined || value === null) continue;

    if (section.shape === "object" && typeof value === "object" && !Array.isArray(value)) {
      const base = (out[section.key] as Row) ?? {};
      const next: Row = { ...base };
      for (const field of section.fields) {
        const v = (value as Record<string, unknown>)[field.key];
        if (typeof v === "string") next[field.key] = v;
      }
      out[section.key] = next;
    }

    if (section.shape === "list" && Array.isArray(value)) {
      out[section.key] = value
        .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object")
        .slice(0, section.max ?? 12)
        .map((row) =>
          Object.fromEntries(
            section.fields.map((field) => {
              const v = row[field.key];
              if (field.lines) {
                return [field.key, Array.isArray(v) ? v.map(String) : []];
              }
              return [field.key, typeof v === "string" ? v : ""];
            }),
          ),
        );
    }
  }
  return out;
}
