"use client";

import { useActionState, useId, useState, useTransition } from "react";

import {
  confirmRazorpayPayment,
  createRazorpayOrder,
  submitPaymentReference,
  type TeamState,
} from "@/app/actions/team";
import { Chip, Notice, Panel, Row } from "@/components/console/shell";
import type { Payment, Settings } from "@/lib/data/console";
import { loadCheckout, openCheckout } from "@/lib/razorpay/checkout";

const STATUS: Record<Payment["status"], { label: string; tone: "muted" | "teal" | "lime" | "red" }> =
  {
    pending: { label: "Not paid", tone: "muted" },
    submitted: { label: "Waiting on an organiser", tone: "teal" },
    verified: { label: "Verified", tone: "lime" },
    rejected: { label: "Sent back", tone: "red" },
  };

/**
 * The entry fee.
 *
 * Two routes in, one way out: whichever way a team pays, the row lands on
 * "submitted" and an organiser is the one who marks it verified. The site
 * never verifies its own payment, which is what was asked for and is also the
 * only claim it can honestly make while the confirmation is a browser
 * callback rather than a Razorpay webhook.
 */
export function PaymentPanel({
  payment,
  settings,
  onlineEnabled,
  viewer,
}: {
  payment: Payment | null;
  settings: Settings;
  onlineEnabled: boolean;
  viewer: { name: string; email: string };
}) {
  const [state, action, pending] = useActionState<TeamState, FormData>(submitPaymentReference, {});
  const [online, setOnline] = useState<TeamState>({});
  const [checkingOut, startCheckout] = useTransition();
  const uid = useId();

  const status = payment?.status ?? "pending";
  const done = status === "verified";
  const fee = payment?.amount_inr ?? settings.entry_fee_inr;

  function payOnline() {
    startCheckout(async () => {
      setOnline({});

      const order = await createRazorpayOrder();
      if (order.error || !order.orderId || !order.keyId) {
        setOnline({ error: order.error ?? "Could not open the checkout." });
        return;
      }

      const ready = await loadCheckout();
      if (!ready) {
        setOnline({ error: "The payment window could not load. Pay by UPI and record it below." });
        return;
      }

      openCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amount: order.amount ?? fee * 100,
        name: "Attack on Token",
        description: "Entry for one team of two",
        prefill: { name: viewer.name, email: viewer.email },
        onPaid: (response) => {
          void confirmRazorpayPayment({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          }).then(setOnline);
        },
        onFailed: (message) => setOnline({ error: message }),
        // Closing the window is not a mistake and not an error. The offline
        // route is right underneath, so the panel says so instead of going quiet.
        onDismissed: () =>
          setOnline({
            notice:
              "You closed the payment window, so nothing was charged. Open it again when you are ready, or pay by UPI below.",
          }),
      });
    });
  }

  return (
    <Panel
      eyebrow="Entry"
      title={`₹${fee} per team`}
      aside={<Chip tone={STATUS[status].tone}>{STATUS[status].label}</Chip>}
    >
      {done ? (
        <>
          <Notice tone="ok">
            Paid and verified. Nothing else is owed. Your seat is held from the moment both of you
            are on the team.
          </Notice>
          <dl className="mt-6">
            <Row k="Method" v={payment?.method ?? "Recorded by an organiser"} />
            {payment?.reference ? (
              <Row
                k="Reference"
                v={<span className="font-mono text-[0.9em]">{payment.reference}</span>}
              />
            ) : null}
          </dl>
        </>
      ) : (
        <>
          {status === "submitted" ? (
            <Notice tone="ok">
              Recorded. An organiser checks it against the account and marks it verified, usually
              within a day. You do not need to pay again.
            </Notice>
          ) : null}

          {status === "rejected" ? (
            <Notice tone="error">
              An organiser could not match that payment.
              {payment?.rejected_reason ? ` They said: ${payment.rejected_reason}` : ""} Check the
              reference and record it again, or find a committee member.
            </Notice>
          ) : null}

          {onlineEnabled ? (
            <div className="mt-6 rounded-[var(--r-md)] border-2 border-ink/10 p-6">
              <p className="label text-ink">Pay online</p>
              <p className="serif-it mt-2 text-[0.98rem] leading-relaxed text-muted">
                Card, UPI or netbanking through Razorpay. The reference is filled in for you, and
                an organiser still confirms it.
              </p>
              {online.error ? (
                <div className="mt-4">
                  <Notice tone="error">{online.error}</Notice>
                </div>
              ) : null}
              {online.notice ? (
                <div className="mt-4">
                  <Notice tone="ok">{online.notice}</Notice>
                </div>
              ) : null}
              <button
                type="button"
                onClick={payOnline}
                disabled={checkingOut}
                className="pill pill-lime mt-5 w-full disabled:cursor-progress disabled:opacity-70"
              >
                {checkingOut ? "Opening the checkout" : `Pay ₹${fee} now`}
              </button>
            </div>
          ) : null}

          <div className="mt-6 rounded-[var(--r-md)] border-2 border-ink/10 p-6">
            <p className="label text-ink">{onlineEnabled ? "Or pay offline" : "How to pay"}</p>
            {settings.upi_id ? (
              <dl className="mt-4">
                <Row
                  k="UPI ID"
                  v={<span className="font-mono text-[0.95em]">{settings.upi_id}</span>}
                />
                {settings.upi_payee_name ? <Row k="Payee" v={settings.upi_payee_name} /> : null}
                <Row k="Amount" v={`₹${fee}`} />
              </dl>
            ) : (
              <p className="serif-it mt-3 text-[0.98rem] leading-relaxed text-muted">
                Organisers have not published a UPI ID yet. Pay at the desk and record the receipt
                number here, or wait for the ID to appear on this panel.
              </p>
            )}

            <form action={action} className="mt-6 grid gap-5">
              <fieldset>
                <legend className="label text-ink">How you paid</legend>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {[
                    { value: "upi", label: "UPI transfer" },
                    { value: "cash", label: "At the desk" },
                  ].map((option, i) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-2.5 rounded-full border-2 border-ink/15 px-4 py-2.5 text-[0.95rem] text-ink has-[:checked]:border-teal has-[:checked]:bg-teal/[0.07]"
                    >
                      <input
                        type="radio"
                        name="method"
                        value={option.value}
                        defaultChecked={i === 0}
                        className="h-4 w-4 accent-[var(--teal)]"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor={`${uid}-ref`} className="label block text-ink">
                  Reference
                </label>
                <input
                  id={`${uid}-ref`}
                  name="reference"
                  type="text"
                  required
                  minLength={4}
                  maxLength={120}
                  placeholder="UPI transaction ID, or the receipt number"
                  aria-invalid={state.field === "reference" || undefined}
                  className={`field mt-2.5 ${state.field === "reference" ? "border-red" : ""}`}
                />
              </div>

              <div>
                <label htmlFor={`${uid}-note`} className="label block text-ink">
                  Note for the organisers
                </label>
                <input
                  id={`${uid}-note`}
                  name="note"
                  type="text"
                  maxLength={200}
                  placeholder="Optional. For instance, paid from a parent's account."
                  className="field mt-2.5"
                />
              </div>

              {state.error ? <Notice tone="error">{state.error}</Notice> : null}

              <button
                type="submit"
                disabled={pending}
                className="pill w-full disabled:cursor-progress disabled:opacity-70"
              >
                {pending ? "Recording" : "Record the payment"}
              </button>
            </form>
          </div>
        </>
      )}
    </Panel>
  );
}
