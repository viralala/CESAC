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
};

export function viewerFrom(profile: Profile): Viewer {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.full_name?.trim() || profile.email.split("@")[0],
    role: profile.role,
    avatarUrl: profile.avatar_url,
    isAdmin: profile.role === "admin" || profile.role === "owner",
  };
}

/** Where a role belongs after signing in. */
export function homeFor(role: Role): string {
  return role === "participant" ? "/dashboard" : "/admin";
}
