import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache, updateTag } from "next/cache";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

/**
 * The public pages' reads, shared across every visitor for a minute.
 *
 * Every page on the site renders on request, because the header reads the
 * session to show who is signed in. Before this, that meant every visit to
 * the front page asked the database for the roster, the site copy, the
 * standouts and the event dates all over again, so a link shared in a class
 * group and opened by five hundred people at once was five hundred sets of
 * queries against a free-plan database. Now it is one set a minute, however
 * many people come.
 *
 * Only what is the same for everybody is cached here, and it is read with a
 * client that carries no session at all, so nothing one visitor is allowed to
 * see can ever be served to another. An organiser's view of the roster, which
 * includes hidden rows, never comes through here.
 *
 * A read that fails throws inside the cache, which Next.js does not store, so
 * an outage is never remembered for a minute after it ends. The callers keep
 * their own fallbacks for the moment itself.
 *
 * Organiser edits to the public pages call refreshPublicData(), so a sentence
 * changed in the console shows on the next load rather than a minute later.
 * Student changes (a new record, a new photo) show within the minute.
 */

export const PUBLIC_TAG = "public-data";

const TTL_SECONDS = 60;

function anonymous() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function shared<T>(key: string, read: () => Promise<T>): () => Promise<T> {
  return unstable_cache(read, [key], { revalidate: TTL_SECONDS, tags: [PUBLIC_TAG] });
}

/** Expire everything above now. Server actions only. */
export function refreshPublicData(): void {
  updateTag(PUBLIC_TAG);
}

export const publicSiteText = shared("public:site_text:v1", async () => {
  const { data, error } = await anonymous().from("site_text").select("key, value");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const publicRoster = shared("public:roster:v1", async () => {
  const supabase = anonymous();
  const [groups, people, photos] = await Promise.all([
    supabase.from("roster_groups").select("*").order("position").order("title"),
    supabase.from("roster_people").select("*").order("position").order("name"),
    supabase.rpc("roster_photos"),
  ]);
  if (groups.error) throw new Error(groups.error.message);
  if (people.error) throw new Error(people.error.message);
  return {
    groups: groups.data ?? [],
    people: people.data ?? [],
    // A photo lookup that fails costs the roster its account photos, not the
    // roster itself, the same trade the uncached read made.
    photos: photos.error ? [] : (photos.data ?? []),
  };
});

export const publicStandouts = shared("public:standouts:v1", async () => {
  const { data, error } = await anonymous().rpc("standouts_board");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const publicSchedules = shared("public:event_schedule:v1", async () => {
  const { data, error } = await anonymous().rpc("event_schedule");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const publicEventStates = shared("public:dept_event_states:v1", async () => {
  const { data, error } = await anonymous().rpc("dept_event_states");
  if (error) throw new Error(error.message);
  return data ?? [];
});
