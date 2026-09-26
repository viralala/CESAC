import "server-only";

import { cache } from "react";

import { EVENTS, type CesacEvent } from "@/lib/data/cesac";
import type { Chapter, Pop } from "@/lib/data/event";
import { mergeContent, type Content, type Row } from "@/lib/data/event-content-schema";
import type { HRPop, QuestionGroup } from "@/lib/data/hr-final-boss";
import { publicEventContent } from "@/lib/data/public-cache";

/**
 * The running events' pages, as organisers have left them.
 *
 * Each section is whatever was saved from the console, or the text in the
 * source where nothing has been. A database that cannot be reached costs the
 * pages their edits and nothing else: they fall back to the source, which is
 * what they said before editing existed.
 */
const saved = cache(async (): Promise<Map<string, unknown>> => {
  try {
    const rows = await publicEventContent();
    return new Map(rows.map((r) => [r.slug, r.content]));
  } catch {
    return new Map();
  }
});

export const getEventContent = cache(async (slug: string): Promise<Content> =>
  mergeContent(slug, (await saved()).get(slug)),
);

const obj = (c: Content, key: string): Row => (c[key] as Row) ?? {};
const list = (c: Content, key: string): Row[] => (c[key] as Row[]) ?? [];
const s = (r: Row, key: string): string => {
  const v = r[key];
  return typeof v === "string" ? v : "";
};

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];
const CHAPTER_POPS: Pop[] = ["azure", "violet", "lime", "pink"];
const pad = (n: number) => String(n).padStart(2, "0");
const slugify = (t: string, i: number) =>
  t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `chapter-${i + 1}`;

export type AotContent = {
  event: {
    name: string;
    kicker: string;
    host: string;
    tagline: string;
    jp: string;
    creed: string;
    dateVenue: string;
  };
  register: { formUrl: string; amountInr: number; live: boolean };
  strips: { one: string; two: string; three: string };
  vitals: { value: string; label: string; note: string }[];
  chapters: Chapter[];
  entry: { step: string; title: string; note: string }[];
  awards: { chapter: string; title: string; note: string; pop: Pop }[];
};

export const getAotContent = cache(async (): Promise<AotContent> => {
  const c = await getEventContent("attack-on-token");
  const event = obj(c, "event");
  const register = obj(c, "register");
  const strips = obj(c, "strips");
  const amount = Number(s(register, "amountInr"));
  const formUrl = s(register, "formUrl").trim();

  return {
    event: {
      name: s(event, "name"),
      kicker: s(event, "kicker"),
      host: s(event, "host"),
      tagline: s(event, "tagline"),
      jp: s(event, "jp"),
      creed: s(event, "creed"),
      dateVenue: s(event, "dateVenue"),
    },
    register: {
      formUrl,
      amountInr: Number.isFinite(amount) && amount >= 0 ? amount : 0,
      live: formUrl.length > 0,
    },
    strips: { one: s(strips, "one"), two: s(strips, "two"), three: s(strips, "three") },
    vitals: list(c, "vitals").map((v) => ({
      value: s(v, "value"),
      label: s(v, "label"),
      note: s(v, "note"),
    })),
    chapters: list(c, "chapters").map((r, i) => ({
      id: slugify(s(r, "title"), i),
      numeral: ROMAN[i] ?? String(i + 1),
      index: pad(i + 1),
      title: s(r, "title"),
      jp: s(r, "jp"),
      task: s(r, "task"),
      deliver: s(r, "deliver"),
      tools: s(r, "tools"),
      from: s(r, "from"),
      to: s(r, "to"),
      weight: Number(s(r, "weight")) || 0,
      pop: CHAPTER_POPS[i % CHAPTER_POPS.length],
    })),
    entry: list(c, "entry").map((r, i) => ({
      step: pad(i + 1),
      title: s(r, "title"),
      note: s(r, "note"),
    })),
    awards: list(c, "awards").map((r) => {
      const chapter = s(r, "chapter").trim();
      const at = ROMAN.indexOf(chapter.toUpperCase());
      return {
        chapter,
        title: s(r, "title"),
        note: s(r, "note"),
        pop: at >= 0 ? CHAPTER_POPS[at % CHAPTER_POPS.length] : "pink",
      };
    }),
  };
});

export type HrfbContent = {
  event: {
    name: string;
    kicker: string;
    host: string;
    tagline: string;
    devanagari: string;
    devanagariGloss: string;
    creed: string;
    dateVenue: string;
    format: string;
  };
  vitals: { value: string; label: string; note: string }[];
  speaker: { status: string; note: string; facts: { label: string; value: string }[] };
  questions: QuestionGroup[];
  agenda: { step: string; title: string; time: string; note: string }[];
  linkedin: { username: string; label: string };
};

const GROUP_POPS: HRPop[] = ["azure", "maya", "ink"];

export const getHrfbContent = cache(async (): Promise<HrfbContent> => {
  const c = await getEventContent("hr-final-boss");
  const event = obj(c, "event");
  const speaker = obj(c, "speaker");
  const linkedin = obj(c, "linkedin");

  return {
    event: {
      name: s(event, "name"),
      kicker: s(event, "kicker"),
      host: s(event, "host"),
      tagline: s(event, "tagline"),
      devanagari: s(event, "devanagari"),
      devanagariGloss: s(event, "devanagariGloss"),
      creed: s(event, "creed"),
      dateVenue: s(event, "dateVenue"),
      format: s(event, "format"),
    },
    vitals: list(c, "vitals").map((v) => ({
      value: s(v, "value"),
      label: s(v, "label"),
      note: s(v, "note"),
    })),
    speaker: {
      status: s(speaker, "status"),
      note: s(speaker, "note"),
      facts: list(c, "speakerFacts").map((f) => ({ label: s(f, "label"), value: s(f, "value") })),
    },
    questions: list(c, "questions").map((g, i) => ({
      id: slugify(s(g, "title"), i),
      title: s(g, "title"),
      pop: GROUP_POPS[i % GROUP_POPS.length],
      prompts: (Array.isArray(g.prompts) ? g.prompts : []).filter(Boolean),
    })),
    agenda: list(c, "agenda").map((a, i) => ({
      step: pad(i + 1),
      title: s(a, "title"),
      time: s(a, "time"),
      note: s(a, "note"),
    })),
    linkedin: {
      username: s(linkedin, "username").trim().replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "").replace(/\/$/, ""),
      label: s(linkedin, "label"),
    },
  };
});

/**
 * The events list, with each running event's card as organisers left it.
 *
 * Only the words change here. The slug, the address, the badge and the
 * schedule still come from where they always did.
 */
export const getEventCards = cache(async (): Promise<CesacEvent[]> => {
  const out: CesacEvent[] = [];
  for (const event of EVENTS) {
    const card = obj(await getEventContent(event.slug), "card");
    out.push({
      ...event,
      name: s(card, "name") || event.name,
      kicker: s(card, "kicker") || event.kicker,
      blurb: s(card, "blurb") || event.blurb,
      when: s(card, "when") || event.when,
    });
  }
  return out;
});
