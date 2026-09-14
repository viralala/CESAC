"use server";

import { createHmac, timingSafeEqual } from "node:crypto";
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

/** What a team records after paying by UPI or at the desk. */
export async function submitPaymentReference(
  _state: TeamState,
  formData: FormData,
): Promise<TeamState> {
  const method = String(formData.get("method") ?? "");
  const reference = String(formData.get("reference") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (method !== "upi" && method !== "cash") {
    return { error: "Pick how the team paid.", field: "method" };
  }
  if (reference.length < 4) {
    return {
      error:
        method === "upi"
          ? "Enter the UPI transaction reference."
          : "Enter the receipt number you were given.",
      field: "reference",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_payment_reference", {
    p_method: method,
    p_reference: reference,
    p_note: note || undefined,
  });

  if (error) return fail(error.message, "reference");

  revalidatePath("/dashboard");
  return { notice: "Recorded. An organiser checks it against the account and marks it verified." };
}

// ---------------------------------------------------------------------------
// Razorpay
// ---------------------------------------------------------------------------

/**
 * Online payment is off unless the server holds both keys. The page reads
 * this to decide whether to offer the button at all, so a half-configured
 * deploy shows the offline route only rather than a checkout that dies.
 */
export async function razorpayConfigured(): Promise<boolean> {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export async function razorpayKeyId(): Promise<string | null> {
  return process.env.RAZORPAY_KEY_ID ?? null;
}

export type OrderResult = { orderId?: string; amount?: number; keyId?: string; error?: string };

/**
 * Opens a Razorpay order for this team's entry fee.
 *
 * The amount comes from the settings row rather than the browser, so the
 * price cannot be edited on the way in.
 */
export async function createRazorpayOrder(): Promise<OrderResult> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return { error: "Online payment is not switched on." };

  const supabase = await createClient();

  const [{ data: teamId }, { data: settings }] = await Promise.all([
    supabase.rpc("my_team_id"),
    supabase.from("settings").select("entry_fee_inr, online_payment").eq("id", 1).single(),
  ]);

  if (!teamId) return { error: "Create or join a team first." };
  if (!settings?.online_payment) return { error: "Online payment is not switched on." };

  const amount = settings.entry_fee_inr * 100; // Razorpay counts in paise.

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    },
    body: JSON.stringify({
      amount,
      currency: "INR",
      receipt: `aot-${teamId}`.slice(0, 40),
      notes: { team_id: teamId },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return { error: "Razorpay refused the order. Pay by UPI and record the reference instead." };
  }

  const order = (await response.json()) as { id?: string };
  if (!order.id) return { error: "Razorpay returned no order." };

  const { error } = await supabase.rpc("start_razorpay_order", { p_order_id: order.id });
  if (error) return { error: error.message };

  return { orderId: order.id, amount, keyId };
}

/**
 * Checks what the browser brings back from Razorpay.
 *
 * The signature is an HMAC of `order_id|payment_id` keyed with the secret,
 * which only the server has, so a forged success cannot pass this. Compared
 * with timingSafeEqual rather than ===, so the comparison leaks nothing about
 * where a wrong signature first differs.
 */
export async function confirmRazorpayPayment(payload: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<TeamState> {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return { error: "Online payment is not switched on." };

  const expected = createHmac("sha256", keySecret)
    .update(`${payload.orderId}|${payload.paymentId}`)
    .digest("hex");

  const given = Buffer.from(payload.signature ?? "", "utf8");
  const mine = Buffer.from(expected, "utf8");
  const ok = given.length === mine.length && timingSafeEqual(given, mine);

  if (!ok) {
    return { error: "That payment could not be verified. Nothing was recorded. Contact an organiser." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_razorpay_payment", {
    p_order_id: payload.orderId,
    p_payment_id: payload.paymentId,
  });

  if (error) return fail(error.message);

  revalidatePath("/dashboard");
  return { notice: "Payment received. An organiser confirms it against the Razorpay dashboard." };
}
