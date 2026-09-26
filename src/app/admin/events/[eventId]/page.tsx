import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  assignOrganiser,
  cancelRegistration,
  removeOrganiser,
  updateEvent,
} from "@/app/actions/ems-admin";
import { Container, Label } from "@/components/aot/bits";
import { ActionForm } from "@/components/console/action-form";
import { EmsEventForm } from "@/components/console/ems-event-form";
import { Chip, Empty, Panel, Stat } from "@/components/console/shell";
import { PendingFields } from "@/components/console/pending-fields";
import { getEvent, getOrganisers, getRegistrations } from "@/lib/data/ems";
import { requireCap } from "@/lib/auth/caps";
import { isEventOrganiser, requireEmsAdmin } from "@/lib/ems/access";
import { formatDateTime, formatINR } from "@/lib/ems/time";
import type { RegistrationStatus } from "@/lib/supabase/ems.types";

export const metadata: Metadata = {
  title: "Entries",
  robots: { index: false, follow: false },
};

const STATUS_TONE: Record<RegistrationStatus, "teal" | "lime" | "muted" | "red"> = {
  pending: "muted",
  payment_pending: "red",
  registered: "lime",
  cancelled: "muted",
};

const STATUS_WORDS: Record<RegistrationStatus, string> = {
  pending: "not finished",
  payment_pending: "awaiting payment",
  registered: "in",
  cancelled: "cancelled",
};

/**
 * One event's entries, for the people running it.
 *
 * Reachable by committee admins, teacher admins and the organisers assigned
 * to this event. What each of them may do differs, and the page shows only
 * what the viewer can actually use:
 *
 *   organiser  the list, and cancelling an entry when somebody drops out
 *   teacher    the list, and nothing else
 *   committee  all of it, plus editing the event and moving organisers
 *
 * The RLS on ems.registration_board already limits the rows to events the
 * viewer runs, so an organiser who guesses another event's id gets an empty
 * table rather than somebody else's entrants.
 */
