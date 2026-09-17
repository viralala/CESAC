"use client";

import Link from "next/link";
import { useActionState, useId } from "react";

import { enterEvent, recordEventPayment, type EventState } from "@/app/actions/events";
import { Chip, Notice, Row } from "@/components/console/shell";
import { rupees } from "@/lib/console/options";
import type { DeptEvent, MyRegistration } from "@/lib/data/dept-events";

const STATE: Record<string, { label: string; tone: "lime" | "muted" | "ink" }> = {
  open: { label: "Entries open", tone: "lime" },
  locked: { label: "Locked", tone: "ink" },
  closed: { label: "Entries closed", tone: "muted" },
};

const PAID: Record<string, { label: string; tone: "lime" | "teal" | "muted" | "red" }> = {
  verified: { label: "Paid", tone: "lime" },
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
  upi,
  meId,
}: {
  events: DeptEvent[];
  registrations: MyRegistration[];
  upi: { id: string; payee: string } | null;
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
              <Entered registration={mine} event={event} upi={upi} meId={meId} />
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
  upi,
  meId,
}: {
  registration: MyRegistration;
  event: DeptEvent;
  upi: { id: string; payee: string } | null;
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
        <PaymentForm registration={registration} event={event} upi={upi} />
      ) : !mine && event.fee_inr > 0 && registration.payment_status !== "verified" ? (
        <p className="serif-it mt-6 text-[0.95rem] leading-relaxed text-muted">
          The fee is theirs to pay, and they record it from their own console.
        </p>
      ) : null}
    </div>
  );
}

function PaymentForm({
  registration,
  event,
  upi,
}: {
  registration: MyRegistration;
  event: DeptEvent;
  upi: { id: string; payee: string } | null;
}) {
  const [state, action, pending] = useActionState<EventState, FormData>(recordEventPayment, {});
  const uid = useId();

  return (
    <form action={action} className="mt-6 grid gap-4">
      <input type="hidden" name="registration_id" value={registration.id} />

      {upi ? (
        <p className="serif-it rounded-[var(--r-md)] bg-white px-5 py-4 text-[0.95rem] leading-relaxed text-muted">
          Send {rupees(event.fee_inr)} to{" "}
          <span className="label text-ink [overflow-wrap:anywhere]">{upi.id}</span> ({upi.payee}),
          then put the reference below.
        </p>
      ) : (
        <p className="serif-it rounded-[var(--r-md)] bg-white px-5 py-4 text-[0.95rem] leading-relaxed text-muted">
          Pay at the desk and record the receipt number below. The committee has not put a UPI
          address on the site yet.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-[minmax(0,12rem)_1fr]">
        <div>
          <label htmlFor={`${uid}-method`} className="label block text-ink">
            How
          </label>
          <select id={`${uid}-method`} name="method" defaultValue="upi" className="field mt-2.5">
            <option value="upi">UPI</option>
            <option value="cash">At the desk</option>
          </select>
        </div>

        <div>
          <label htmlFor={`${uid}-reference`} className="label block text-ink">
            Reference
          </label>
          <input
            id={`${uid}-reference`}
            name="reference"
            type="text"
            required
            maxLength={120}
            placeholder="From your payment app, or the receipt"
            className="field mt-2.5"
          />
        </div>
      </div>

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.notice ? <Notice tone="ok">{state.notice}</Notice> : null}

      <button
        type="submit"
        disabled={pending}
        className="pill justify-self-start disabled:cursor-progress disabled:opacity-70"
      >
        {pending ? "Recording" : "I have paid"}
      </button>
    </form>
  );
}
