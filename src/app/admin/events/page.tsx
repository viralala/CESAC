import type { Metadata } from "next";
import Link from "next/link";

import {
  addCommitteeAdmin,
  addTeacherAdmin,
  createEvent,
  removeAdmin,
  setEventStatus,
} from "@/app/actions/ems-admin";
import { Container, Label } from "@/components/aot/bits";
import { ActionForm } from "@/components/console/action-form";
import { EmsEventForm } from "@/components/console/ems-event-form";
import { PendingFields } from "@/components/console/pending-fields";
import { Chip, Empty, Notice, Panel, Stat } from "@/components/console/shell";
import { getAdminDirectory, getAuditFeed, getEventBoard } from "@/lib/data/ems";
import { requireCap } from "@/lib/auth/caps";
import { requireEmsAdmin } from "@/lib/ems/access";
import { formatDateTime, formatINR } from "@/lib/ems/time";
import type { EventStatus } from "@/lib/supabase/ems.types";

export const metadata: Metadata = {
  title: "Events",
  robots: { index: false, follow: false },
};

const STATUS_TONE: Record<EventStatus, "teal" | "lime" | "muted" | "red" | "ink"> = {
  draft: "muted",
  open: "lime",
  closed: "ink",
  ongoing: "teal",
  completed: "muted",
  cancelled: "red",
};

/** The one control that gets used on the day, per state the event is in. */
function nextMove(status: EventStatus): { to: EventStatus; label: string } | null {
  if (status === "draft") return { to: "open", label: "Open entries" };
  if (status === "open") return { to: "closed", label: "Close entries" };
  if (status === "closed") return { to: "ongoing", label: "Start the event" };
  if (status === "ongoing") return { to: "completed", label: "Mark finished" };
  return null;
}

/**
 * The event management console.
 *
 * Two grades of admin land here. A committee admin sees every panel. A
 * teacher admin sees the board and the trail and none of the forms, because
 * oversight is the whole of what a teacher account is for. The panels are
 * hidden rather than shown-and-disabled: a control you cannot use is noise,
 * and the database refuses the call either way.
 *
 * Every number on this page is counted at request time, and the seat counts
 * come from ems.event_board rather than a per-viewer query, so a student and
 * an organiser reading the same event see the same number of seats left.
 */
