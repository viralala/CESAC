import type { Metadata } from "next";
import Link from "next/link";

import {
  saveDeptEvent,
  setEntryStatus,
  setEventState,
  verifyEntryPayment,
} from "@/app/actions/admin";
import { Container, Label } from "@/components/aot/bits";
import { ActionForm } from "@/components/console/action-form";
import { PendingFields } from "@/components/console/pending-fields";
import { Chip, Empty, Panel, Stat } from "@/components/console/shell";
import { requireAdmin } from "@/lib/auth/guard";
import { requireCap } from "@/lib/auth/caps";
import { getDeptEvents, getEventEntries, type Entry } from "@/lib/data/dept-events";
import { EVENT } from "@/lib/data/event";

export const metadata: Metadata = {
  title: "Entries",
  robots: { index: false, follow: false },
};

/** The move that gets made, per state the event is in. Never all three at once. */
const MOVES = {
  locked: [{ to: "open", label: "Open entries", tone: "lime" }],
  open: [
    { to: "closed", label: "Close entries", tone: "ghost" },
    { to: "locked", label: "Lock again", tone: "ghost" },
  ],
  closed: [
    { to: "open", label: "Re-open entries", tone: "lime" },
    { to: "locked", label: "Lock", tone: "ghost" },
  ],
} as const;

const PAYMENT_TONE = {
  pending: "muted",
  submitted: "teal",
  verified: "lime",
  rejected: "red",
} as const;

function personLine(p: Entry["student"]): string {
  if (!p) return "Account deleted";
  const bits = [p.student_class, p.prn].filter(Boolean);
  return bits.length ? `${p.email} · ${bits.join(" · ")}` : p.email;
}

/**
 * The department events, and who has entered them.
 *
 * Separate from /admin/events on purpose, which is the newer event system in
 * the `ems` schema and has its own teams, its own payments and its own
 * organisers. These are the two events actually on the public site, held in
 * `public.dept_events`, and this is the page that opens and closes them.
 *
 * Every number is counted at request time. Nothing on this page decides
 * anything: each control calls a security definer function that re-checks
 * is_admin() and writes an audit row, so a decision somebody disputes on the
 * day has a record of who made it.
 */
