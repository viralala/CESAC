"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type TeamState = { error?: string; notice?: string; field?: string };

/**
 * Postgres raises with a message written for the person, not the developer,
 * so most of the time the right thing to show is exactly what came back.
 */
function fail(message: string | undefined, field?: string): TeamState {
  return { error: message?.replace(/^.*?:\s*/, "") || "That did not work. Try again.", field };
}

export async function createTeam(_state: TeamState, formData: FormData): Promise<TeamState> {
  const name = String(formData.get("name") ?? "").trim();
  const partnerName = String(formData.get("partner_name") ?? "").trim();
  const partnerEmail = String(formData.get("partner_email") ?? "").trim();

  if (name.length < 2) return { error: "Give the team a name.", field: "name" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_team", {
    p_name: name,
    p_partner_name: partnerName || undefined,
    p_partner_email: partnerEmail || undefined,
  });

  if (error) return fail(error.message, "name");

  revalidatePath("/dashboard");
  return { notice: "Team created. Send your partner the join code." };
}

export async function joinTeam(_state: TeamState, formData: FormData): Promise<TeamState> {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (code.length < 4) return { error: "Enter the six character join code.", field: "code" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_team", { p_code: code });
  if (error) return fail(error.message, "code");

  revalidatePath("/dashboard");
  return { notice: "You are in." };
}

export async function leaveTeam(): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("leave_team");
  revalidatePath("/dashboard");
}

export async function updateTeamName(_state: TeamState, formData: FormData): Promise<TeamState> {
  const name = String(formData.get("name") ?? "").trim();
  const partnerName = String(formData.get("partner_name") ?? "").trim();
  const partnerEmail = String(formData.get("partner_email") ?? "").trim();
  const teamId = String(formData.get("team_id") ?? "");

  if (name.length < 2) return { error: "Give the team a name.", field: "name" };

  // Row level security is what makes this safe: the captain-edit policy only
  // matches their own team, and only while it is still forming.
  const supabase = await createClient();
  const { error } = await supabase
    .from("teams")
    .update({
      name,
      partner_name: partnerName || null,
      partner_email: partnerEmail ? partnerEmail.toLowerCase() : null,
    })
    .eq("id", teamId);

  if (error) return fail(error.message, "name");

  revalidatePath("/dashboard");
  return { notice: "Saved." };
}

/*
 * The entry fee used to be collected here too, with its own Razorpay
 * checkout, its own offline form and its own row in public.payments. It is
 * not any more. One event cannot have two prices and two places to pay them:
 * the fee lives on the entry, on the events page, and this file is left with
 * the thing it is actually about, which is the team.
 *
 * public.payments and the organiser tools that read it are untouched, so an
 * organiser can still record and verify a payment that arrived some other
 * way. Nothing a student can click writes to it.
 */
