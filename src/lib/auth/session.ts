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
  /** Where this account's photo sits in the avatars bucket, if it has one. */
  photoPath: string | null;
  /**
   * True for a student or a verifier who has not added a photo yet. Neither
   * console opens until they have. The boards print a photo next to every
   * student's name, and a board of initials is not what was asked for; the
   * faculty who check records were asked for a face on the account as well.
   *
   * Not organisers. Holding the committee at a photo screen would keep the
   * console that runs the site shut for nothing.
   */
  needsPhoto: boolean;
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
    photoPath: profile.photo_path ?? null,
    // `in` rather than a null check, so a deployment that reaches the
    // database before the photo migration has run cannot lock every student
    // out: without the column there is nowhere to save a photo, and the gate
    // stays open until there is.
    needsPhoto:
      (profile.role === "participant" || profile.role === "verifier") &&
      "photo_path" in profile &&
      !profile.photo_path,
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
