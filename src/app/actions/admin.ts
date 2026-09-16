"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/database.types";

export type AdminState = { error?: string; notice?: string };

/**
 * Every action here calls requireAdmin first, and every function it calls in
 * the database re-checks is_admin itself. Two locks on the same door on
 * purpose: this one gives a participant a clean redirect instead of an error
 * page, and the one in the database is the one that actually holds if this
 * file is ever wrong.
 */
async function adminClient() {
  await requireAdmin();
  return createClient();
}

function say(error: { message: string } | null, done: string): AdminState {
  if (error) return { error: error.message.replace(/^.*?:\s*/, "") };
  revalidatePath("/admin");
  return { notice: done };
}

export async function verifyPayment(_state: AdminState, formData: FormData): Promise<AdminState> {
  const teamId = String(formData.get("team_id") ?? "");
  const verified = String(formData.get("verified") ?? "") === "true";
  const reason = String(formData.get("reason") ?? "").trim();

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_verify_payment", {
    p_team_id: teamId,
    p_verified: verified,
    p_reason: reason || undefined,
  });

  return say(error, verified ? "Payment verified." : "Payment sent back.");
}

export async function markPaidOffline(_state: AdminState, formData: FormData): Promise<AdminState> {
  const teamId = String(formData.get("team_id") ?? "");
  const method = String(formData.get("method") ?? "cash") as Enums<"payment_method">;
  const reference = String(formData.get("reference") ?? "").trim();

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_mark_paid_offline", {
    p_team_id: teamId,
    p_method: method,
    p_reference: reference || undefined,
  });

  return say(error, "Marked paid. The team is registered once it has two people.");
}

export async function setChapterState(_state: AdminState, formData: FormData): Promise<AdminState> {
  const chapterId = String(formData.get("chapter_id") ?? "");
  const state = String(formData.get("state") ?? "") as Enums<"chapter_state">;

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_set_chapter_state", {
    p_chapter_id: chapterId,
    p_state: state,
  });

  revalidatePath("/dashboard");
  return say(
    error,
    state === "open"
      ? "Chapter open. Teams can hand in now."
      : state === "closed"
        ? "Chapter closed. Every hand-in in it is locked."
        : state === "graded"
          ? "Chapter marked graded."
          : "Chapter locked.",
  );
}

export async function scoreTeam(_state: AdminState, formData: FormData): Promise<AdminState> {
  const teamId = String(formData.get("team_id") ?? "");
  const chapterId = String(formData.get("chapter_id") ?? "");
  const raw = String(formData.get("points") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const points = Number(raw);
  if (!raw || Number.isNaN(points) || points < 0) {
    return { error: "Enter the score as a number." };
  }

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_score_team", {
    p_team_id: teamId,
    p_chapter_id: chapterId,
    p_points: points,
    p_notes: notes || undefined,
  });

  return say(error, "Score saved.");
}

/**
 * The cut. Keeps the chapter's top teams by score and marks the rest
 * eliminated at that chapter. Reversible one team at a time, because on the
 * day a cut gets disputed and somebody has to be able to put a team back.
 */
export async function applyCut(_state: AdminState, formData: FormData): Promise<AdminState> {
  const chapterId = String(formData.get("chapter_id") ?? "");

  const supabase = await adminClient();
  const { data, error } = await supabase.rpc("admin_apply_cut", { p_chapter_id: chapterId });

  if (error) return { error: error.message.replace(/^.*?:\s*/, "") };
  revalidatePath("/admin");
  revalidatePath("/dashboard");

  return {
    notice:
      data === 0
        ? "Nothing to cut. Every remaining team is already inside the limit."
        : `Cut applied. ${data} ${data === 1 ? "team is" : "teams are"} out.`,
  };
}

export async function restoreTeam(_state: AdminState, formData: FormData): Promise<AdminState> {
  const teamId = String(formData.get("team_id") ?? "");
  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_restore_team", { p_team_id: teamId });
  return say(error, "Team put back in.");
}

export async function setRole(_state: AdminState, formData: FormData): Promise<AdminState> {
  const profileId = String(formData.get("profile_id") ?? "");
  const role = String(formData.get("role") ?? "participant") as Enums<"app_role">;

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_set_role", {
    p_profile_id: profileId,
    p_role: role,
  });

  return say(error, role === "participant" ? "Organiser access removed." : "Now an organiser.");
}

/**
 * Adds an email to the allowlist. Anyone signing in on it becomes an
 * organiser, and if they already have an account they are promoted now, so
 * the list never disagrees with the roles.
 */
export async function addOrganiserEmail(_state: AdminState, formData: FormData): Promise<AdminState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const note = String(formData.get("note") ?? "").trim();

  if (!email.includes("@")) return { error: "That is not an email address." };

  const supabase = await adminClient();
  const { error } = await supabase
    .from("admin_emails")
    .upsert({ email, note: note || null }, { onConflict: "email" });

  if (error) return { error: error.message };

  const { data: existing } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
  if (existing) {
    await supabase.rpc("admin_set_role", { p_profile_id: existing.id, p_role: "admin" });
  }

  revalidatePath("/admin");
  return {
    notice: existing
      ? "Added, and that account is an organiser now."
      : "Added. They become an organiser the moment they sign in.",
  };
}

export async function removeOrganiserEmail(_state: AdminState, formData: FormData): Promise<AdminState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const supabase = await adminClient();
  const { error } = await supabase.from("admin_emails").delete().eq("email", email);
  return say(error, "Removed from the allowlist. Any existing role is unchanged.");
}

export async function updateSettings(_state: AdminState, formData: FormData): Promise<AdminState> {
  const viewer = await requireAdmin();
  const supabase = await createClient();

  const seats = Number(String(formData.get("seats_cap") ?? "80"));
  const fee = Number(String(formData.get("entry_fee_inr") ?? "125"));

  if (Number.isNaN(seats) || seats < 1) return { error: "Seats has to be a number above zero." };
  if (Number.isNaN(fee) || fee < 0) return { error: "The entry fee has to be a number." };

  const { error } = await supabase
    .from("settings")
    .update({
      registration_open: formData.get("registration_open") === "on",
      leaderboard_public: formData.get("leaderboard_public") === "on",
      online_payment: formData.get("online_payment") === "on",
      seats_cap: seats,
      entry_fee_inr: fee,
      upi_id: String(formData.get("upi_id") ?? "").trim() || null,
      upi_payee_name: String(formData.get("upi_payee_name") ?? "").trim() || null,
      announcement: String(formData.get("announcement") ?? "").trim() || null,
      updated_by: viewer.id,
    })
    .eq("id", 1);

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/events/attack-on-token");
  revalidatePath("/");

  return say(error, "Saved.");
}
