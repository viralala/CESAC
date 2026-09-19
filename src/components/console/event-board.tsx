"use client";

import Link from "next/link";
import { useActionState, useId, useState, useTransition } from "react";

import {
  changePartner,
  confirmEventRazorpayPayment,
  createEventRazorpayOrder,
  enterEvent,
  withdrawEntry,
  type EventState,
} from "@/app/actions/events";
import { Chip, Notice, Row } from "@/components/console/shell";
import { rupees } from "@/lib/console/options";
import type { DeptEvent, MyRegistration } from "@/lib/data/dept-events";
import { loadCheckout, openCheckout } from "@/lib/razorpay/checkout";

const STATE: Record<string, { label: string; tone: "lime" | "muted" | "ink" }> = {
  open: { label: "Entries open", tone: "lime" },
  locked: { label: "Locked", tone: "ink" },
  closed: { label: "Entries closed", tone: "muted" },
};

const PAID: Record<string, { label: string; tone: "lime" | "teal" | "muted" | "red" }> = {
  verified: { label: "Paid", tone: "lime" },
  // Nothing the student console does produces this any more. It survives on
  // entries an organiser recorded by hand, so it still needs a label.
  submitted: { label: "Waiting on an organiser", tone: "teal" },
  pending: { label: "Fee outstanding", tone: "muted" },
  rejected: { label: "Payment not accepted", tone: "red" },
};

/**
 * Every event the department runs, and the one decision a student can make
 * about each: whether to enter.
 *
 * What is deliberately not here is the event itself. No rounds, no schedule,
 * no rules, no run of the show. All of that is on the event's own page, which
 * is written for somebody deciding whether to enter; repeating it in a portal
 * beside a PRN makes a second copy that will disagree with the first within a
 * fortnight.
 *
 * Everything is locked at the moment, and nothing in this console can unlock
 * it. The state is a column an organiser sets, and the database refuses an
 * entry to a locked event whatever the page happens to be showing.
 */
