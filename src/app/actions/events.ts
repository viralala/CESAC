"use server";

import { revalidatePath } from "next/cache";

import { requireParticipant } from "@/lib/auth/guard";
import { openOrder, razorpayKeys, signatureIsValid } from "@/lib/razorpay/order";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type EventState = { error?: string; notice?: string };

/**
 * Everything the database raises for a reason a student can act on carries
 * this code, and its message is already written for them. Anything else is a
 * fault on our side and gets a sentence that does not leak the shape of the
 * schema.
 */
const SPOKEN_FOR_STUDENTS = "P0001";

/**
 * Enter an event.
 *
 * Every rule that matters lives in register_for_event: whether the event is
 * open at all, whether this student has already entered, and whether the
 * partner exists, holds a VIT address and is still free. None of it is
 * repeated here, because a check in a server action is a promise the console
 * makes, and the database is the only thing that cannot be talked out of it.
 */
export async function enterEvent(_state: EventState, formData: FormData): Promise<EventState> {
  await requireParticipant();

  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return { error: "Pick an event." };

  const partnerEmail = String(formData.get("partner_email") ?? "")
    .trim()
    .toLowerCase();

  const supabase = await createClient();
  const { error } = await supabase.rpc("register_for_event", {
    p_slug: slug,
    p_partner_email: partnerEmail || undefined,
  });

  if (error) {
    if (error.code === SPOKEN_FOR_STUDENTS) return { error: error.message };
    console.error("event registration failed", error);
    return { error: "That did not go through. Try again in a minute." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events");
  return { notice: "You are entered. The fee, if there is one, is below." };
}

/**
 * Swap the partner on an entry.
 *
 * Whether this is allowed is decided by change_event_partner, not here. It
 * knows the fee has not been paid, that the event is still open and that the
 * new partner is not already spoken for, and it checks all three under a row
 * lock. Repeating any of it in this file would add a second answer that is
 * sometimes wrong.
 */
export async function changePartner(_state: EventState, formData: FormData): Promise<EventState> {
  await requireParticipant();

  const id = String(formData.get("registration_id") ?? "");
  const email = String(formData.get("partner_email") ?? "").trim().toLowerCase();

  if (!id) return { error: "That entry is not on the page any more. Reload and try again." };
  if (!email) return { error: "Give the new partner's email address." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("change_event_partner", {
    p_registration_id: id,
    p_partner_email: email,
  });

  if (error) {
    if (error.code === SPOKEN_FOR_STUDENTS) return { error: error.message };
    console.error("partner change failed", error);
    return { error: "That did not go through. Try again in a minute." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events");
  return { notice: "Partner changed. They are on the entry now." };
}

/**
 * Give up an entry, so a new one can be made with somebody else.
 *
 * Not a delete. The row stays and register_for_event upserts onto it, which
 * is what lets the student enter again straight away rather than waiting for
 * an organiser to unpick the old one.
 */
export async function withdrawEntry(_state: EventState, formData: FormData): Promise<EventState> {
  await requireParticipant();

  const id = String(formData.get("registration_id") ?? "");
  if (!id) return { error: "That entry is not on the page any more. Reload and try again." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("withdraw_event_entry", { p_registration_id: id });

  if (error) {
    if (error.code === SPOKEN_FOR_STUDENTS) return { error: error.message };
    console.error("entry withdrawal failed", error);
    return { error: "That did not go through. Try again in a minute." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events");
  return { notice: "Entry given up. You and your partner are both free to enter again." };
}

// ---------------------------------------------------------------------------
// Razorpay
// ---------------------------------------------------------------------------

/**
 * Whether the checkout can be offered at all.
 *
 * There is no organiser toggle beside this one, unlike the older team fee.
 * The entry fee is either payable or the event is free, and a switch that
 * hides the only way to pay would just be a way to take entries the site
 * cannot collect on.
 */
export async function eventRazorpayConfigured(): Promise<boolean> {
  return razorpayKeys() !== null;
}

export type EventOrder = {
  orderId?: string;
  amount?: number;
  keyId?: string;
  error?: string;
};

/**
 * Opens a Razorpay order for one entry.
 *
 * The amount is read from the event row here rather than taken from the
 * browser, so the price cannot be edited on the way in. Everything about
 * whose entry it is and whether it is still owed is settled by
 * start_event_razorpay_order, under the student's own session.
 */
export async function createEventRazorpayOrder(registrationId: string): Promise<EventOrder> {
  await requireParticipant();

  const keys = razorpayKeys();
  if (!keys) return { error: "Online payment is not switched on yet. Find a committee member." };
  if (!registrationId) return { error: "That entry is not on the page any more. Reload and try again." };

  const supabase = await createClient();

  const { data: registration, error: readError } = await supabase
    .from("event_registrations")
    .select("id, event_slug, payment_status")
    .eq("id", registrationId)
    .maybeSingle();

  if (readError || !registration) return { error: "That is not your entry." };
  if (registration.payment_status === "verified") return { error: "That entry is already paid up." };

  const { data: event } = await supabase
    .from("dept_events")
    .select("fee_inr, name")
    .eq("slug", registration.event_slug)
    .maybeSingle();

  if (!event || event.fee_inr <= 0) return { error: "There is nothing to pay for this one." };

  const order = await openOrder({
    keys,
    amount: Math.round(event.fee_inr * 100), // Razorpay counts in paise.
    receipt: `evt-${registration.id}`,
    notes: { registration_id: String(registration.id), event_slug: registration.event_slug },
  });

  if ("error" in order) return { error: order.error };

  const { error } = await supabase.rpc("start_event_razorpay_order", {
    p_registration_id: registration.id,
    p_order_id: order.id,
  });

  if (error) {
    if (error.code === SPOKEN_FOR_STUDENTS) return { error: error.message };
    console.error("event order start failed", error);
    return { error: "That did not go through. Try again in a minute." };
  }

  return { orderId: order.id, amount: order.amount, keyId: keys.keyId };
}

/**
 * Checks what the browser brings back, then marks the entry paid.
 *
 * This is the whole of the verification. There is no organiser step after it
 * and there is not meant to be: a valid signature is Razorpay saying the
 * money is theirs to settle, and a person re-typing that into a console adds
 * a delay rather than a check.
 *
 * Which means the order of the two halves below is the security property. The
 * signature is checked first, against a secret the browser has never seen, and
 * only if it holds does the service role client come out. Postgres refuses
 * confirm_event_razorpay_payment to anything else, so even a wrong version of
 * this file cannot mark a fee paid from a student's session.
 */
export async function confirmEventRazorpayPayment(payload: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<EventState> {
  await requireParticipant();

  const keys = razorpayKeys();
  if (!keys) return { error: "Online payment is not switched on." };

  if (!payload.orderId || !payload.paymentId || !payload.signature) {
    return { error: "That payment came back incomplete. Contact an organiser before paying again." };
  }

  if (!signatureIsValid(keys.keySecret, payload)) {
    console.error("event payment signature rejected", { orderId: payload.orderId });
    return {
      error: "That payment could not be verified. Nothing was recorded. Contact an organiser.",
    };
  }

  const service = createServiceClient();
  if (!service) {
    console.error("event payment cannot be recorded: no service role key");
    return {
      error:
        "The payment went through but the server could not record it. Contact an organiser with your Razorpay payment id: " +
        payload.paymentId,
    };
  }

  const { error } = await service.rpc("confirm_event_razorpay_payment", {
    p_order_id: payload.orderId,
    p_payment_id: payload.paymentId,
    p_signature: payload.signature,
  });

  if (error) {
    console.error("event payment confirm failed", error);
    return {
      error:
        "The payment went through but the entry could not be updated. Contact an organiser with your Razorpay payment id: " +
        payload.paymentId,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events");
  return { notice: "Paid. Your entry is confirmed, and nobody needs to check it." };
}