export default async function AdminEventsPage() {
  const access = await requireEmsAdmin();
  await requireCap("events");
  const { isCommittee, schemaReady } = access;

  const [events, admins, audit] = schemaReady
    ? await Promise.all([
        getEventBoard(),
        isCommittee ? getAdminDirectory() : Promise.resolve([]),
        getAuditFeed(12),
      ])
    : [[], [], []];

  const open = events.filter((event) => event.status === "open").length;
  const seated = events.reduce((sum, event) => sum + event.seats_taken, 0);

  return (
    <>
      <div className="washi grain min-h-[100svh] py-12 sm:py-16">
        <Container>
          <header className="max-w-[52ch]">
            <Label tone="teal">CESAC</Label>
            <h1 className="d-tall mt-4 text-[clamp(2.4rem,6vw,4rem)] text-ink">Events</h1>
            <p className="serif-it mt-4 text-[1.1rem] leading-relaxed text-muted">
              Every committee event with its organisers and entries, where teams form, pay and hold
              their seats.
            </p>
          </header>

          {!schemaReady ? (
            <div className="mt-8">
              <Notice tone="error">
                The API cannot reach these tables yet, so in Supabase open{" "}
                <strong className="font-normal">Project Settings, API</strong> and add{" "}
                <code className="rounded bg-ink/10 px-1.5 py-0.5 font-mono text-[0.9em]">ems</code>{" "}
                to <strong className="font-normal">Exposed schemas</strong> before this page can work.
              </Notice>
            </div>
          ) : null}

          {schemaReady && !isCommittee ? (
            <div className="mt-8">
              <Notice tone="ok">
                As a teacher admin you can read everything here, while changes are the
                committee&rsquo;s to make.
              </Notice>
            </div>
          ) : null}

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <Stat value={events.length} label="Events" />
            <Stat value={open} label="Taking entries" />
            <Stat value={seated} label="Seats claimed" note="Registered and awaiting payment" />
          </div>

          <div className="mt-10 grid gap-8">
            <Panel
              eyebrow="Board"
              title="Every event"
              aside={events.length ? `${events.length} in all` : undefined}
            >
              {!schemaReady ? (
                <Empty>
                  Nothing can be read until the schema is exposed, so this is not an empty board.
                </Empty>
              ) : events.length === 0 ? (
                <Empty>
                  No events yet, and the first one appears here as a draft hidden from students.
                </Empty>
              ) : (
                <ul className="grid gap-4">
                  {events.map((event) => {
                    const move = nextMove(event.status);
                    const solo = event.min_team_size === 1 && event.max_team_size === 1;

                    return (
                      <li
                        key={event.id}
                        className="rounded-[var(--r-md)] border-2 border-ink/10 bg-cream/50 p-6"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="d-tall text-[1.35rem] text-ink">{event.name}</h3>
                              <Chip tone={STATUS_TONE[event.status]}>{event.status}</Chip>
                              {event.registration_open ? <Chip tone="lime">open now</Chip> : null}
                            </div>
                            {event.description ? (
                              <p className="serif-it mt-2 max-w-[60ch] text-[1rem] leading-relaxed text-muted">
                                {event.description}
                              </p>
                            ) : null}
                          </div>

                          <Link
                            href={`/admin/events/${event.id}`}
                            className="pill pill-ghost shrink-0"
                          >
                            {isCommittee ? "Edit event" : "Entries"}
                          </Link>
                        </div>

                        <dl className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                          <div className="flex justify-between gap-4 border-b border-ink/10 py-2">
                            <dt className="label text-muted">Seats</dt>
                            <dd className="text-[1rem] text-ink">
                              {event.seats_taken} of {event.max_teams} taken,{" "}
                              <strong className="font-normal text-teal">
                                {event.seats_left} left
                              </strong>
                            </dd>
                          </div>
                          <div className="flex justify-between gap-4 border-b border-ink/10 py-2">
                            <dt className="label text-muted">Team size</dt>
                            <dd className="text-[1rem] text-ink">
                              {solo
                                ? "Solo"
                                : `${event.min_team_size} to ${event.max_team_size} people`}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-4 border-b border-ink/10 py-2">
                            <dt className="label text-muted">Entry fee</dt>
                            <dd className="text-[1rem] text-ink">{formatINR(event.price_inr)}</dd>
                          </div>
                          <div className="flex justify-between gap-4 border-b border-ink/10 py-2">
                            <dt className="label text-muted">Entries close</dt>
                            <dd className="text-[1rem] text-ink">
                              {formatDateTime(event.registration_end)}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-4 border-b border-ink/10 py-2 sm:col-span-2">
                            <dt className="label text-muted">Runs</dt>
                            <dd className="text-[1rem] text-ink">
                              {formatDateTime(event.event_start)} to{" "}
                              {formatDateTime(event.event_end)}
                            </dd>
                          </div>
                        </dl>

                        {isCommittee && move ? (
                          <ActionForm
                            action={setEventStatus}
                            submit={move.label}
                            pendingLabel="Saving"
                            tone={move.to === "open" ? "lime" : "ghost"}
                            className="mt-1"
                          >
                            <input type="hidden" name="event_id" value={event.id} />
                            <input type="hidden" name="status" value={move.to} />
                          </ActionForm>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            {schemaReady && isCommittee ? (
              <Panel
                eyebrow="New"
                title="Create an event"
                aside="Starts as a draft"
              >
                <p className="serif-it -mt-1 mb-6 text-[1.02rem] leading-relaxed text-muted">
                  Nothing is visible to students until you open entries, so it is safe to fill this
                  in early and come back to it.
                </p>
                <EmsEventForm action={createEvent} submit="Create event" />
              </Panel>
            ) : null}

            {schemaReady && isCommittee ? (
              <Panel eyebrow="People" title="Who runs the system">
                <p className="serif-it -mt-1 mb-6 text-[1.02rem] leading-relaxed text-muted">
                  Committee admins run everything, teacher admins only read, and main console
                  organisers count as committee admins automatically.
                </p>

                {admins.length === 0 ? (
                  <Empty>
                    Nobody is added yet, and existing organisers already have full access.
                  </Empty>
                ) : (
                  <ul className="grid gap-3">
                    {admins.map((admin) => (
                      <li
                        key={admin.user_id}
                        className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 rounded-[var(--r-md)] bg-cream-2 px-5 py-4"
                      >
                        <div className="min-w-0">
                          <p className="text-[1.02rem] text-ink">
                            {admin.full_name ?? admin.email}
                          </p>
                          <p className="label-sm mt-1 truncate text-muted">{admin.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Chip tone={admin.admin_type === "committee" ? "teal" : "muted"}>
                            {admin.admin_type}
                          </Chip>
                          <ActionForm
                            action={removeAdmin}
                            submit="Remove"
                            pendingLabel="Removing"
                            tone="danger"
                            confirm={`Remove ${admin.full_name ?? admin.email} from the event system?`}
                          >
                            <input type="hidden" name="user_id" value={admin.user_id} />
                          </ActionForm>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-8 grid gap-8 sm:grid-cols-2">
                  <div>
                    <h3 className="label text-teal">Add a committee admin</h3>
                    <ActionForm action={addCommitteeAdmin} submit="Add" pendingLabel="Adding">
                      <PendingFields>
                        <input
                          type="email"
                          name="email"
                          required
                          placeholder="name@vit.edu"
                          className="mt-3 w-full rounded-[var(--r-sm)] border-2 border-ink/15 bg-white px-4 py-2.5 text-[1rem] text-ink outline-none transition-colors focus:border-teal disabled:opacity-60"
                        />
                      </PendingFields>
                    </ActionForm>
                  </div>

                  <div>
                    <h3 className="label text-teal">Add a teacher admin</h3>
                    <ActionForm action={addTeacherAdmin} submit="Add" pendingLabel="Adding">
                      <PendingFields>
                        <input
                          type="email"
                          name="email"
                          required
                          placeholder="faculty@vit.edu"
                          className="mt-3 w-full rounded-[var(--r-sm)] border-2 border-ink/15 bg-white px-4 py-2.5 text-[1rem] text-ink outline-none transition-colors focus:border-teal disabled:opacity-60"
                        />
                      </PendingFields>
                    </ActionForm>
                  </div>
                </div>

                <p className="mt-6 text-[0.88rem] leading-relaxed text-muted">
                  Both need an account already: somebody has to have signed in on the address at
                  least once before it can be given powers.
                </p>
              </Panel>
            ) : null}

            <Panel eyebrow="Trail" title="What has happened" aside="Newest first">
              {audit.length === 0 ? (
                <Empty>Nothing has happened in the event system yet.</Empty>
              ) : (
                <ul className="grid gap-2.5">
                  {audit.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 border-b border-ink/10 py-3 last:border-0"
                    >
                      <span className="text-[1rem] text-ink">
                        {entry.action.replace(/_/g, " ")}
                        {entry.actor_name ? (
                          <span className="text-muted"> by {entry.actor_name}</span>
                        ) : null}
                      </span>
                      <span className="label-sm text-muted">{formatDateTime(entry.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </Container>
      </div>
    </>
  );
}
