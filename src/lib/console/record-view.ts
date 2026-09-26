import { rupees } from "@/lib/console/options";
import { KIND_LABEL, LAYOUT, LEVEL_LABEL } from "@/lib/console/records";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * What one record says about itself, as label and value pairs.
 *
 * Built from the record's own layout in records.ts, so each kind prints the
 * questions it asked, in the words it asked them: an internship's
 * "Company or organisation" rather than a hackathon's "Organised by". Anything
 * not filled in is left out, which is what makes the block read as a summary
 * of the claim being checked rather than a dump of the row.
 *
 * It lives here because two consoles print it now, the organiser's records
 * queue and the verifier's, and two copies of a list this long drift apart the
 * first time a column is added to one of them.
 */
export function recordFacts(record: Tables<"certificates">): [string, string][] {
  const layout = LAYOUT[record.kind];
  const row = record as unknown as Record<string, string | number | boolean | null>;

  const facts: [string, string][] = [
    ["Kind", KIND_LABEL[record.kind] ?? record.kind],
    ["Level", record.level ? LEVEL_LABEL[record.level] : ""],
    [layout?.dateLabel ?? "Date", onDay(record.happened_on) ?? ""],
  ];

  for (const field of layout?.fields ?? []) {
    const value = row[field.name];
    if (value === null || value === undefined || value === "") continue;
    if (field.type === "bool") facts.push([field.label, yesNo(value as boolean)]);
    else if (field.type === "date") facts.push([field.label, onDay(String(value)) ?? ""]);
    else if (field.name === "stipend_inr") {
      facts.push([field.label, Number(value) === 0 ? "Unpaid" : `${rupees(Number(value))} a month`]);
    } else facts.push([field.label, String(value)]);
  }

  return facts.filter(([, value]) => Boolean(value));
}

function yesNo(value: boolean | null): string {
  return value === null ? "" : value ? "Yes" : "No";
}

/**
 * Stamps are printed in IST rather than in whatever the machine is set to.
 *
 * This renders on a server, and on Vercel that server runs in UTC, so an
 * upload made at ten in the morning would be listed as half past four. A queue
 * is worked oldest first and these stamps are how somebody checks they are
 * working it in order, so they have to read as the time the student saw.
 */
export const ZONE = "Asia/Kolkata";

export function stamp(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ZONE,
  });
}

/** A date somebody typed on a form, printed the way they would read it. */
export function onDay(date: string | null): string | null {
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: ZONE });
}

const DAY = 24 * 60 * 60 * 1000;

/** Whole days between the record landing and this request. */
export function waited(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
}

export function humanBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const FILE_KIND: Record<string, string> = {
  "application/pdf": "PDF",
  "image/png": "PNG",
  "image/jpeg": "JPG",
};

/** Which of three states a record is in, from the two columns that carry it. */
export type RecordState = "waiting" | "verified" | "turned down";

export function recordState(record: Pick<Tables<"certificates">, "verified" | "verified_at">) {
  if (record.verified) return "verified" as const;
  return (record.verified_at ? "turned down" : "waiting") as RecordState;
}
