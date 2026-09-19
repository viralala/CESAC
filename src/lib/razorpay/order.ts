import "server-only";

/**
 * The one place an order is opened against Razorpay.
 *
 * Both entry fees come through here, the Attack on Token team fee and the
 * event system registration fee, so the amount floor, the refusal handling
 * and the wording a student ends up reading are written once rather than
 * twice and drifting apart.
 *
 * There is no SDK behind this on purpose. Creating an order is one POST with
 * basic auth, and the node library would add a dependency for that alone.
 */

/**
 * Razorpay counts in paise and refuses anything under one rupee. Checking it
 * here turns a round trip and a flat refusal into a straight answer, and it
 * catches the real cause, which is an entry fee left at zero in the console.
 */
const MIN_PAISE = 100;

const ORDERS_URL = "https://api.razorpay.com/v1/orders";

export type RazorpayKeys = { keyId: string; keySecret: string };

/**
 * Online payment is off unless the server holds both keys. Every caller reads
 * this before offering a button, so a half-configured deploy shows the
 * offline route only rather than a checkout that dies halfway.
 */
export function razorpayKeys(): RazorpayKeys | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return keyId && keySecret ? { keyId, keySecret } : null;
}

export type OrderRequest = {
  keys: RazorpayKeys;
  /** In paise, and worked out on the server. Never sent up from the browser. */
  amount: number;
  receipt: string;
  notes?: Record<string, string>;
};

export type OrderResponse = { id: string; amount: number } | { error: string };

export async function openOrder({
  keys,
  amount,
  receipt,
  notes,
}: OrderRequest): Promise<OrderResponse> {
  if (!Number.isInteger(amount) || amount < MIN_PAISE) {
    console.error("razorpay order refused before sending", { amount, receipt });
    return { error: "The entry fee is not set to an amount that can be charged. Tell an organiser." };
  }

  let response: Response;
  try {
    response = await fetch(ORDERS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${keys.keyId}:${keys.keySecret}`).toString("base64")}`,
      },
      // Razorpay truncates a receipt over 40 characters rather than refusing
      // it, so it is cut here where the caller can see why.
      body: JSON.stringify({ amount, currency: "INR", receipt: receipt.slice(0, 40), notes }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("razorpay order request failed", error);
    return { error: "Could not reach Razorpay. Check your connection and try again." };
  }

  if (!response.ok) {
    // The body carries Razorpay's own description of the refusal, which is
    // the only thing that says whether the keys are wrong or the amount is.
    // It goes to the server log; the student gets a sentence they can act on.
    const detail = await response.text().catch(() => "");
    console.error("razorpay refused the order", { status: response.status, detail, receipt });

    if (response.status === 401 || response.status === 403) {
      return { error: "Online payment is not set up correctly on the server. Tell an organiser." };
    }
    return { error: "Razorpay refused the order. Try again in a moment." };
  }

  const order = (await response.json()) as { id?: string; amount?: number };
  if (!order.id) {
    console.error("razorpay returned no order id", order);
    return { error: "Razorpay returned no order. Try again in a moment." };
  }

  return { id: order.id, amount: order.amount ?? amount };
}