export default async function EventEntriesPage({ params }: PageProps<"/admin/events/[eventId]">) {
  const { eventId } = await params;
  const { isCommittee, isTeacher } = await requireEmsAdmin();
  await requireCap("events");

  const event = await getEvent(eventId);
  if (!event) notFound();

  const [registrations, organisers, organises] = await Promise.all([
    getRegistrations(eventId),
    getOrganisers(eventId),
    isEventOrganiser(eventId),
  ]);

  const live = registrations.filter((row) => row.status !== "cancelled");
  const paid = live.filter((row) => row.status === "registered");
  const waiting = live.filter((row) => row.status === "payment_pending");
  const people = paid.reduce((sum, row) => sum + row.accepted_members, 0);
  const collected = paid.reduce((sum, row) => sum + row.amount_inr, 0);

  /** A teacher watches. Anyone else on this page runs the event. */
  const canAct = organises && !isTeacher;

  return (
    <>
      <div className="washi grain min-h-[100svh] py-12 sm:py-16">
        <Container>
          <Link href="/admin/events" className="label text-teal hover:underline">
            Back to events
          </Link>

          <header className="mt-5 max-w-[52ch]">
            <Label tone="teal">{event.status}</Label>
            <h1 className="d-tall mt-4 text-[clamp(2.2rem,5.5vw,3.6rem)] text-ink">{event.name}</h1>
            <p className="serif-it mt-4 text-[1.05rem] leading-relaxed text-muted">
              Entries close {formatDateTime(event.registration_end)} and the event runs{" "}
              {formatDateTime(event.event_start)}.
            </p>
          </header>

          <div className="mt-10 grid gap-6 sm:grid-cols-4">
            <Stat value={`${event.seats_taken}/${event.max_teams}`} label="Seats claimed" />
            <Stat value={paid.length} label="Confirmed" />
            <Stat value={waiting.length} label="Awaiting payment" />
            <Stat
              value={event.price_inr === 0 ? "Free" : formatINR(collected)}
              label="Collected"
              note={event.price_inr === 0 ? undefined : `${people} people`}
            />
          </div>

          <div className="mt-10 grid gap-8">
            <Panel
              eyebrow="Entries"
              title="Who is in"
              aside={live.length ? `${live.length} ${live.length === 1 ? "team" : "teams"}` : undefined}
            >
              {registrations.length === 0 ? (
                <Empty>
                  Nobody has entered yet, and teams appear the moment a leader registers.
                </Empty>
              ) : (
                <ul className="grid gap-3">
                  {registrations.map((row) => (
                    <li
                      key={row.registration_id}
                      className="rounded-[var(--r-md)] border-2 border-ink/10 bg-cream/50 px-5 py-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-[1.1rem] text-ink">{row.team_name}</h3>
                            <Chip tone={STATUS_TONE[row.status]}>{STATUS_WORDS[row.status]}</Chip>
                          </div>
                          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">
                            {row.leader_name ?? row.leader_email} leads,{" "}
                            {row.accepted_members}{" "}
                            {row.accepted_members === 1 ? "person" : "people"} accepted
                            {row.leader_prn ? ` · ${row.leader_prn}` : ""}
                          </p>
                          <p className="label-sm mt-1 truncate text-muted">{row.leader_email}</p>
                          {row.razorpay_payment_id ? (
                            /* Left over from the gateway this site used to
                               run. Nothing writes it any more, and the rows
                               that carry one are still worth showing. */
                            <p className="label-sm mt-1 text-muted">
                              Payment {row.razorpay_payment_id}
                              {row.paid_at ? ` · ${formatDateTime(row.paid_at)}` : ""}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <span className="label text-ink">{formatINR(row.amount_inr)}</span>
                          {canAct && row.status !== "cancelled" ? (
                            <ActionForm
                              action={cancelRegistration}
                              submit="Cancel"
                              pendingLabel="Cancelling"
                              tone="danger"
                              confirm={`Cancel ${row.team_name}? The seat goes back into the pool.`}
                            >
                              <input
                                type="hidden"
                                name="registration_id"
                                value={row.registration_id}
                              />
                            </ActionForm>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel eyebrow="Crew" title="Who organises this">
              <p className="serif-it -mt-1 mb-6 text-[1.02rem] leading-relaxed text-muted">
                Organisers listed here manage this event but cannot enter it, and committee admins
                reach every event anyway.
              </p>

              {organisers.length === 0 ? (
                <Empty>
                  Nobody is assigned, though committee admins can still see everything.
                </Empty>
              ) : (
                <ul className="grid gap-3">
                  {organisers.map((person) => (
                    <li
                      key={person.user_id}
                      className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 rounded-[var(--r-md)] bg-cream-2 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <p className="text-[1.02rem] text-ink">
                          {person.full_name ?? person.email}
                        </p>
                        <p className="label-sm mt-1 truncate text-muted">{person.email}</p>
                      </div>
                      {isCommittee ? (
                        <ActionForm
                          action={removeOrganiser}
                          submit="Remove"
                          pendingLabel="Removing"
                          tone="danger"
                        >
                          <input type="hidden" name="event_id" value={event.id} />
                          <input type="hidden" name="user_id" value={person.user_id} />
                        </ActionForm>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}

              {isCommittee ? (
                <div className="mt-7">
                  <h3 className="label text-teal">Assign an organiser</h3>
                  <ActionForm action={assignOrganiser} submit="Assign" pendingLabel="Assigning">
                    <PendingFields>
                      <input type="hidden" name="event_id" value={event.id} />
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="name@vit.edu"
                        className="mt-3 w-full max-w-md rounded-[var(--r-sm)] border-2 border-ink/15 bg-white px-4 py-2.5 text-[1rem] text-ink outline-none transition-colors focus:border-teal disabled:opacity-60"
                      />
                    </PendingFields>
                  </ActionForm>
                </div>
              ) : null}
            </Panel>

            {isCommittee ? (
              <Panel eyebrow="Settings" title="Change this event">
                <p className="serif-it -mt-1 mb-6 text-[1.02rem] leading-relaxed text-muted">
                  Take care changing seats or the fee once entries are open, though lowering seats
                  never removes a team.
                </p>
                <EmsEventForm
                  action={updateEvent}
                  defaults={event}
                  submit="Save changes"
                  showStatus
                />
              </Panel>
            ) : null}
          </div>
        </Container>
      </div>
    </>
  );
}
