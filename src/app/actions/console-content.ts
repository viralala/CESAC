"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";
import type { AdminState } from "@/app/actions/admin";

/**
 * The writes behind the console's content pages.
 *
 * Every one of them calls a `security definer` function that checks the
 * organiser's capability in Postgres first. The tables themselves carry a read
 * policy and no write policy at all, so these functions are not a convenience
 * over a direct update: they are the only door. A hand-made request to
 * PostgREST against `site_text` or `roster_people` is refused by row level
 * security whatever this file does.
 *
 * requireAdmin here is the same second lock every action in admin.ts has: it
 * gives somebody who is not an organiser a clean redirect instead of an error
 * page, and the check in the database is the one that actually holds.
 */

async function adminClient() {
  await requireAdmin();
  return createClient();
}

/** Every page the public site renders content on. Cheap, and easy to forget. */
function refreshPublic(): void {
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/people");
  revalidatePath("/events");
}

function say(error: { message: string } | null, done: string): AdminState {
  if (error) return { error: error.message.replace(/^.*?:\s*/, "") };
  return { notice: done };
}

// ---------------------------------------------------------------------------
// The points scale
// ---------------------------------------------------------------------------

/**
 * Move one number on the scale.
 *
 * The ranking recomputes from it on the next request: nothing is stored
 * against a record, so changing what participation is worth re-scores every
 * record in the department at once. That is the point, and it is why the page
 * says so out loud above the form.
 */
export async function setPoints(_state: AdminState, formData: FormData): Promise<AdminState> {
  const key = String(formData.get("key") ?? "");
  const raw = String(formData.get("points") ?? "").trim();

  const points = Number(raw);
  if (!raw || !Number.isInteger(points) || points < 0 || points > 10000) {
    return { error: "A score is a whole number between 0 and 10000." };
  }

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_set_points", { p_key: key, p_points: points });

  revalidatePath("/admin/site");
  revalidatePath("/dashboard/ranking");
  revalidatePath("/dashboard/certificates");
  refreshPublic();

  return say(error, "Saved. Every record is scored on the new number from now on.");
}

// ---------------------------------------------------------------------------
// Sentences on the public site
// ---------------------------------------------------------------------------

/**
 * Save every sentence in one section at once.
 *
 * A save button per field would be four clicks to reword a paragraph and its
 * heading. The fields arrive as `text.<key>`, each one goes through the
 * function that checks the capability, and the first refusal stops the rest:
 * a half-saved section is worse than one that did not save, because nobody can
 * tell by looking which half went through.
 */
export async function saveSiteText(_state: AdminState, formData: FormData): Promise<AdminState> {
  const supabase = await adminClient();

  const changes = [...formData.entries()]
    .filter(([name]) => name.startsWith("text."))
    .map(([name, value]) => ({ key: name.slice(5), value: String(value) }));

  if (!changes.length) return { error: "Nothing to save." };

  for (const change of changes) {
    const { error } = await supabase.rpc("admin_set_site_text", {
      p_key: change.key,
      p_value: change.value,
    });
    if (error) {
      return {
        error: `${error.message.replace(/^.*?:\s*/, "")} Nothing after "${change.key}" was saved.`,
      };
    }
  }

  revalidatePath("/admin/site");
  refreshPublic();

  return {
    notice: `Saved. ${changes.length === 1 ? "The sentence is" : `All ${changes.length} are`} live on the site now.`,
  };
}

// ---------------------------------------------------------------------------
// The roster
// ---------------------------------------------------------------------------

export async function saveRosterPerson(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const name = String(formData.get("name") ?? "").trim();
  const groupId = String(formData.get("group_id") ?? "").trim();

  if (!name) return { error: "A person needs a name." };
  if (!groupId) return { error: "Which block should they go in?" };

  const position = Number(String(formData.get("position") ?? "0"));
  if (Number.isNaN(position)) return { error: "The order has to be a number." };

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_upsert_roster_person", {
    p_id: String(formData.get("person_id") ?? "").trim() || null,
    p_group_id: groupId,
    p_name: name,
    p_role: String(formData.get("role") ?? "").trim() || undefined,
    p_rank: String(formData.get("rank") ?? "").trim() || undefined,
    p_position: position,
    p_visible: formData.get("visible") === "on",
  });

  revalidatePath("/admin/site");
  refreshPublic();

  return say(error, `${name} saved.`);
}

export async function deleteRosterPerson(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const id = String(formData.get("person_id") ?? "").trim();
  if (!id) return { error: "That person is not on the page any more. Reload it." };

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_delete_roster_person", { p_id: id });

  revalidatePath("/admin/site");
  refreshPublic();

  return say(error, "Taken off the roster.");
}

export async function saveRosterGroup(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const id = String(formData.get("group_id") ?? "").trim().toLowerCase();
  const title = String(formData.get("title") ?? "").trim();

  if (!id) return { error: "Give the block an id: lowercase letters and hyphens." };
  if (!title) return { error: "Give the block a heading." };

  const position = Number(String(formData.get("position") ?? "0"));
  if (Number.isNaN(position)) return { error: "The order has to be a number." };

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_upsert_roster_group", {
    p_id: id,
    p_kind: String(formData.get("kind") ?? "people"),
    p_title: title,
    p_jp: String(formData.get("jp") ?? "").trim() || undefined,
    p_remit: String(formData.get("remit") ?? "").trim() || undefined,
    p_index_label: String(formData.get("index_label") ?? "").trim() || undefined,
    p_accent: String(formData.get("accent") ?? "").trim() || undefined,
    p_position: position,
    p_visible: formData.get("visible") === "on",
  });

  revalidatePath("/admin/site");
  refreshPublic();

  return say(error, "Block saved.");
}

