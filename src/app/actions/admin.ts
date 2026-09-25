"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guard";
import { driveCredentials, trashFile } from "@/lib/drive/client";
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

/**
 * Open, lock or close one department event.
 *
 * The one control the committee actually reaches for, and until now the one
 * that did not exist: every event sat at `locked` and the only way to open
 * one was an UPDATE typed into the Supabase dashboard. Everything on the
 * student side reads `dept_events.state`, so this single switch opens the
 * events page, the entry form and register_for_event() together.
 */
export async function setEventState(_state: AdminState, formData: FormData): Promise<AdminState> {
  const slug = String(formData.get("slug") ?? "");
  const next = String(formData.get("state") ?? "") as Enums<"dept_event_state">;

  if (!slug) return { error: "Which event? Reload the page and try again." };
  if (next !== "locked" && next !== "open" && next !== "closed") {
    return { error: "An event is locked, open or closed." };
  }

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_set_event_state", {
    p_slug: slug,
    p_state: next,
  });

  // Every page that shows the state of an event, including the two public
  // ones, so nobody is looking at a cached "not open yet" a minute after it
  // opened.
  revalidatePath("/dashboard/events");
  revalidatePath("/dashboard");
  revalidatePath("/events");
  revalidatePath(`/events/${slug}`);
  revalidatePath("/");

  return say(
    error,
    next === "open"
      ? "Entries are open. Students can enter from their console now."
      : next === "closed"
        ? "Entries closed. Nobody new can enter, and everyone already in stays in."
        : "Locked. The event is listed but takes no entries.",
  );
}

/**
 * Agree that an entry fee arrived, or send it back.
 *
 * Sending it back puts the entry at `pending` rather than `rejected`, so the
 * student can record a corrected reference. `rejected` has no screen that
 * clears it and would strand them.
 */
export async function verifyEntryPayment(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const id = String(formData.get("registration_id") ?? "");
  const verified = String(formData.get("verified") ?? "") === "true";
  const reason = String(formData.get("reason") ?? "").trim();

  if (!id) return { error: "That entry is not on the page any more. Reload it." };

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_verify_event_payment", {
    p_registration_id: id,
    p_verified: verified,
    p_reason: reason || undefined,
  });

  revalidatePath("/admin/entries");
  revalidatePath("/dashboard/events");

  return say(
    error,
    verified ? "Fee verified." : "Sent back. They can record another reference.",
  );
}

/**
 * Withdraw an entry, or put one back.
 *
 * The row is kept either way rather than deleted, so what was entered and
 * what was paid survives the withdrawal. Withdrawing frees both people to
 * enter again, which is the usual reason for doing it: somebody named the
 * wrong partner.
 */
export async function setEntryStatus(_state: AdminState, formData: FormData): Promise<AdminState> {
  const id = String(formData.get("registration_id") ?? "");
  const next = String(formData.get("status") ?? "") as Enums<"registration_status">;

  if (!id) return { error: "That entry is not on the page any more. Reload it." };
  if (next !== "registered" && next !== "withdrawn") {
    return { error: "An entry is in or withdrawn." };
  }

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_set_entry_status", {
    p_registration_id: id,
    p_status: next,
  });

  revalidatePath("/admin/entries");
  revalidatePath("/dashboard/events");
  revalidatePath("/dashboard");

  return say(
    error,
    next === "withdrawn"
      ? "Withdrawn. Both of them can enter again."
      : "Back in.",
  );
}

/**
 * Answering a question moved out of this file on 22 September 2026.
 *
 * It lives in src/app/actions/verify.ts now, next to reviewRecord, because
 * verifiers answer questions too and an action that begins with requireAdmin
 * cannot be shared with a role that is deliberately not an admin. The write
 * itself is `public.answer_question`, which decides for itself whether the
 * caller may answer and records who did in the same statement.
 */


/**
 * Verify a certificate, turn one down, or put one back in the queue.
 *
 * A plain update rather than a security definer function, for the same
 * reason answering a question was one: the admin update policy on `certificates`
 * is the whole rule, there is no second table to keep in step, and a
 * function would only be a second copy of a check Postgres already makes on
 * the row. `verified_by` is the viewer and never anything the form sent,
 * because who checked a certificate is not the browser's to say.
 *
 * **Three states out of one boolean.** The table has `verified` and nothing
 * else, and an organiser has three things to say: not looked at, checked and
 * good, checked and no. The third is carried by `verified_at`. A row nobody
 * has opened has `verified = false` and no stamp; a row somebody turned down
 * has `verified = false` and a stamp and a name. That is what makes the queue
 * clearable, and a queue that cannot be cleared is the whole problem this
 * page exists to solve: without it the duplicate a student uploaded twice
 * sits at the top of the list every morning and every organiser decides
 * about it again.
 *
 * A `rejected` column would say it more plainly and is a migration, which
 * this page deliberately is not. Leaving a turned-down row indistinguishable
 * from an unread one was the other option and is worse than it sounds: the
 * rows that most need turning down are the ones an organiser has already
 * looked at, so they are exactly the rows that would never leave the queue.
 *
 * Putting one back clears all three columns, rather than keeping the name of
 * whoever last touched it. `verified_by` on a row in the queue would be a
 * claim that somebody has checked it, and the entire point of that move is
 * that nobody has.
 *
 * **What this does not do.** Turning a certificate down does not take its
 * points off the ranking: ranking_board() counts every row whatever its
 * state, and changing that is a migration too. It does not delete anything
 * from Drive either. The page says both out loud.
 */
