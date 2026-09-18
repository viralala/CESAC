"use server";

import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";

import { requireParticipant } from "@/lib/auth/guard";
import { createEmsClient, createEmsServiceClient, readableError } from "@/lib/supabase/ems";

export type TeamState = { error?: string; notice?: string; teamId?: string };

/**
 * The student side of the event management system: form a team, invite
 * people, answer an invitation, register, pay.
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
    : done("Seat held. Pay now to confirm it.");
}

// ---------------------------------------------------------------------------
// Razorpay
// ---------------------------------------------------------------------------

/**
 * Online payment is off unless the server holds both keys, matching how the
 * Attack on Token flow decides. A half-configured deploy should not offer a
 * checkout that dies.
 */
export async function emsRazorpayConfigured(): Promise<boolean> {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export type EmsOrder = {
  orderId?: string;
  amount?: number;
  keyId?: string;
  registrationId?: string;
  error?: string;
};

/**
 * Opens a Razorpay order for a registration that is waiting on payment.
 *
 * The amount comes off the registration row, not the browser, so the price
 * cannot be edited on the way in. The order is recorded through
 * ems.create_payment_record, which refuses a registration that is not this
 * person's and one that is not actually awaiting payment.
 */
export async function createEmsRazorpayOrder(registrationId: string): Promise<EmsOrder> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return { error: "Online payment is not switched on." };

  const supabase = await participantClient();

  const { data: registration, error: readError } = await supabase
    .from("event_registrations")
    .select("id, amount_inr, status")
    .eq("id", registrationId)
    .maybeSingle();

  if (readError) return { error: readableError(readError)! };
  if (!registration) return { error: "That registration is not yours." };
  if (registration.status !== "payment_pending") {
    return { error: "That registration is not waiting on a payment." };
  }

  const amount = Math.round(registration.amount_inr * 100); // Razorpay counts in paise.

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    },
    body: JSON.stringify({
      amount,
      currency: "INR",
      receipt: `ems-${registration.id}`.slice(0, 40),
      notes: { registration_id: registration.id },
    }),
    cache: "no-store",
  });

  if (!response.ok) return { error: "Razorpay refused the order. Try again in a moment." };

  const order = (await response.json()) as { id?: string };
  if (!order.id) return { error: "Razorpay returned no order." };

  const { error } = await supabase.rpc("create_payment_record", {
    p_registration_id: registration.id,
    p_razorpay_order_id: order.id,
  });

  if (error) return { error: readableError(error)! };

  return { orderId: order.id, amount, keyId, registrationId: registration.id };
}

/**
 * Checks what the browser brings back from Razorpay, then records it.
 *
 * The signature is an HMAC of `order_id|payment_id` keyed with the secret,
 * which only the server holds, so a forged success cannot pass. Compared with
 * timingSafeEqual rather than ===, so the comparison leaks nothing about
 * where a wrong signature first differs.
 *
 * Only after that does the service role client come out, because
 * ems.confirm_razorpay_payment refuses anything that is not the service role.
 * A signed-in session cannot mark its own payment paid even if this file is
 * wrong, which is the whole reason that check is in the database.
 */
export async function confirmEmsRazorpayPayment(payload: {
  registrationId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<TeamState> {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return { error: "Online payment is not switched on." };

  await requireParticipant();

  const expected = createHmac("sha256", keySecret)
    .update(`${payload.orderId}|${payload.paymentId}`)
    .digest("hex");

  const given = Buffer.from(payload.signature ?? "", "utf8");
  const mine = Buffer.from(expected, "utf8");
  const ok = given.length === mine.length && timingSafeEqual(given, mine);

  if (!ok) {
    return {
      error: "That payment could not be verified. Nothing was recorded. Contact an organiser.",
    };
  }

  const service = createEmsServiceClient();
  if (!service) {
    return {
      error:
        "The payment went through but the server could not record it. Contact an organiser with your Razorpay payment id.",
    };
  }

  const { error } = await service.rpc("confirm_razorpay_payment", {
    p_registration_id: payload.registrationId,
    p_razorpay_payment_id: payload.paymentId,
    p_razorpay_order_id: payload.orderId,
    p_razorpay_signature: payload.signature,
  });

  if (error) return { error: readableError(error)! };

  return done("Payment received. Your seat is confirmed.");
}
