"use server";

import { revalidatePath } from "next/cache";

import { requireParticipant } from "@/lib/auth/guard";
import { createEmsClient, readableError } from "@/lib/supabase/ems";

export type TeamState = { error?: string; notice?: string; teamId?: string };

/**
 * The student side of the event management system: form a team, invite
 * people, answer an invitation, register.
 *
 * Every one of these is a thin wrapper over a database function, and that is
 * the point. The rules that matter (registration is open, the team is big
 * enough, the event has a seat left, only the leader may register) are
 * checked inside the function under a row lock, where two people clicking at
 * once cannot both win. Repeating any of them here would add a second answer
 * that is sometimes wrong.
 *
 * requireParticipant runs first on each so an organiser gets a clean redirect
 * instead of an error, but it is not the lock. The lock is in the database.
 */
async function participantClient() {
  await requireParticipant();
  return createEmsClient();
}

function fail(error: { message: string; code?: string } | null): TeamState | null {
  const message = readableError(error);
  return message ? { error: message } : null;
}

function done(notice: string, extra: Partial<TeamState> = {}): TeamState {
  revalidatePath("/dashboard/events");
  revalidatePath("/dashboard");
  return { notice, ...extra };
}

export async function createTeam(_state: TeamState, formData: FormData): Promise<TeamState> {
  const eventId = String(formData.get("event_id") ?? "");
  const name = String(formData.get("team_name") ?? "").trim();

  if (!eventId) return { error: "Pick an event first." };
  if (name.length < 2) return { error: "Give the team a name of at least two characters." };

  const supabase = await participantClient();
  const { data, error } = await supabase.rpc("create_team", {
    p_event_id: eventId,
    p_team_name: name,
  });

  return (
    fail(error) ??
    done("Team created. Invite the rest of your people by their CESAC email.", {
      teamId: data ?? undefined,
    })
  );
}

export async function inviteMember(_state: TeamState, formData: FormData): Promise<TeamState> {
  const teamId = String(formData.get("team_id") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email.includes("@")) return { error: "That is not an email address." };

  const supabase = await participantClient();
  const { error } = await supabase.rpc("invite_team_member", {
    p_team_id: teamId,
    p_email: email,
  });

  return fail(error) ?? done("Invitation sent. They see it on their own events page.");
}

export async function acceptInvitation(_state: TeamState, formData: FormData): Promise<TeamState> {
  const memberId = String(formData.get("member_id") ?? "");

  const supabase = await participantClient();
  const { error } = await supabase.rpc("accept_team_invitation", { p_team_member_id: memberId });

  return fail(error) ?? done("You are on the team.");
}

export async function rejectInvitation(_state: TeamState, formData: FormData): Promise<TeamState> {
  const memberId = String(formData.get("member_id") ?? "");

  const supabase = await participantClient();
  const { error } = await supabase.rpc("reject_team_invitation", { p_team_member_id: memberId });

  return fail(error) ?? done("Invitation turned down.");
}

export async function removeMember(_state: TeamState, formData: FormData): Promise<TeamState> {
  const memberId = String(formData.get("member_id") ?? "");

  const supabase = await participantClient();
  const { error } = await supabase.rpc("remove_team_member", { p_team_member_id: memberId });

  return fail(error) ?? done("Removed from the team.");
}

/**
 * The real registration.
 *
 * A free event comes back registered. A paid one comes back waiting on
 * payment and holding a seat, which is why the seat count in the database
 * counts payment_pending as taken: the alternative is selling the same last
 * slot to everyone who reaches the checkout.
 */
export async function registerTeam(_state: TeamState, formData: FormData): Promise<TeamState> {
  const teamId = String(formData.get("team_id") ?? "");

  const supabase = await participantClient();
  const { data: registrationId, error } = await supabase.rpc("register_team", {
    p_team_id: teamId,
  });

  const failed = fail(error);
  if (failed) return failed;

  const { data: registration } = await supabase
    .from("event_registrations")
    .select("status")
    .eq("id", registrationId!)
    .maybeSingle();

  return registration?.status === "registered"
    ? done("You are in. Nothing left to pay.")
    : done("Seat held. An organiser will tell you how to settle the fee.");
}
