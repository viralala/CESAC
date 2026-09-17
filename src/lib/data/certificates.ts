import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type Certificate = Tables<"certificates">;

/**
 * The signed-in student's certificates, newest first.
 *
 * Two things keep one student's files away from another. The real one is the
 * certificates_read_own policy, applied by Postgres to whoever holds the
 * session, so a page that forgets to narrow its query still cannot leak. The
 * owner filter here is the second: an organiser passes that policy for every
 * row in the table, and without it a function called getMyCertificates would
 * quietly return the whole department the day somebody calls it from an admin
 * page. The policy is the boundary; this is the function keeping its word.
 */
export const getMyCertificates = cache(async (): Promise<Certificate[]> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("certificates")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
});
