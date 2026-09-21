import "server-only";

import { cache } from "react";

import {
  ASSOCIATES,
  BOARD,
  FACULTY,
  STUDENT_LEADERSHIP,
  VERTICALS,
} from "@/lib/data/committee";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * The parts of the public site the committee edits for itself.
 *
 * Three things live here: the sentences on the front page, the roster, and the
 * points scale. All three were constants in the source until now, which meant
 * correcting a lecturer's title or moving participation off ten points was a
 * code change, a build and a deploy, for a job that takes ten seconds.
 *
 * **Every read falls back to the constants the code still carries.** A page
 * that cannot reach the database renders the site as it was rather than a
 * screen of blanks, and a fresh clone against an empty project still looks
 * like the real thing. The database is the source of truth; the constants are
 * what the site says when nobody can be asked.
 */

// ---------------------------------------------------------------------------
// Sentences
// ---------------------------------------------------------------------------

export type SiteTextRow = Tables<"site_text">;

/**
 * The wording the code ships with.
 *
 * Deliberately the same strings the migration seeds, so the two cannot
 * disagree on a fresh install, and deliberately not generated from them: this
 * file is read by a build that may never reach the database at all.
 */
const FALLBACK: Record<string, string> = {
  "home.what":
    "Not a club. A community built by the Computer Engineering department at VIT Pune, for the department. We run the department's events, and students from across the department run us.",
  "home.structure":
    "CESAC sits under the department's faculty leadership. A board of executives steers it, and four verticals carry the work.",
  "home.events.eyebrow": "What we run",
  "home.events.title": "Events",
  "home.events.aside":
    "Competitions, workshops and department activities, planned and run by students.",
  "home.events.empty":
    "Nothing else is on the calendar yet. New events are posted here as they are confirmed.",
  "home.showcase.eyebrow": "Who is doing it",
  "home.showcase.title": "Standouts",
  "home.showcase.aside":
    "Students from across the department, ranked on what they have put on their record.",
  "home.showcase.foot":
    "Worked out from what students have uploaded to their own record, so it is a picture of what the department has on file.",
  "people.kicker": "People",
  "people.title": "The roster",
  "people.lede":
    "All {total} of us: faculty leadership, student leadership, the board of executives, associate executives and the four verticals that carry the work.",
  "contact.email": "",
  "contact.note":
    "The committee is reachable through the Computer Engineering department office at VIT Pune.",
  "console.ranking.note":
    "This counts what people have uploaded. An organiser marks a record verified once they have seen it, and until then it still counts, so treat the board as a record of what the department has on file rather than a judgement about anybody.",
  "console.records.empty":
    "Nothing on your record yet. Anything you add is visible to you and to the committee, and to nobody else on the site.",
};

export type Copy = (key: string, replacements?: Record<string, string | number>) => string;

/**
 * One reader for the whole page, rather than a query per sentence.
 *
 * Returns a function instead of the rows, because a page wants to write
 * `t("home.what")` next to the paragraph it fills and not thread a map through
 * four components. `cache()` means the table is read once per request however
 * many components ask.
 *
 * A key the database has never heard of falls through to the constant, and a
 * key neither of them knows comes back as an empty string rather than the key
 * itself: a heading reading "home.events.title" in production is worse than a
 * heading that is missing.
 */
export const getCopy = cache(async (): Promise<Copy> => {
  const supabase = await createClient();
  const { data } = await supabase.from("site_text").select("key, value");

  const live = new Map((data ?? []).map((row) => [row.key, row.value]));

  return (key, replacements) => {
    const raw = live.get(key) ?? FALLBACK[key] ?? "";
    if (!replacements) return raw;

    return Object.entries(replacements).reduce(
      (text, [token, value]) => text.split(`{${token}}`).join(String(value)),
      raw,
    );
  };
});

/** The whole table, for the console page that edits it. */
export const getSiteText = cache(async (): Promise<SiteTextRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_text")
    .select("*")
    .order("section")
    .order("position");
  return data ?? [];
});

