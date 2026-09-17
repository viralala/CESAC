"use server";

import { revalidatePath } from "next/cache";

import { requireParticipant } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/database.types";

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
 * Say what was paid, and how.
 *
 * Sets the entry to "submitted" and never to "paid": an organiser still has to
 * agree that the money arrived. A console that marks itself paid on the
 * student's word is a console the committee cannot reconcile against a bank
 * statement.
 */
export async function recordEventPayment(
  _state: EventState,
  formData: FormData,
): Promise<EventState> {
  await requireParticipant();

  const id = String(formData.get("registration_id") ?? "");
  const method = String(formData.get("method") ?? "") as Enums<"payment_method">;
  const reference = String(formData.get("reference") ?? "")
    .trim()
    .slice(0, 120);

  if (!id) return { error: "That entry is not on the page any more. Reload and try again." };
  if (method !== "upi" && method !== "cash") {
    return { error: "Say whether you paid by UPI or at the desk." };
  }
  if (!reference) {
    return {
      error:
        method === "upi"
          ? "Put in the UPI reference from your payment app."
          : "Put in the receipt number you were given at the desk.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_event_payment", {
    p_registration_id: id,
    p_method: method,
    p_reference: reference,
  });

  if (error) {
    if (error.code === SPOKEN_FOR_STUDENTS) return { error: error.message };
    console.error("event payment failed", error);
    return { error: "That did not go through. Try again in a minute." };
  }

  revalidatePath("/dashboard/events");
  return { notice: "Recorded. An organiser checks it against the account and marks it verified." };
}
