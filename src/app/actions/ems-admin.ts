"use server";

import { revalidatePath } from "next/cache";

import { requireCommitteeAdmin, requireEmsAdmin } from "@/lib/ems/access";
import { fromISTInput } from "@/lib/ems/time";
import { createClient } from "@/lib/supabase/server";
import { createEmsClient, readableError } from "@/lib/supabase/ems";
import type { EventStatus } from "@/lib/supabase/ems.types";

export type EmsAdminState = { error?: string; notice?: string; eventId?: string };

/**
 * The admin and organiser side of the event management system.
 *
 * Two grades of admin exist here, which the live console has no way to say.
 * A committee admin runs everything. A teacher admin watches: analytics and
 * oversight, no creating events, no moving organisers around, no changing who
 * is an admin. requireCommitteeAdmin is what separates them in this file, and
 * ems.is_committee_admin() is what separates them in the database.
 *
 * As everywhere else in this codebase, the redirect is the courtesy and the
 * database check is the lock.
 */
async function committeeClient() {
  await requireCommitteeAdmin();
  return createEmsClient();
}

function say(error: { message: string; code?: string } | null, notice: string): EmsAdminState {
  const message = readableError(error);
  if (message) return { error: message };

  revalidatePath("/admin/events");
  revalidatePath("/dashboard/events");
  return { notice };
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/**
 * Reads the event form.
 *
 * Every bound the database enforces is checked here too, not to be the lock
 * but to say which field is wrong. A CHECK constraint violation comes back as
 * "events_capacity_valid", which tells a person nothing.
 */
type EventForm = {
  name: string;
  description: string | null;
  minSize: number;
  maxSize: number;
  maxTeams: number;
  price: number;
  registrationStart: string;
  registrationEnd: string;
  eventStart: string;
  eventEnd: string;
};

function readEventForm(formData: FormData): EventForm | string {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  const minSize = Number(formData.get("min_team_size") ?? 1);
  const maxSize = Number(formData.get("max_team_size") ?? 1);
  const maxTeams = Number(formData.get("max_teams") ?? 0);
  const price = Number(formData.get("price_inr") ?? 0);

  // The form sends wall-clock text with no zone on it. fromISTInput pins it
  // to +05:30 rather than letting new Date() read it in the runtime's zone,
  // which is the browser's on the client and UTC on Vercel. Without that,
  // every deadline saves five and a half hours out.
  const registrationStart = fromISTInput(String(formData.get("registration_start") ?? ""));
  const registrationEnd = fromISTInput(String(formData.get("registration_end") ?? ""));
  const eventStart = fromISTInput(String(formData.get("event_start") ?? ""));
  const eventEnd = fromISTInput(String(formData.get("event_end") ?? ""));

  if (name.length < 2) return "Give the event a name.";

  if (!Number.isInteger(minSize) || !Number.isInteger(maxSize) || minSize < 1 || maxSize > 8) {
    return "Team size has to be a whole number between 1 and 8.";
  }
  if (maxSize < minSize) return "The largest team cannot be smaller than the smallest.";

  // The database allows 3000 solo entries but only 1000 teams, because a
  // solo event is a room full of people and a team event is a room full of
  // tables.
  const solo = minSize === 1 && maxSize === 1;
  const ceiling = solo ? 3000 : 1000;
  if (!Number.isInteger(maxTeams) || maxTeams < 1 || maxTeams > ceiling) {
    return solo
      ? "A solo event takes between 1 and 3000 entries."
      : "A team event takes between 1 and 1000 teams.";
  }

  if (Number.isNaN(price) || price < 0 || price > 5000) {
    return "The entry fee has to be between 0 and 5000 rupees.";
  }

  if (!registrationStart || !registrationEnd || !eventStart || !eventEnd) {
    return "Fill in all four dates.";
  }
  if (registrationEnd <= registrationStart) {
    return "Registration has to close after it opens.";
  }
  if (eventEnd <= eventStart) {
    return "The event has to end after it starts.";
  }

  return {
    name,
    description: description || null,
    minSize,
    maxSize,
    maxTeams,
    price,
    registrationStart,
    registrationEnd,
    eventStart,
    eventEnd,
  };
}

export async function createEvent(
  _state: EmsAdminState,
  formData: FormData,
): Promise<EmsAdminState> {
  const form = readEventForm(formData);
  if (typeof form === "string") return { error: form };

  const supabase = await committeeClient();
  const { data, error } = await supabase.rpc("create_event", {
    p_name: form.name,
    p_description: form.description,
    p_min_team_size: form.minSize,
    p_max_team_size: form.maxSize,
    p_max_teams: form.maxTeams,
    p_price_inr: form.price,
    p_registration_start: form.registrationStart,
    p_registration_end: form.registrationEnd,
    p_event_start: form.eventStart,
    p_event_end: form.eventEnd,
  });

  const result = say(error, "Event created as a draft. Open it when you are ready to take entries.");
  return error ? result : { ...result, eventId: data ?? undefined };
}

export async function updateEvent(
  _state: EmsAdminState,
  formData: FormData,
): Promise<EmsAdminState> {
  const eventId = String(formData.get("event_id") ?? "");
  const status = String(formData.get("status") ?? "draft") as EventStatus;

  const form = readEventForm(formData);
  if (typeof form === "string") return { error: form };

  const supabase = await committeeClient();
  const { error } = await supabase.rpc("update_event", {
    p_event_id: eventId,
    p_name: form.name,
    p_description: form.description,
    p_min_team_size: form.minSize,
    p_max_team_size: form.maxSize,
    p_max_teams: form.maxTeams,
    p_price_inr: form.price,
    p_registration_start: form.registrationStart,
    p_registration_end: form.registrationEnd,
    p_event_start: form.eventStart,
    p_event_end: form.eventEnd,
    p_status: status,
  });

  return say(error, "Saved.");
}

/**
 * The switch organisers actually use on the day. Everything else on the event
 * stays as it is, so opening registration cannot quietly change the fee.
 */
export async function setEventStatus(
  _state: EmsAdminState,
  formData: FormData,
): Promise<EmsAdminState> {
  const eventId = String(formData.get("event_id") ?? "");
  const status = String(formData.get("status") ?? "") as EventStatus;

  const supabase = await committeeClient();

  const { data: event, error: readError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (readError) return { error: readableError(readError)! };
  if (!event) return { error: "That event does not exist." };

  const { error } = await supabase.rpc("update_event", {
    p_event_id: event.id,
    p_name: event.name,
    p_description: event.description,
    p_min_team_size: event.min_team_size,
    p_max_team_size: event.max_team_size,
    p_max_teams: event.max_teams,
    p_price_inr: event.price_inr,
    p_registration_start: event.registration_start,
    p_registration_end: event.registration_end,
    p_event_start: event.event_start,
    p_event_end: event.event_end,
    p_status: status,
  });

  const wording: Record<EventStatus, string> = {
    draft: "Back to a draft. Students cannot see it.",
    open: "Registration open. Students can enter now.",
    closed: "Registration closed. Nobody new can enter.",
    ongoing: "Marked as running.",
    completed: "Marked finished.",
    cancelled: "Cancelled.",
  };

  return say(error, wording[status] ?? "Saved.");
}

// ---------------------------------------------------------------------------
// Admins and organisers
// ---------------------------------------------------------------------------

/**
 * Turns an email into a profile id.
 *
 * The ems functions take a profile id rather than an address, because an
 * address is something a person types and an id is something the database
 * already agreed to. This is the one place the two meet, and it runs on the
 * public client because that is where profiles lives.
 */
async function profileIdFor(email: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  return data?.id ?? null;
}

export async function addCommitteeAdmin(
  _state: EmsAdminState,
  formData: FormData,
): Promise<EmsAdminState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) return { error: "That is not an email address." };

  await requireCommitteeAdmin();
  const userId = await profileIdFor(email);
  if (!userId) return { error: "Nobody has signed in on that address yet." };

  const supabase = await createEmsClient();
  const { error } = await supabase.rpc("add_committee_admin", { p_user_id: userId });

  return say(error, "Added as a committee admin. They run everything now.");
}

