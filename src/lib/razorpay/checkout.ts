/**
 * The browser half of Razorpay: load the checkout script, open the modal,
 * and turn the three ways it can end into three plain callbacks.
 *
 * Both pay buttons use this, so the script is fetched once per visit however
 * many times a student opens the modal, and the cancelled and failed cases
 * are handled the same way in both places.
 */

export type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayFailure = {
  error?: { code?: string; description?: string; reason?: string; step?: string };
};

type RazorpayDisplayConfig = {
  display: {
    blocks: Record<string, { name: string; instruments: { method: string }[] }>;
    sequence: string[];
    preferences: { show_default_blocks: boolean };
  };
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name?: string; email?: string };
  theme: { color: string };
  modal?: { ondismiss?: () => void };
  config?: RazorpayDisplayConfig;
  handler: (response: RazorpayResponse) => void;
};

/**
 * Put UPI at the top of the window, which is what makes a QR the first thing
 * on screen rather than something found three taps in. Cards and netbanking
 * are still there underneath: show_default_blocks keeps every other method
 * Razorpay offers, this only decides what comes first.
 */
const UPI_FIRST: RazorpayDisplayConfig = {
  display: {
    blocks: { upi: { name: "Pay by UPI", instruments: [{ method: "upi" }] } },
    sequence: ["block.upi"],
    preferences: { show_default_blocks: true },
  },
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: (failure: RazorpayFailure) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/** Loaded on demand rather than on every page view, so the console stays light. */
export function loadCheckout(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export type CheckoutRequest = {
  keyId: string;
  orderId: string;
  /** In paise, as the server worked it out. */
  amount: number;
  name: string;
  description: string;
  prefill: { name?: string; email?: string };
  /** Opens on UPI, so a student can scan straight away. */
  upiFirst?: boolean;
  onPaid: (response: RazorpayResponse) => void;
  /** The card was declined, the UPI request timed out, and so on. */
  onFailed: (message: string) => void;
  /** The student closed the window without paying. Nothing was charged. */
  onDismissed: () => void;
};

/**
 * Razorpay can end a checkout three ways and the last two are easy to miss.
 *
 * A payment that fails leaves the modal open so the student can try another
 * card, so a failure is not the end of anything: a retry that works still
 * calls the success handler afterwards, and that one always gets through
 * because it is the only callback that means money moved.
 *
 * Closing the modal fires the dismiss callback whatever happened before it,
 * including after a decline and after a success. Announcing that would
 * replace the reason a card was refused with "you closed the window", so the
 * dismissal is only reported when nothing else has been.
 */
export function openCheckout(request: CheckoutRequest): void {
  if (!window.Razorpay) {
    request.onFailed("The payment window could not load. Try again, or ask an organiser.");
    return;
  }

  let reported = false;
  const report = (announce: () => void) => {
    reported = true;
    announce();
  };

  const checkout = new window.Razorpay({
    key: request.keyId,
    amount: request.amount,
    currency: "INR",
    name: request.name,
    description: request.description,
    order_id: request.orderId,
    prefill: request.prefill,
    theme: { color: "#12656f" },
    ...(request.upiFirst ? { config: UPI_FIRST } : {}),
    modal: {
      ondismiss: () => {
        if (!reported) request.onDismissed();
      },
    },
    handler: (response) => report(() => request.onPaid(response)),
  });

  checkout.on("payment.failed", (failure) => {
    const reason = failure?.error?.description?.trim();
    report(() =>
      request.onFailed(
        reason
          ? `The payment did not go through. ${reason.replace(/\.?$/, ".")} Nothing was charged.`
          : "The payment did not go through. Nothing was charged. Try again, or pay another way.",
      ),
    );
  });

  checkout.open();
}