/**
 * Remove a whole block, and everybody in it.
 *
 * The cascade is the database's, not this file's, and it is deliberate: a
 * block with no heading and forty orphaned names in it is not a state anybody
 * wants to find. The console asks first, and says how many people go with it.
 */
export async function deleteRosterGroup(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const id = String(formData.get("group_id") ?? "").trim();
  if (!id) return { error: "That block is not on the page any more. Reload it." };

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_delete_roster_group", { p_id: id });

  revalidatePath("/admin/site");
  refreshPublic();

  return say(error, "Block removed, and everybody who was in it.");
}

// ---------------------------------------------------------------------------
// The front page showcase
// ---------------------------------------------------------------------------

export async function saveShowcaseCategory(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const id = String(formData.get("category_id") ?? "").trim().toLowerCase();
  const title = String(formData.get("title") ?? "").trim();

  if (!id) return { error: "Give the category an id: lowercase letters and hyphens." };
  if (!title) return { error: "Give the category a heading." };

  const slots = Number(String(formData.get("slots") ?? "3"));
  const position = Number(String(formData.get("position") ?? "0"));
  if (!Number.isInteger(slots) || slots < 1 || slots > 12) {
    return { error: "A category shows between one and twelve people." };
  }
  if (Number.isNaN(position)) return { error: "The order has to be a number." };

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_upsert_showcase_category", {
    p_id: id,
    p_title: title,
    p_blurb: String(formData.get("blurb") ?? "").trim(),
    p_metric: String(formData.get("metric") ?? "points"),
    p_slots: slots,
    p_position: position,
    p_visible: formData.get("visible") === "on",
  });

  revalidatePath("/admin/site");
  refreshPublic();

  return say(error, "Saved. It is on the front page on the next load.");
}

export async function deleteShowcaseCategory(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const id = String(formData.get("category_id") ?? "").trim();
  if (!id) return { error: "That category is not on the page any more. Reload it." };

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_delete_showcase_category", { p_id: id });

  revalidatePath("/admin/site");
  refreshPublic();

  return say(error, "Category removed.");
}

/**
 * Name somebody for a category that does not rank itself.
 *
 * "Best outgoing student" is a judgement and no number will make it, which is
 * why a manual category exists at all. The student is found by address rather
 * than picked from a list: there are 1,871 accounts and a select with all of
 * them in it would put the whole roster in the page source of the console.
 */
export async function addShowcasePick(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!categoryId) return { error: "Which category? Reload the page and try again." };
  if (!email.includes("@")) return { error: "Put in the student's college address." };

  const position = Number(String(formData.get("position") ?? "0"));
  if (Number.isNaN(position)) return { error: "The order has to be a number." };

  const supabase = await adminClient();

  const { data: student } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("email", email)
    .maybeSingle();

  if (!student) return { error: `There is no account on ${email}.` };

  const { error } = await supabase.rpc("admin_set_showcase_pick", {
    p_category_id: categoryId,
    p_student_id: student.id,
    p_note: String(formData.get("note") ?? "").trim() || undefined,
    p_position: position,
  });

  revalidatePath("/admin/site");
  refreshPublic();

  return say(error, `${student.full_name ?? email} named.`);
}

export async function removeShowcasePick(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const studentId = String(formData.get("student_id") ?? "").trim();
  if (!categoryId || !studentId) {
    return { error: "That pick is not on the page any more. Reload it." };
  }

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_remove_showcase_pick", {
    p_category_id: categoryId,
    p_student_id: studentId,
  });

  revalidatePath("/admin/site");
  refreshPublic();

  return say(error, "Taken off the front page.");
}

// ---------------------------------------------------------------------------
// Who may reach what
// ---------------------------------------------------------------------------

/**
 * Narrow one organiser to some areas of the console.
 *
 * Ticking nothing at all is allowed and means exactly what it looks like: an
 * organiser who can open the console and write nothing. That is a real state
 * somebody may want, for a committee member who is being shown around, so it
 * is not treated as an empty form.
 *
 * Every box unticked is not the same as no restriction. "Everything" is the
 * absence of a row, which is what clearGrants below does.
 */
export async function setGrants(_state: AdminState, formData: FormData): Promise<AdminState> {
  const profileId = String(formData.get("profile_id") ?? "").trim();
  if (!profileId) return { error: "Which organiser? Reload the page and try again." };

  const caps = formData.getAll("cap").map((c) => String(c));

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_set_grants", {
    p_profile_id: profileId,
    p_caps: caps,
    p_note: String(formData.get("note") ?? "").trim() || undefined,
  });

  revalidatePath("/admin");

  return say(
    error,
    caps.length === 0
      ? "Saved. They can open the console and change nothing in it."
      : `Saved. ${caps.length} ${caps.length === 1 ? "area" : "areas"}.`,
  );
}

export async function clearGrants(_state: AdminState, formData: FormData): Promise<AdminState> {
  const profileId = String(formData.get("profile_id") ?? "").trim();
  if (!profileId) return { error: "Which organiser? Reload the page and try again." };

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_clear_grants", { p_profile_id: profileId });

  revalidatePath("/admin");

  return say(error, "Back to the whole console.");
}
