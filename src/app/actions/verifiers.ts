"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";
import type { AdminState } from "@/app/actions/admin";

/**
 * Making, repasswording and removing the people who check records.
 *
 * All three go through `security definer` functions that check
 * `admin_can('people')` in Postgres first, and the account itself is built
 * there too: the row in `auth.users`, the matching identity, and the profile
 * the sign-up trigger makes off the back of it.
 *
 * It is done in the database rather than through Supabase's admin API on
 * purpose. That API needs the service role key, and this deployment has never
 * carried one: the whole design is that organiser powers ride on the signed-in
 * organiser's own session and are enforced by row level security. Putting a
 * key that bypasses every policy into the deployment so that one form could
 * work would have undone that, for the one feature that least needs it.
 *
 * requireAdmin here is the same second lock every other action has. It turns
 * "not an organiser" into a clean redirect rather than an error page, and the
 * check in the database is the one that holds.
 */

async function adminClient() {
  await requireAdmin();
  return createClient();
}

function say(error: { message: string } | null, done: string): AdminState {
  if (error) return { error: error.message.replace(/^.*?:\s*/, "") };
  return { notice: done };
}

function refresh(): void {
  revalidatePath("/admin/access");
  revalidatePath("/admin");
}

/**
 * Add a verifier, with the password the organiser typed.
 *
 * The password is read from the form and handed straight to the database
 * function, which hashes it with bcrypt before it touches a column. It is
 * never written to the audit log, never logged, and never read back: the only
 * copy is the one the organiser is about to give the person, which is why the
 * page says to write it down before saving.
 */
export async function addVerifier(_state: AdminState, formData: FormData): Promise<AdminState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!email) return { error: "Put in the email address they will sign in with." };
  if (password.length < 8) {
    return { error: "A verifier password has to be at least 8 characters." };
  }

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_create_verifier", {
    p_email: email,
    p_password: password,
    p_name: name || undefined,
  });

  refresh();
  return say(error, `${email} can sign in now, and lands on the checking queue.`);
}

/** Set a new password on a verifier who has forgotten theirs. */
export async function setVerifierPassword(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const id = String(formData.get("profile_id") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!id) return { error: "That verifier is not on the page any more. Reload it." };
  if (password.length < 8) {
    return { error: "A verifier password has to be at least 8 characters." };
  }

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_set_verifier_password", {
    p_profile_id: id,
    p_password: password,
  });

  refresh();
  return say(error, "Password changed. Their old one stops working at once.");
}

/**
 * Take a verifier away.
 *
 * The account goes, and the profile with it on the cascade. Records they
 * verified keep the verified mark: `verified_by` is on delete set null, so the
 * record stays checked and simply stops naming who checked it. That is the
 * right way round. Undoing a term of somebody's decisions because they left
 * the committee would put work back in a queue that has already been done.
 */
export async function removeVerifier(_state: AdminState, formData: FormData): Promise<AdminState> {
  const id = String(formData.get("profile_id") ?? "");
  if (!id) return { error: "That verifier is not on the page any more. Reload it." };

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_remove_verifier", { p_profile_id: id });

  refresh();
  return say(error, "Removed. They cannot sign in any more.");
}