export function EventBoard({
  events,
  registrations,
  online,
  meId,
}: {
  events: DeptEvent[];
  registrations: MyRegistration[];
  /** Whether the server holds Razorpay keys. Without them there is no way to pay. */
  online: boolean;
  /**
   * An entry has two sides and they are not the same. The one who signed up
   * owes the fee and sees the box for it; the partner they named sees the
   * entry and their partner's name, and nothing to fill in.
   */
  meId: string;
}) {
  const [state, action, pending] = useActionState<EventState, FormData>(enterEvent, {});

  const entered = new Map(registrations.map((r) => [r.event_slug, r]));

  return (
    <div className="grid gap-5">
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.notice ? <Notice tone="ok">{state.notice}</Notice> : null}

      {events.length === 0 ? (
        <p className="serif-it rounded-[var(--r-md)] border-2 border-dashed border-ink/15 bg-cream/60 px-6 py-7 text-[1.02rem] leading-relaxed text-muted">
          Nothing on the calendar. New events appear here as the committee confirms them.
        </p>
      ) : null}

      {events.map((event) => {
        const shown = STATE[event.state] ?? STATE.locked;
        const mine = entered.get(event.slug) ?? null;

        return (
          <article key={event.slug} className="rounded-[var(--r-md)] bg-cream-2 p-6 sm:p-7">
            <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
              <div className="min-w-0">
                <p className="label-sm text-teal">{event.kicker}</p>
                <h3 className="d-tall mt-1.5 text-[1.6rem] text-ink">{event.name}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {mine ? <Chip tone="teal">You are entered</Chip> : null}
                <Chip tone={shown.tone}>{shown.label}</Chip>
              </div>
            </header>

            <p className="serif-it mt-3 text-[1.02rem] leading-relaxed text-muted">
              {event.one_liner}
            </p>

            <p className="label-sm mt-4 text-muted">
              {event.when_label} {"·"} {event.team_size === 2 ? "Teams of two" : "One seat each"}{" "}
              {"·"} {event.fee_inr > 0 ? `${rupees(event.fee_inr)} entry` : "Free"}
            </p>

            {event.href ? (
              <p className="label mt-4">
                <Link href={event.href} className="text-teal hover:underline">
                  Read about it
                </Link>
              </p>
            ) : null}

            {mine ? (
              <Entered registration={mine} event={event} online={online} meId={meId} />
            ) : event.state === "open" ? (
              <EnterForm event={event} action={action} pending={pending} />
            ) : (
              <p className="serif-it mt-5 border-t border-ink/10 pt-5 text-[0.95rem] leading-relaxed text-muted">
                {event.state === "locked"
                  ? "Entries are not open. When the committee opens them, the form appears here."
                  : "Entries have closed for this one."}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}

/** The one form on this page: enter, and name a partner where one is needed. */
function EnterForm({
  event,
  action,
  pending,
}: {
  event: DeptEvent;
  action: (formData: FormData) => void;
  pending: boolean;
}) {
  const uid = useId();

  return (
    <form action={action} className="mt-5 grid gap-4 border-t border-ink/10 pt-5">
      <input type="hidden" name="slug" value={event.slug} />

      {event.team_size === 2 ? (
        <div>
          <label htmlFor={`${uid}-partner`} className="label block text-ink">
            Your partner
          </label>
          <input
            id={`${uid}-partner`}
            name="partner_email"
            type="email"
            required
            placeholder="partner@vit.edu"
            className="field mt-2.5"
          />
          <p className="serif-it mt-2 text-[0.85rem] leading-relaxed text-muted">
            Their VIT address, and it has to be one that already has an account on this site. The
            whole department is registered, so if it is spelt right it will match.
          </p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="pill pill-lime justify-self-start disabled:cursor-progress disabled:opacity-70"
      >
        {pending ? "Entering" : "Enter"}
      </button>
    </form>
  );
}

/**
 * The state of an entry that exists, and the fee if there is one.
 *
 * The payment box only appears once the entry does, because a fee for
 * something nobody has entered is a number with nothing behind it.
 */
function Entered({
  registration,
  event,
  online,
  meId,
}: {
  registration: MyRegistration;
  event: DeptEvent;
  online: boolean;
  meId: string;
}) {
  const mine = registration.student_id === meId;
  const paid = PAID[registration.payment_status] ?? PAID.pending;

  // Only the one who signed up can record the payment, which the database
  // enforces too. Showing the partner a form that will be refused would be a
  // way of blaming them for somebody else's outstanding fee.
  const owes = mine && event.fee_inr > 0 && registration.payment_status !== "verified";

  // The other one, from wherever you are standing.
  const other = mine ? registration.partner : registration.student;

  // Changing who you entered with is the same decision as entering, so it
  // lives behind the same conditions: your entry, entries still open, and the
  // fee not yet paid. Once it is paid the entry is a seat somebody has been
  // charged for, and an organiser owns it from then on.
  const canChange =
    mine && event.state === "open" && registration.payment_status !== "verified";

  return (
    <div className="mt-5 border-t border-ink/10 pt-5">
      <dl>
        {event.team_size === 2 ? (
          <Row
            k={mine ? "Partner" : "Entered by"}
            v={
              other ? (
                <span className="[overflow-wrap:anywhere]">
                  {other.full_name ?? other.email}
                </span>
              ) : (
                <span className="text-muted">On your own</span>
              )
            }
          />
        ) : null}
        <Row k="Entry fee" v={event.fee_inr > 0 ? rupees(event.fee_inr) : "Free"} />
        {event.fee_inr > 0 ? <Row k="Payment" v={<Chip tone={paid.tone}>{paid.label}</Chip>} /> : null}
        {registration.payment_reference ? (
          <Row k="Reference" v={registration.payment_reference} />
        ) : null}
      </dl>

      {owes ? (
        <PayNow registration={registration} event={event} online={online} />
      ) : !mine && event.fee_inr > 0 && registration.payment_status !== "verified" ? (
        <p className="serif-it mt-6 text-[0.95rem] leading-relaxed text-muted">
          The fee is theirs to pay, and they record it from their own console.
        </p>
      ) : null}

      {canChange ? <ChangeTeam registration={registration} event={event} /> : null}
    </div>
  );
}

/**
 * The fee, and the only way to pay it.
 *
 * There is no reference box and no "I have paid" button any more, because
 * there is nothing for a student to assert. They pay in the Razorpay window,
 * the server checks the signature against a secret the browser never sees,
 * and the entry is confirmed by that. An organiser is not in the loop, which
 * is the point: the old flow left every entry sitting at "waiting on an
 * organiser" until somebody read a bank statement.
 */
function PayNow({
  registration,
  event,
  online,
}: {
  registration: MyRegistration;
  event: DeptEvent;
  online: boolean;
}) {
  const [state, setState] = useState<EventState>({});
  const [busy, start] = useTransition();

  if (!online) {
    return (
      <p className="serif-it mt-6 rounded-[var(--r-md)] bg-white px-5 py-4 text-[0.95rem] leading-relaxed text-muted">
        Paying online is not switched on yet. Your entry is held either way, so hold on to it and
        the button appears here once the committee turns the counter on.
      </p>
    );
  }

  function pay() {
    start(async () => {
      setState({});

      const order = await createEventRazorpayOrder(registration.id);
      if (order.error || !order.orderId || !order.keyId) {
        setState({ error: order.error ?? "Could not open the checkout." });
        return;
      }

      const ready = await loadCheckout();
      if (!ready) {
        setState({ error: "The payment window could not load. Check your connection and try again." });
        return;
      }

      openCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amount: order.amount ?? Math.round(event.fee_inr * 100),
        name: "CESAC",
        description: `Entry for ${event.name}`,
        prefill: {},
        upiFirst: true,
        onPaid: (response) => {
          setState({ notice: "Checking that payment." });
          void confirmEventRazorpayPayment({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          }).then(setState);
        },
        onFailed: (message) => setState({ error: message }),
        onDismissed: () =>
          setState({
            notice: "You closed the payment window, so nothing was charged. Your entry is still held.",
          }),
      });
    });
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={pay}
        disabled={busy}
        className="pill pill-lime justify-self-start disabled:cursor-progress disabled:opacity-70"
      >
        {busy ? "Opening" : `Pay ${rupees(event.fee_inr)}`}
      </button>

      <p className="serif-it mt-3 text-[0.9rem] leading-relaxed text-muted">
        Scan the UPI QR in the window, or use a card. Your entry is confirmed the moment it goes
        through, with nobody to wait on.
      </p>

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
    </div>
  );
}


/**
 * Changing your mind, while that is still free to do.
 *
 * Two different things, kept apart because they cost different amounts. A
 * swap keeps the entry and anything paid against it, so it is the ordinary
 * one and sits first. Giving the entry up releases both people to enter with
 * somebody else and cannot be taken back, so it is folded away behind a
 * summary rather than sitting next to the other button waiting to be hit.
 *
 * Both disappear the moment the fee is verified. The database refuses them
 * then as well, so hiding them here is a courtesy rather than the rule.
 */
function ChangeTeam({
  registration,
  event,
}: {
  registration: MyRegistration;
  event: DeptEvent;
}) {
  const [swap, swapAction, swapping] = useActionState<EventState, FormData>(changePartner, {});
  const [drop, dropAction, dropping] = useActionState<EventState, FormData>(withdrawEntry, {});
  const uid = useId();
  const pairs = event.team_size === 2;

  return (
    <div className="mt-6 border-t border-ink/10 pt-5">
      <p className="label text-ink">{pairs ? "Change your partner" : "Change your entry"}</p>

      {pairs ? (
        <>
          <p className="serif-it mt-2 text-[0.9rem] leading-relaxed text-muted">
            Swapping keeps your entry and anything you have paid. You can do this until the fee
            goes through.
          </p>

          <form action={swapAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input type="hidden" name="registration_id" value={registration.id} />
            <div>
              <label htmlFor={`${uid}-mate`} className="sr-only">
                New partner email
              </label>
              <input
                id={`${uid}-mate`}
                name="partner_email"
                type="email"
                required
                placeholder="their.name@vit.edu"
                className="field"
              />
            </div>
            <button
              type="submit"
              disabled={swapping}
              className="pill pill-ghost self-start disabled:cursor-progress disabled:opacity-70"
            >
              {swapping ? "Changing" : "Change partner"}
            </button>
          </form>

          {swap.error ? (
            <div className="mt-4">
              <Notice tone="error">{swap.error}</Notice>
            </div>
          ) : null}
          {swap.notice ? (
            <div className="mt-4">
              <Notice tone="ok">{swap.notice}</Notice>
            </div>
          ) : null}
        </>
      ) : null}

      <details className="mt-5 [&_summary::-webkit-details-marker]:hidden">
        <summary className="label cursor-pointer text-muted hover:text-ink">
          {pairs ? "Or start again with a new team" : "Or give up this entry"}
        </summary>

        <div className="mt-3 rounded-[var(--r-md)] border-2 border-ink/10 px-5 py-4">
          <p className="serif-it text-[0.9rem] leading-relaxed text-muted">
            This gives up the entry altogether.{" "}
            {pairs
              ? "You and your partner are both free afterwards, and you can enter again with anybody who is not already in."
              : "You can enter again afterwards."}{" "}
            Your place is not held while you are out, so if entries fill up in between you are not
            getting it back.
          </p>

          <form action={dropAction} className="mt-4">
            <input type="hidden" name="registration_id" value={registration.id} />
            <button
              type="submit"
              disabled={dropping}
              className="pill pill-ghost disabled:cursor-progress disabled:opacity-70"
            >
              {dropping ? "Giving up the entry" : "Give up this entry"}
            </button>
          </form>

          {drop.error ? (
            <div className="mt-4">
              <Notice tone="error">{drop.error}</Notice>
            </div>
          ) : null}
        </div>
      </details>
    </div>
  );
}