export default async function EntriesPage() {
  await requireAdmin();
  await requireCap("events");
  const [events, entries] = await Promise.all([getDeptEvents(), getEventEntries()]);

  const live = entries.filter((e) => e.status === "registered");
  const awaiting = live.filter((e) => e.payment_status === "submitted");
  const openNow = events.filter((e) => e.state === "open");

  return (
    <>
      <div className="washi grain min-h-[100svh] py-12 sm:py-16">
        <Container>
          <header className="max-w-[52ch]">
            <Label tone="teal">{EVENT.host}</Label>
            <h1 className="d-tall mt-4 text-[clamp(2.4rem,6vw,4rem)] text-ink">Entries</h1>
            <p className="serif-it mt-4 text-[1.1rem] leading-relaxed text-muted">
              The events on the public site, and everybody who has entered one. Opening an event
              here is what lets students enter it: the events page, the entry form and the database
              all read the same column.
            </p>
          </header>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat value={events.length} label="Events" />
            <Stat
              value={openNow.length}
              label="Taking entries"
              note={openNow.length ? openNow.map((e) => e.name).join(", ") : "None open"}
            />
            <Stat value={live.length} label="Entries" note="Not withdrawn" />
            <Stat value={awaiting.length} label="To verify" note="Fees waiting on you" />
          </div>

          <div className="mt-10 grid gap-8">
            {events.map((event) => {
              const mine = entries.filter((e) => e.event_slug === event.slug);
              const in_ = mine.filter((e) => e.status === "registered");
              const heads = in_.reduce((n, e) => n + (e.partner_id ? 2 : 1), 0);
              const paid = in_.filter((e) => e.payment_status === "verified").length;

              return (
                <Panel
                  key={event.slug}
                  eyebrow={event.kicker}
                  title={event.name}
                  aside={
                    <Chip
                      tone={
                        event.state === "open" ? "lime" : event.state === "closed" ? "ink" : "muted"
                      }
                    >
                      {event.state}
                    </Chip>
                  }
                >
                  <dl className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                    <div className="flex justify-between gap-4 border-b border-ink/10 py-2.5">
                      <dt className="label text-muted">When</dt>
                      <dd className="text-[1rem] text-ink">{event.when_label}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-ink/10 py-2.5">
                      <dt className="label text-muted">Entered</dt>
                      <dd className="text-[1rem] text-ink">
                        {event.team_size === 2 ? "In pairs" : "Solo"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-ink/10 py-2.5">
                      <dt className="label text-muted">Entry fee</dt>
                      <dd className="text-[1rem] text-ink">
                        {event.fee_inr > 0 ? `₹${event.fee_inr}` : "Free"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-ink/10 py-2.5">
                      <dt className="label text-muted">In so far</dt>
                      <dd className="text-[1rem] text-ink">
                        {in_.length} {in_.length === 1 ? "entry" : "entries"}
                        {event.team_size === 2 ? `, ${heads} people` : ""}
                        {event.fee_inr > 0 ? `, ${paid} paid up` : ""}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-6 flex flex-wrap items-center gap-2.5">
                    {MOVES[event.state].map((move) => (
                      <ActionForm
                        key={move.to}
                        action={setEventState}
                        submit={move.label}
                        pendingLabel="Saving"
                        tone={move.tone}
                        className="contents"
                        confirm={
                          move.to === "open"
                            ? `Open entries for ${event.name}? Every student on the site can enter from the moment you do.`
                            : undefined
                        }
                      >
                        <input type="hidden" name="slug" value={event.slug} />
                        <input type="hidden" name="state" value={move.to} />
                      </ActionForm>
                    ))}

                    {event.href ? (
                      <Link href={event.href} className="pill pill-ghost mt-4">
                        Event page
                      </Link>
                    ) : null}
                  </div>

                  <div className="mt-8 border-t border-ink/10 pt-7">
                    <p className="label text-ink">
                      {in_.length === 0 ? "Nobody yet" : `${in_.length} in`}
                    </p>

                    {mine.length === 0 ? (
                      <div className="mt-4">
                        <Empty>
                          {event.state === "open"
                            ? "Entries are open and nobody has entered yet. The first one shows up here."
                            : "Nothing here until entries are opened."}
                        </Empty>
                      </div>
                    ) : (
                      <ul className="mt-4 grid gap-3">
                        {mine.map((entry) => {
                          const gone = entry.status === "withdrawn";
                          const owed = event.fee_inr > 0;

                          return (
                            <li
                              key={entry.id}
                              className={`rounded-[var(--r-md)] border-2 border-ink/10 px-5 py-4 ${
                                gone ? "opacity-55" : ""
                              }`}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                                <div className="min-w-0">
                                  <p className="text-[1.05rem] text-ink">
                                    {entry.student?.full_name ?? entry.student?.email ?? "Unknown"}
                                    {entry.partner ? (
                                      <span className="text-muted">
                                        {" "}
                                        with {entry.partner.full_name ?? entry.partner.email}
                                      </span>
                                    ) : null}
                                  </p>
                                  <p className="label-sm mt-1 break-words text-muted">
                                    {personLine(entry.student)}
                                  </p>
                                  {entry.partner ? (
                                    <p className="label-sm mt-0.5 break-words text-muted">
                                      {personLine(entry.partner)}
                                    </p>
                                  ) : null}
                                </div>

                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                  {gone ? <Chip tone="red">withdrawn</Chip> : null}
                                  {owed ? (
                                    <Chip tone={PAYMENT_TONE[entry.payment_status]}>
                                      {entry.payment_status}
                                    </Chip>
                                  ) : (
                                    <Chip tone="muted">free</Chip>
                                  )}
                                </div>
                              </div>

                              {owed && entry.payment_reference ? (
                                <p className="mt-3 text-[0.92rem] leading-relaxed text-muted">
                                  {entry.payment_method === "cash" ? "At the desk" : "UPI"},
                                  reference{" "}
                                  <span className="font-mono text-ink">
                                    {entry.payment_reference}
                                  </span>
                                  {entry.verifier?.full_name ? (
                                    <> · verified by {entry.verifier.full_name}</>
                                  ) : null}
                                </p>
                              ) : null}

                              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                                {owed && !gone && entry.payment_status !== "verified" ? (
                                  <ActionForm
                                    action={verifyEntryPayment}
                                    submit="Verify the fee"
                                    pendingLabel="Verifying"
                                    tone="lime"
                                    className="contents"
                                    confirm={`Confirm ₹${event.fee_inr} arrived for this entry?`}
                                  >
                                    <input
                                      type="hidden"
                                      name="registration_id"
                                      value={entry.id}
                                    />
                                    <input type="hidden" name="verified" value="true" />
                                  </ActionForm>
                                ) : null}

                                {owed && !gone && entry.payment_status === "submitted" ? (
                                  <ActionForm
                                    action={verifyEntryPayment}
                                    submit="Send it back"
                                    pendingLabel="Sending"
                                    tone="ghost"
                                    className="contents"
                                  >
                                    <input
                                      type="hidden"
                                      name="registration_id"
                                      value={entry.id}
                                    />
                                    <input type="hidden" name="verified" value="false" />
                                  </ActionForm>
                                ) : null}

                                <ActionForm
                                  action={setEntryStatus}
                                  submit={gone ? "Put back in" : "Withdraw"}
                                  pendingLabel="Saving"
                                  tone={gone ? "ghost" : "danger"}
                                  className="contents"
                                  confirm={
                                    gone
                                      ? undefined
                                      : "Withdraw this entry? Both of them can enter again afterwards, and the record of what they paid is kept."
                                  }
                                >
                                  <input type="hidden" name="registration_id" value={entry.id} />
                                  <input
                                    type="hidden"
                                    name="status"
                                    value={gone ? "registered" : "withdrawn"}
                                  />
                                </ActionForm>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </Panel>
              );
            })}

            <Panel eyebrow="New" title="Add an event" aside="Starts locked">
              <p className="serif-it -mt-1 mb-6 text-[1.02rem] leading-relaxed text-muted">
                A new event is listed the moment you save it and takes no entries until you open it
                above, so it is safe to fill this in early. Putting in a slug that already exists
                edits that event instead: the slug is its web address and never moves, because
                every entry points at it.
              </p>

              <ActionForm action={saveDeptEvent} submit="Save event" tone="solid">
                <PendingFields>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="ev-slug" className="label block text-ink">
                        Slug
                      </label>
                      <input
                        id="ev-slug"
                        name="slug"
                        required
                        placeholder="attack-on-token"
                        className="field mt-2.5"
                      />
                    </div>
                    <div>
                      <label htmlFor="ev-name" className="label block text-ink">
                        Name
                      </label>
                      <input
                        id="ev-name"
                        name="name"
                        required
                        placeholder="Attack on Token"
                        className="field mt-2.5"
                      />
                    </div>
                    <div>
                      <label htmlFor="ev-kicker" className="label block text-ink">
                        Kicker
                      </label>
                      <input
                        id="ev-kicker"
                        name="kicker"
                        placeholder="Prompt engineering hackathon"
                        className="field mt-2.5"
                      />
                    </div>
                    <div>
                      <label htmlFor="ev-when" className="label block text-ink">
                        Date line
                      </label>
                      <input
                        id="ev-when"
                        name="when_label"
                        placeholder="3 to 4 October 2026 · Venue: TBA"
                        className="field mt-2.5"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="ev-line" className="label block text-ink">
                        The one line
                      </label>
                      <input
                        id="ev-line"
                        name="one_liner"
                        placeholder="What it is, in a sentence a student reads once."
                        className="field mt-2.5"
                      />
                    </div>
                    <div>
                      <label htmlFor="ev-fee" className="label block text-ink">
                        Entry fee, rupees
                      </label>
                      <input
                        id="ev-fee"
                        name="fee_inr"
                        type="number"
                        min={0}
                        defaultValue={0}
                        className="field mt-2.5"
                      />
                    </div>
                    <div>
                      <label htmlFor="ev-size" className="label block text-ink">
                        Entered
                      </label>
                      <select id="ev-size" name="team_size" defaultValue="1" className="field mt-2.5">
                        <option value="1">Solo</option>
                        <option value="2">In pairs</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="ev-pos" className="label block text-ink">
                        Order on the list
                      </label>
                      <input
                        id="ev-pos"
                        name="position"
                        type="number"
                        defaultValue={events.length + 1}
                        className="field mt-2.5"
                      />
                    </div>
                    <div>
                      <label htmlFor="ev-href" className="label block text-ink">
                        Its page, if it has one
                      </label>
                      <input
                        id="ev-href"
                        name="href"
                        placeholder="/events/attack-on-token"
                        className="field mt-2.5"
                      />
                    </div>
                  </div>
                </PendingFields>
              </ActionForm>
            </Panel>
          </div>
        </Container>
      </div>
    </>
  );
}
