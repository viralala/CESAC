/**
 * Where the database lives.
 *
 * Both values are public by design and are compiled into the browser bundle
 * either way: the URL is a hostname, and the publishable key grants nothing
 * that row level security does not already allow. They are checked in as
 * defaults so a fresh clone and a fresh deploy both work without anyone
 * setting an environment variable first. Nothing secret is ever hard-coded:
 * the service role key is not used anywhere in this codebase, and the
 * organiser powers ride on the signed-in user's own role instead.
 *
 * Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to
 * point a deploy at a different project, a staging branch for instance.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lgshgaltulbnjqfxjsme.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_oGk622jqQTNejd1QTJWDpg_U0FjfQX2";

/** The bucket chapter hand-ins are uploaded to. Private; read through signed URLs. */
export const SUBMISSIONS_BUCKET = "submissions";
