import "server-only";

import { cache } from "react";

import { publicStandoutProfile } from "@/lib/data/public-cache";
import { avatarUrl } from "@/lib/photos";

/** One thing on a standout's record, as much of it as is public. */
export type PublicRecord = {
  kind: string;
  title: string;
  level: string | null;
  contribution: string;
  happened_on: string | null;
  ended_on: string | null;
  publication_year: number | null;
  venue: string | null;
  location: string | null;
  specialization: string | null;
  role: string | null;
  mode: string | null;
  team_name: string | null;
  team_size: number | null;
  theme: string | null;
  project: string | null;
  rank: string | null;
  duration: string | null;
  skills: string | null;
  score: string | null;
  patent_status: string | null;
  chapter: string | null;
  authors: string | null;
  indexing: string | null;
  quartile: string | null;
  publisher: string | null;
  verified: boolean;
};

export type StandoutProfile = {
  id: string;
  name: string;
  year: string | null;
  photo: string | null;
  points: number;
  records: number;
  verified: number;
  wins: number;
  firsts: number;
  seconds: number;
  thirds: number;
  publications: number;
  places: { category: string; place: number; metric: string; value: number }[];
  items: PublicRecord[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * What a standout has done, for the public page under their name.
 *
 * Null for an id that is not a uuid (asked before the database is), for
 * anybody the standouts board does not name, and when the read fails: a
 * profile page that cannot be built says "not found" rather than a stack.
 */
export const getStandoutProfile = cache(async (id: string): Promise<StandoutProfile | null> => {
  if (!UUID.test(id)) return null;

  try {
    const raw = (await publicStandoutProfile(id.toLowerCase())) as StandoutProfile | null;
    if (!raw) return null;
    return {
      ...raw,
      photo: avatarUrl(raw.photo),
      points: Number(raw.points ?? 0),
      records: Number(raw.records ?? 0),
      verified: Number(raw.verified ?? 0),
      wins: Number(raw.wins ?? 0),
      firsts: Number(raw.firsts ?? 0),
      seconds: Number(raw.seconds ?? 0),
      thirds: Number(raw.thirds ?? 0),
      publications: Number(raw.publications ?? 0),
      places: raw.places ?? [],
      items: raw.items ?? [],
    };
  } catch {
    return null;
  }
});