export async function addTeacherAdmin(
  _state: EmsAdminState,
  formData: FormData,
): Promise<EmsAdminState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) return { error: "That is not an email address." };

  await requireCommitteeAdmin();
  const userId = await profileIdFor(email);
  if (!userId) return { error: "Nobody has signed in on that address yet." };

  const supabase = await createEmsClient();
  const { error } = await supabase.rpc("add_teacher_admin", { p_user_id: userId });

  return say(error, "Added as a teacher admin. Oversight and analytics, nothing else.");
}

export async function removeAdmin(
  _state: EmsAdminState,
  formData: FormData,
): Promise<EmsAdminState> {
  const userId = String(formData.get("user_id") ?? "");

  const supabase = await committeeClient();
  const { error } = await supabase.rpc("remove_admin", { p_user_id: userId });

  return say(
    error,
    "Removed from the event system. Their organiser role in the main console is unchanged.",
  );
}

export async function assignOrganiser(
  _state: EmsAdminState,
  formData: FormData,
): Promise<EmsAdminState> {
  const eventId = String(formData.get("event_id") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) return { error: "That is not an email address." };

  await requireCommitteeAdmin();
  const userId = await profileIdFor(email);
  if (!userId) return { error: "Nobody has signed in on that address yet." };

  const supabase = await createEmsClient();
  const { error } = await supabase.rpc("assign_event_organiser", {
    p_event_id: eventId,
    p_user_id: userId,
  });

  return say(error, "Assigned. They can see this event's entries, and cannot enter it themselves.");
}

