import type { Enums, Tables } from "@/lib/supabase/database.types";

export type Role = Enums<"app_role">;
export type Profile = Tables<"profiles">;

/**
 * Who is signed in, as the rest of the app wants to read it.
 *
 * Supabase Auth owns the credential; the profile row owns the role and the
 * display name. This is the two of them joined, and it is the only shape any
 * page or action should have to think about.
 */
export type Viewer = {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  /** True for both 'admin' and 'owner'. The console does not distinguish. */
  isAdmin: boolean;
  /**
   * True for the role that checks student records and does nothing else.
   *
   * Deliberately not a kind of organiser. A verifier fails `isAdmin`, which
   * is the test 26 row level security policies turn on, so nothing an
   * organiser can reach opens to them because somebody forgot a branch.
   */
  isVerifier: boolean;
  /**
   * True while the account still holds the password it was imported with,
   * which is the student's own email address. Every guarded page refuses to
   * render until this is false.
   */
  mustChangePassword: boolean;
};

export function viewerFrom(profile: Profile): Viewer {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.full_name?.trim() || profile.email.split("@")[0],
    role: profile.role,
    avatarUrl: profile.avatar_url,
    isAdmin: profile.role === "admin" || profile.role === "owner",
    isVerifier: profile.role === "verifier",
    mustChangePassword: profile.must_change_password,
  };
}

/**
 * Where a role belongs after signing in.
 *
 * The one place that decides. Sign-in, the OAuth callback, the password screen
 * and every guard read this rather than each having an opinion, which is why
 * adding the verifier was one line rather than five.
 */
export function homeFor(role: Role): string {
  if (role === "participant") return "/dashboard";
  if (role === "verifier") return "/verify";
  return "/admin";
}
