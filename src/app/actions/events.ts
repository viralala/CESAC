"use server";

import { revalidatePath } from "next/cache";

import { requireParticipant } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";

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
  return { notice: "You are entered. If there is a fee, an organiser settles it with you." };
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