// ---------------------------------------------------------------------------
// The roster
// ---------------------------------------------------------------------------

export type RosterPerson = {
  id: string | null;
  name: string;
  role: string | null;
  rank: "lead" | "head" | null;
  position: number;
  visible: boolean;
};

export type RosterGroup = {
  id: string;
  kind: "people" | "names" | "vertical";
  title: string;
  jp: string | null;
  remit: string | null;
  indexLabel: string | null;
  accent: string | null;
  position: number;
  visible: boolean;
  people: RosterPerson[];
};

/** The committee sheet as it was transcribed, for when the database is away. */
function rosterFallback(): RosterGroup[] {
  const person = (name: string, role: string | null, rank: RosterPerson["rank"], i: number) => ({
    id: null,
    name,
    role,
    rank,
    position: i + 1,
    visible: true,
  });

  return [
    {
      id: "faculty",
      kind: "people" as const,
      title: "Faculty leadership",
      jp: null,
      remit: null,
      indexLabel: null,
      accent: null,
      position: 1,
      visible: true,
      people: FACULTY.map((p, i) => person(p.name, p.role, null, i)),
    },
    {
      id: "student-leadership",
      kind: "people" as const,
      title: "Student leadership",
      jp: null,
      remit: null,
      indexLabel: null,
      accent: null,
      position: 2,
      visible: true,
      people: STUDENT_LEADERSHIP.map((p, i) => person(p.name, p.role, null, i)),
    },
    {
      id: "board",
      kind: "names" as const,
      title: "Board of executives",
      jp: null,
      remit: null,
      indexLabel: null,
      accent: null,
      position: 3,
      visible: true,
      people: BOARD.map((n, i) => person(n, null, null, i)),
    },
    {
      id: "associates",
      kind: "names" as const,
      title: "Associate executives",
      jp: null,
      remit: null,
      indexLabel: null,
      accent: null,
      position: 4,
      visible: true,
      people: ASSOCIATES.map((n, i) => person(n, null, null, i)),
    },
    ...VERTICALS.map((v, n) => ({
      id: v.id,
      kind: "vertical" as const,
      title: v.name,
      jp: v.jp,
      remit: v.remit,
      indexLabel: v.index,
      accent: ["azure", "violet", "lime", "pink"][n] ?? null,
      position: 5 + n,
      visible: true,
      people: v.members.map((m, i) =>
        person(m, null, v.leads.includes(m) ? "lead" : "head", i),
      ),
    })),
  ];
}

/**
 * The roster, grouped the way the page renders it.
 *
 * `all` is for the console, which has to show a hidden block in order to
 * unhide it. The public page filters, and filters in the query as well as
 * here, so a name somebody has taken off the roster is not sitting in the page
 * source of a page that does not display it.
 */
export const getRoster = cache(async (all = false): Promise<RosterGroup[]> => {
  const supabase = await createClient();

  const [groups, people] = await Promise.all([
    supabase.from("roster_groups").select("*").order("position").order("title"),
    supabase.from("roster_people").select("*").order("position").order("name"),
  ]);

  if (!groups.data?.length) return rosterFallback();

  const byGroup = new Map<string, RosterPerson[]>();
  for (const row of people.data ?? []) {
    if (!all && !row.visible) continue;
    const list = byGroup.get(row.group_id) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      role: row.role,
      rank: row.rank === "lead" || row.rank === "head" ? row.rank : null,
      position: row.position,
      visible: row.visible,
    });
    byGroup.set(row.group_id, list);
  }

  return groups.data
    .filter((g) => all || g.visible)
    .map((g) => ({
      id: g.id,
      kind: (g.kind === "names" || g.kind === "vertical" ? g.kind : "people") as RosterGroup["kind"],
      title: g.title,
      jp: g.jp,
      remit: g.remit,
      indexLabel: g.index_label,
      accent: g.accent,
      position: g.position,
      visible: g.visible,
      people: byGroup.get(g.id) ?? [],
    }));
});

