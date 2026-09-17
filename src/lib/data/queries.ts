import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type Query = Tables<"queries">;

/**
 * The student's own questions, newest first.
 *
 * queries_read_own does the filtering. The explicit author filter is the
 * second lock, for the day somebody calls this from a page an organiser can
 * reach: an organiser passes that policy for every row in the table.
 */
export const getMyQueries = cache(async (): Promise<Query[]> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("queries")
    .select("*")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
});