export async function removeOrganiser(
  _state: EmsAdminState,
  formData: FormData,
): Promise<EmsAdminState> {
  const eventId = String(formData.get("event_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");

  const supabase = await committeeClient();
  const { error } = await supabase.rpc("remove_event_organiser", {
    p_event_id: eventId,
    p_user_id: userId,
  });

  return say(error, "Removed from this event.");
}

// ---------------------------------------------------------------------------
// Approved students
// ---------------------------------------------------------------------------

/**
 * The approved roll.
 *
 * This list does not gate sign-in and is not wired into the auth trigger. It
 * could not be: 1871 accounts were imported before it existed and every one
 * of them would be locked out the moment it became a gate. It is the
 * committee's record of who has been admitted, and the console reads it.
 */
export async function addApprovedStudent(
  _state: EmsAdminState,
  formData: FormData,
): Promise<EmsAdminState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) return { error: "That is not an email address." };

  const access = await requireCommitteeAdmin();
  const supabase = await createEmsClient();

  const { error } = await supabase.from("approved_students").upsert(
    {
      email,
      full_name: String(formData.get("full_name") ?? "").trim() || null,
      prn: String(formData.get("prn") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      college: String(formData.get("college") ?? "").trim() || null,
      year: String(formData.get("year") ?? "").trim() || null,
      added_by: access.viewer.id,
    },
    { onConflict: "email" },
  );

  return say(error, "Added to the approved roll.");
}

export async function removeApprovedStudent(
  _state: EmsAdminState,
  formData: FormData,
): Promise<EmsAdminState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  const supabase = await committeeClient();
  const { error } = await supabase.from("approved_students").delete().eq("email", email);

  return say(error, "Removed from the roll. Their account and any entries are untouched.");
}

// ---------------------------------------------------------------------------
// Registrations
// ---------------------------------------------------------------------------

/**
 * Cancels one team's entry, freeing the seat.
 *
 * Open to event organisers as well as admins, which is why it uses
 * requireEmsAdmin rather than the committee guard: on the day, the person at
 * the desk is an organiser and the seat has to come back immediately. The
 * table's own RLS allows exactly that pair and nobody else.
 */
export async function cancelRegistration(
  _state: EmsAdminState,
  formData: FormData,
): Promise<EmsAdminState> {
  const registrationId = String(formData.get("registration_id") ?? "");

  await requireEmsAdmin();
  const supabase = await createEmsClient();

  const { data: registration, error: readError } = await supabase
    .from("event_registrations")
    .select("id, team_id")
    .eq("id", registrationId)
    .maybeSingle();

  if (readError) return { error: readableError(readError)! };
  if (!registration) return { error: "That entry does not exist." };

  const { error } = await supabase
    .from("event_registrations")
    .update({ status: "cancelled" })
    .eq("id", registration.id);

  if (error) return { error: readableError(error)! };

  await supabase.from("teams").update({ status: "cancelled" }).eq("id", registration.team_id);

  return say(null, "Entry cancelled. The seat is back.");
}