/** How many people the roster names. Printed on the /people page. */
export function rosterTotal(groups: RosterGroup[]): number {
  return groups.reduce((n, g) => n + g.people.filter((p) => p.visible).length, 0);
}

// ---------------------------------------------------------------------------
// The points scale
// ---------------------------------------------------------------------------

export type ScaleRow = Tables<"scoring">;

/**
 * What each part of a record is worth, straight from the table the database
 * scores with.
 *
 * There is no fallback copy of these numbers anywhere, on purpose. A scale
 * printed from a constant while the database scores from a table is a console
 * that lies to the student about their own total, and that is worse than a
 * panel that says it could not read the scale.
 */
export const getScale = cache(async (): Promise<ScaleRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("scoring").select("*").order("band").order("position");
  return data ?? [];
});

// ---------------------------------------------------------------------------
// The showcase
// ---------------------------------------------------------------------------

export type ShowcaseEntry = {
  place: number;
  studentId: string;
  name: string;
  year: string | null;
  value: number;
  note: string | null;
};

export type ShowcaseCategory = {
  id: string;
  title: string;
  blurb: string;
  metric: string;
  entries: ShowcaseEntry[];
};

/** What the number under a name means, in the words the card prints. */
export const METRICS: readonly { value: string; label: string; unit: string; note: string }[] = [
  { value: "points", label: "Most points", unit: "points", note: "Everything on their record, added up on the scale." },
  { value: "wins", label: "Most places won", unit: "placed", note: "First, second and third places brought back." },
  { value: "publications", label: "Most published", unit: "published", note: "Papers, books and chapters." },
  { value: "prize_money", label: "Most prize money", unit: "won", note: "In rupees, from the records they have filed." },
  { value: "international", label: "Most international", unit: "international", note: "Records at international level." },
  { value: "records", label: "Most on file", unit: "records", note: "How many records they have uploaded, of any kind." },
  { value: "manual", label: "Chosen by the committee", unit: "", note: "Nobody is ranked. You name them yourself." },
];

export const METRIC_LABEL: Record<string, string> = Object.fromEntries(
  METRICS.map((m) => [m.value, m.label]),
);

export function metricUnit(metric: string): string {
  return METRICS.find((m) => m.value === metric)?.unit ?? "";
}

/**
 * The front page showcase.
 *
 * One database function does the counting, because the page runs for
 * signed-out visitors and `profiles` is closed to them. It hands back a name,
 * a year, a number and the committee's note, and nothing else: no address, no
 * PRN, no phone, and no record titles. Anybody who has asked not to be named
 * is left out of it before it gets here.
 *
 * A category with nothing in it comes back empty rather than being dropped, so
 * the console can see that the category it just made is not showing anything
 * yet. The public section is the one that skips them.
 */
export const getShowcase = cache(async (): Promise<ShowcaseCategory[]> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("showcase_board");

  const byCategory = new Map<string, ShowcaseCategory>();
  for (const row of data ?? []) {
    const existing = byCategory.get(row.category_id) ?? {
      id: row.category_id,
      title: row.category_title,
      blurb: row.category_blurb,
      metric: row.metric,
      entries: [],
    };
    existing.entries.push({
      place: Number(row.place),
      studentId: row.student_id,
      name: row.name,
      year: row.year,
      value: Number(row.value),
      note: row.note,
    });
    byCategory.set(row.category_id, existing);
  }

  return [...byCategory.values()];
});

/** Every category, shown or not, for the console page that edits them. */
export const getShowcaseCategories = cache(async (): Promise<Tables<"showcase_categories">[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("showcase_categories")
    .select("*")
    .order("position")
    .order("title");
  return data ?? [];
});

export type ShowcasePick = Tables<"showcase_picks"> & {
  student: Pick<Tables<"profiles">, "id" | "full_name" | "email" | "year"> | null;
};

export const getShowcasePicks = cache(async (): Promise<ShowcasePick[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("showcase_picks")
    .select("*, student:profiles!showcase_picks_student_id_fkey(id, full_name, email, year)")
    .order("category_id")
    .order("position");
  return (data ?? []) as unknown as ShowcasePick[];
});
