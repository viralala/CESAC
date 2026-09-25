/**
 * What a showcase category can rank on, and the words each one prints.
 *
 * Kept apart from lib/data/site.ts, which is server-only, because the
 * standouts page searches and switches categories in the browser and needs the
 * unit under each number there too.
 */

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