export async function reviewCertificate(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const id = String(formData.get("certificate_id") ?? "");
  const decision = String(formData.get("decision") ?? "");

  if (!id) return { error: "That certificate is not on the page any more. Reload it." };
  if (decision !== "verify" && decision !== "reject" && decision !== "reopen") {
    return { error: "A certificate is verified, turned down, or put back in the queue." };
  }

  await requireAdmin();
  const supabase = await createClient();

  /*
   * One function in the database, shared with the verifier's console.
   *
   * This used to be a direct update through the admin write policy, which
   * worked and had two problems. Nothing was written to the audit log, so the
   * one console decision with a student's name against it was the one
   * decision with no record of who made it. And when verifiers arrived there
   * were two screens doing the same thing by different routes, which is two
   * places for the rule to drift. verify_record checks that the caller is a
   * verifier or an organiser holding Student records, writes the decision and
   * writes the audit entry, in one statement that cannot half happen.
   */
  const { error } = await supabase.rpc("verify_record", {
    p_certificate_id: id,
    p_decision: decision,
  });

  // The student's own record carries the verified mark, so their page has to
  // be rebuilt too. The ranking is deliberately not in this list: it counts
  // certificates whatever state they are in, so nothing here changes it.
  revalidatePath("/admin/certificates");
  revalidatePath("/dashboard/certificates");
  revalidatePath("/verify");

  return say(
    error,
    decision === "verify"
      ? "Verified. It shows as checked on the student's record."
      : decision === "reject"
        ? "Turned down, and out of the queue. It still counts on the ranking, and the file is still in Drive."
        : "Back in the queue, with no decision on it.",
  );
}

/**
 * Add an event, or change one.
 *
 * The slug is the key and the URL both, so an existing event is edited by
 * its slug and a new one is born locked. Changing a slug is deliberately not
 * possible here: every entry points at this column, and moving it would
 * orphan them.
 */
/**
 * Take a student's record off the board entirely.
 *
 * For the duplicate somebody uploaded twice, the screenshot of nothing, and
 * the certificate for an event that turns out to be somebody else's. Turning a
 * record down leaves it on the ranking, which is the honest behaviour for a
 * disputed claim; this is for a row that should never have existed.
 *
 * The Drive files go to the bin first, and only then the row. The other order
 * loses the ability to find them: the ids are on the row. A file that fails to
 * trash does not stop the delete, because a row nobody can remove is a worse
 * problem than a file in a folder, and the audit entry records what it was.
 */
export async function deleteCertificate(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const id = String(formData.get("certificate_id") ?? "");
  if (!id) return { error: "That record is not on the page any more. Reload it." };

  await requireAdmin();
  const supabase = await createClient();

  const { data: record } = await supabase
    .from("certificates")
    .select("id, event_name, drive_file_id, files:certificate_files(drive_file_id)")
    .eq("id", id)
    .maybeSingle();

  if (!record) return { error: "That record is not there any more. Reload the page." };

  const creds = driveCredentials();
  if (creds) {
    const ids = [
      record.drive_file_id,
      ...(record.files ?? []).map((f: { drive_file_id: string }) => f.drive_file_id),
    ].filter((fileId): fileId is string => Boolean(fileId));

    await Promise.all(ids.map((fileId) => trashFile(creds, fileId).catch(() => {})));
  }

  const { error } = await supabase.rpc("admin_delete_certificate", { p_id: id });

  revalidatePath("/admin/certificates");
  revalidatePath("/dashboard/certificates");
  revalidatePath("/dashboard/ranking");
  revalidatePath("/");

  return say(
    error,
    `${record.event_name} deleted. Its files are in the Drive bin for thirty days.`,
  );
}

