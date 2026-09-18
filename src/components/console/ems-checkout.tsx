"use client";

import { useState, useTransition } from "react";

import {
  confirmEmsRazorpayPayment,
  createEmsRazorpayOrder,
  type TeamState,
} from "@/app/actions/ems-team";
import { Notice } from "@/components/console/shell";

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
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
  handler: (response: RazorpayResponse) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/** Loaded on demand rather than on every page view, so the console stays light. */
function loadCheckout(): Promise<boolean> {
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

/**
 * The entry fee for one team, paid online.
 *
 * Unlike the Attack on Token panel, there is no offline route here and no
 * organiser sign-off: the order is opened server side against the amount on
 * the registration row, the signature that comes back is verified server side
 * with the Razorpay secret, and only then does a service role call mark the
 * registration paid. A signed-in session cannot make that call at all, which
 * is why the seat becomes confirmed without anybody checking it by hand.
 *
 * The seat is already held before any of this. register_team puts the
 * registration into payment_pending and counts it against the event's
 * capacity, so nobody can take the slot while the checkout is open.
 */
export function EmsCheckout({
  registrationId,
  eventName,
  amountInr,
  viewer,
}: {
  registrationId: string;
  eventName: string;
  amountInr: number;
  viewer: { name: string; email: string };
}) {
  const [state, setState] = useState<TeamState>({});
  const [busy, start] = useTransition();

  function pay() {
    start(async () => {
      setState({});

      const order = await createEmsRazorpayOrder(registrationId);
      if (order.error || !order.orderId || !order.keyId) {
        setState({ error: order.error ?? "Could not open the checkout." });
        return;
      }

      const ready = await loadCheckout();
      if (!ready || !window.Razorpay) {
        setState({ error: "The payment window could not load. Try again, or ask an organiser." });
        return;
      }

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount ?? Math.round(amountInr * 100),
        currency: "INR",
        name: "CESAC",
        description: `Entry for ${eventName}`,
        order_id: order.orderId,
        prefill: { name: viewer.name, email: viewer.email },
        theme: { color: "#12656f" },
        handler: (response) => {
          void confirmEmsRazorpayPayment({
            registrationId,
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          }).then(setState);
        },
      });

      checkout.open();
    });
  }

  return (
    <div className="mt-4">
      <button type="button" onClick={pay} disabled={busy} className="pill disabled:opacity-60">
        {busy ? "Opening" : `Pay ₹${Math.round(amountInr).toLocaleString("en-IN")}`}
      </button>

      {state.error ? (
        <div className="mt-4">
          <Notice tone="error">{state.error}</Notice>
        </div>
      ) : null}
      {state.notice ? (
        <div className="mt-4">
          <Notice tone="ok">{state.notice}</Notice>
        </div>
      ) : null}

      <p className="mt-3 text-[0.85rem] leading-relaxed text-muted">
        Your seat is already held. Paying confirms it.
      </p>
    </div>
  );
}