export async function saveDeptEvent(_state: AdminState, formData: FormData): Promise<AdminState> {
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();

  if (!slug) return { error: "Give it a slug: the last part of its web address." };
  if (!name) return { error: "Give it a name." };

  const fee = Number(String(formData.get("fee_inr") ?? "0"));
  const size = Number(String(formData.get("team_size") ?? "1"));
  const position = Number(String(formData.get("position") ?? "0"));

  if (Number.isNaN(fee) || fee < 0) return { error: "The entry fee has to be a number." };
  if (size !== 1 && size !== 2) return { error: "An event is entered solo or in pairs." };
  if (Number.isNaN(position)) return { error: "The order has to be a number." };

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_upsert_dept_event", {
    p_slug: slug,
    p_name: name,
    p_kicker: String(formData.get("kicker") ?? "").trim(),
    p_one_liner: String(formData.get("one_liner") ?? "").trim(),
    p_when_label: String(formData.get("when_label") ?? "").trim(),
    p_fee_inr: fee,
    p_team_size: size,
    p_position: position,
    p_href: String(formData.get("href") ?? "").trim() || undefined,
  });

  revalidatePath("/admin/entries");
  revalidatePath("/dashboard/events");
  revalidatePath("/events");

  return say(error, "Saved. A new event starts locked, so open it when you are ready.");
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
      showcase_public: formData.get("showcase_public") === "on",
      seats_cap: seats,
      entry_fee_inr: fee,
      upi_id: String(formData.get("upi_id") ?? "").trim() || null,
      upi_payee_name: String(formData.get("upi_payee_name") ?? "").trim() || null,
      announcement: String(formData.get("announcement") ?? "").trim() || null,
      updated_by: viewer.id,
    })
    .eq("id", 1);

  revalidatePath("/admin");
  revalidatePath("/admin/site/showcase");
  revalidatePath("/dashboard");
  revalidatePath("/events/attack-on-token");
  revalidatePath("/");

  return say(error, "Saved.");
}

/**
 * Set somebody's password, from the console.
 *
 * Asked for so that a student who has forgotten theirs does not have to wait
 * for email, which this project can barely send (see HANDOVER.md, item 1).
 * All of the rules are in `admin_set_password()` and none of them here, so a
 * crafted request meets the same ladder the form does: an organiser holding
 * People and access sets a student's or a verifier's, only the owner sets an
 * organiser's, nobody sets the owner's, and nobody sets their own this way.
 *
 * By default the account is put back behind the choose-a-password screen, so
 * what the organiser read out works for exactly one sign-in. The password is
 * handed to the database and hashed there; it is not logged, not written to
 * the audit entry and not kept anywhere, which is why the form says to note
 * it down before saving.
 */
export async function setAccountPassword(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const mustChange = formData.get("must_change") === "on";

  if (!email.includes("@")) return { error: "Put in the email address the account signs in with." };
  if (password.length < 8) return { error: "A password has to be at least 8 characters." };

  const supabase = await adminClient();
  const { data, error } = await supabase.rpc("admin_set_password", {
    p_email: email,
    p_password: password,
    p_must_change: mustChange,
  });

  revalidatePath("/admin/students");
  revalidatePath("/admin/access");
  return say(
    error,
    mustChange
      ? `Done. ${data ?? email} can sign in with it once, and is asked to choose their own straight away. Every session they had open is signed out.`
      : `Done. ${data ?? email} signs in with it from now on. Every session they had open is signed out.`,
  );
}

/**
 * Take a photo off an account.
 *
 * For the one that should not be on the front page. The student is sent back
 * to the photo step the next time they open their console, which is the whole
 * of the moderation: they pick a better one.
 */
export async function clearPhoto(_state: AdminState, formData: FormData): Promise<AdminState> {
  const id = String(formData.get("profile_id") ?? "");
  if (!id) return { error: "That account is not on the page any more. Reload it." };

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_clear_photo", { p_profile_id: id });

  revalidatePath("/", "layout");
  return say(error, "Photo removed. They are asked for a new one when they next open their console.");
}

/** A datetime-local value, read as India time. */
function istInstant(value: string, dateOnly: boolean): string | null {
  const v = value.trim();
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(v)) return "bad";
  return dateOnly || v.length === 10 ? `${v.slice(0, 10)}T00:00:00+05:30` : `${v}:00+05:30`;
}

/**
 * When an event is, for the countdown and the calendar button.
 *
 * The form's times are read as India time whatever the organiser's laptop is
 * set to, because the events are on campus and "10:00" means 10:00 in Pune.
 * An all-day event keeps only the dates. Clearing the start clears the lot,
 * which puts every page back to "date to be announced" and takes the calendar
 * button away: that is the right thing to do when a date moves and the new
 * one is not settled yet.
 */
export async function setEventSchedule(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const slug = String(formData.get("slug") ?? "");
  const allDay = formData.get("all_day") === "on";
  const start = istInstant(String(formData.get("starts_at") ?? ""), allDay);
  const end = istInstant(String(formData.get("ends_at") ?? ""), allDay);
  const venue = String(formData.get("venue") ?? "").trim();

  if (!slug) return { error: "Which event? Reload the page and try again." };
  if (start === "bad" || end === "bad") return { error: "Those dates did not read. Use the pickers." };
  if (!start && end) return { error: "Give it a start before an end, or clear both." };

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_set_event_schedule", {
    p_slug: slug,
    p_starts_at: start ?? undefined,
    p_ends_at: end ?? undefined,
    p_all_day: allDay,
    p_venue: venue || undefined,
  });

  revalidatePath("/", "layout");
  return say(
    error,
    start
      ? "Saved. The countdown and the calendar button use it everywhere now."
      : "Cleared. Every page says the date is to be announced.",
  );
}
