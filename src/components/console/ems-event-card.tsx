import {
  createTeam,
  inviteMember,
  registerTeam,
  removeMember,
} from "@/app/actions/ems-team";
import { ActionForm } from "@/components/console/action-form";
import { EmsCheckout } from "@/components/console/ems-checkout";
import { PendingFields } from "@/components/console/pending-fields";
import { Chip, Empty } from "@/components/console/shell";
import type { EmsRegistration, EventCard, RosterRow } from "@/lib/data/ems";
import { formatDateTime, formatINR } from "@/lib/ems/time";

const input =
  "w-full rounded-[var(--r-sm)] border-2 border-ink/15 bg-white px-4 py-2.5 text-[1rem] text-ink outline-none transition-colors focus:border-teal disabled:opacity-60";

/**
 * One event, and whatever the student's next move on it is.
 *
 * The card only ever shows one thing to do, because at any moment there is
 * only one: make a team, fill it, register it, pay for it, or nothing at all
 * because you are in. Showing the later steps greyed out ahead of time would
 * just be five disabled buttons.
 */
export function EmsEventCard({
  event,
  roster,
  registration,
  viewer,
  onlineEnabled,
}: {
  event: EventCard;
  roster: RosterRow[];
  registration: EmsRegistration | null;
  viewer: { name: string; email: string };
  /** False when the server holds no Razorpay keys. */
  onlineEnabled: boolean;
}) {
  const solo = event.min_team_size === 1 && event.max_team_size === 1;
  const accepted = roster.filter((person) => person.status === "accepted");
  const invited = roster.filter((person) => person.status === "invited");

  const short = Math.max(event.min_team_size - accepted.length, 0);
  const room = event.max_team_size - (accepted.length + invited.length);

  const isIn = registration?.status === "registered";
  const owes = registration?.status === "payment_pending";

  return (
    <li className="rounded-[var(--r-md)] border-2 border-ink/10 bg-cream/50 p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="d-tall text-[1.35rem] text-ink">{event.name}</h3>
            {isIn ? <Chip tone="lime">you are in</Chip> : null}
            {owes ? <Chip tone="red">seat held, unpaid</Chip> : null}
            {!event.registration_open && !isIn && !owes ? (
              <Chip tone="muted">{event.seats_left === 0 ? "full" : "closed"}</Chip>
            ) : null}
          </div>
          {event.description ? (
            <p className="serif-it mt-2 max-w-[60ch] text-[1rem] leading-relaxed text-muted">
              {event.description}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 text-right">
          <p className="d-tall text-[1.4rem] leading-none text-ink">
            {formatINR(event.price_inr)}
          </p>
          <p className="label-sm mt-1.5 text-muted">
            {solo ? "solo" : `${event.min_team_size} to ${event.max_team_size} people`}
          </p>
        </div>
      </div>

      <dl className="mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        <div className="flex justify-between gap-4 border-b border-ink/10 py-2">
          <dt className="label text-muted">Seats left</dt>
          <dd className="text-[1rem] text-ink">
            {event.seats_left} of {event.max_teams}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-ink/10 py-2">
          <dt className="label text-muted">Entries close</dt>
          <dd className="text-[1rem] text-ink">{formatDateTime(event.registration_end)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-ink/10 py-2 sm:col-span-2">
          <dt className="label text-muted">Runs</dt>
          <dd className="text-[1rem] text-ink">
            {formatDateTime(event.event_start)} to {formatDateTime(event.event_end)}
          </dd>
        </div>
      </dl>

      {/* An organiser reads this page but cannot enter their own event. */}
      {!event.can_participate ? (
        <p className="mt-5 text-[0.95rem] leading-relaxed text-muted">
          You are running this one, so you cannot enter it.
        </p>
      ) : !event.my_team_id ? (
        event.registration_open ? (
          <div className="mt-5">
            <h4 className="label text-teal">{solo ? "Enter" : "Make your team"}</h4>
            <ActionForm
              action={createTeam}
              submit={solo ? "Enter" : "Create team"}
              pendingLabel="Creating"
              tone="lime"
              className="mt-3"
            >
              <PendingFields>
                <input type="hidden" name="event_id" value={event.id} />
                <input
                  name="team_name"
                  required
                  minLength={2}
                  maxLength={60}
                  placeholder={solo ? "A name for your entry" : "Your team name"}
                  className={`${input} max-w-md`}
                />
              </PendingFields>
            </ActionForm>
          </div>
        ) : (
          <p className="mt-5 text-[0.95rem] leading-relaxed text-muted">
            {event.seats_left === 0
              ? "Every seat is taken."
              : "Entries are not open for this one."}
          </p>
        )
      ) : (
        <div className="mt-6 border-t-2 border-ink/10 pt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
            <h4 className="d-tall text-[1.1rem] text-ink">{event.my_team_name}</h4>
            <span className="label-sm text-muted">
              {accepted.length} in{invited.length ? `, ${invited.length} invited` : ""}
            </span>
          </div>

          {roster.length === 0 ? (
            <Empty>Nobody is on this team yet.</Empty>
          ) : (
            <ul className="mt-4 grid gap-2">
              {roster.map((person) => (
                <li
                  key={person.member_id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[var(--r-sm)] bg-cream-2 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-[1rem] text-ink">
                      {person.full_name ?? person.email}
                      {person.is_leader ? <span className="text-muted"> · leader</span> : null}
                    </p>
                    <p className="label-sm mt-0.5 truncate text-muted">{person.email}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Chip
                      tone={
                        person.status === "accepted"
                          ? "lime"
                          : person.status === "invited"
                            ? "muted"
                            : "red"
                      }
                    >
                      {person.status}
                    </Chip>

                    {event.my_is_leader && !person.is_leader && !isIn && !owes ? (
                      <ActionForm
                        action={removeMember}
                        submit="Remove"
                        pendingLabel="Removing"
                        tone="danger"
                      >
                        <input type="hidden" name="member_id" value={person.member_id} />
                      </ActionForm>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {isIn ? (
            <p className="mt-5 text-[0.98rem] leading-relaxed text-ink">
              You are in. Nothing left to do before the day.
            </p>
          ) : owes && registration ? (
            onlineEnabled ? (
              <EmsCheckout
                registrationId={registration.id}
                eventName={event.name}
                amountInr={registration.amount_inr}
                viewer={viewer}
              />
            ) : (
              /* Better to say the counter is shut than to show a button that
                 opens a checkout the server cannot finish. The seat is held
                 either way, so nothing is lost by waiting. */
              <p className="mt-5 text-[0.98rem] leading-relaxed text-muted">
                Your seat is held. Paying online is not switched on yet, so hold on to it and an
                organiser will tell you how to settle the {formatINR(registration.amount_inr)}.
              </p>
            )
          ) : (
            <>
              {event.my_is_leader && room > 0 && event.registration_open ? (
                <div className="mt-5">
                  <h4 className="label text-teal">Invite somebody</h4>
                  <p className="mt-1.5 text-[0.88rem] leading-relaxed text-muted">
                    Their CESAC email. They have to have signed in at least once, and they see the
                    invitation on this page.
                  </p>
                  <ActionForm
                    action={inviteMember}
                    submit="Send invitation"
                    pendingLabel="Sending"
                    className="mt-3"
                  >
                    <PendingFields>
                      <input type="hidden" name="team_id" value={event.my_team_id!} />
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="name@vit.edu"
                        className={`${input} max-w-md`}
                      />
                    </PendingFields>
                  </ActionForm>
                </div>
              ) : null}

              {event.my_is_leader ? (
                <div className="mt-6 border-t border-ink/10 pt-5">
                  {short > 0 ? (
                    <p className="text-[0.98rem] leading-relaxed text-muted">
                      {short} more {short === 1 ? "person has" : "people have"} to accept before you
                      can register.
                    </p>
                  ) : !event.registration_open ? (
                    <p className="text-[0.98rem] leading-relaxed text-muted">
                      {event.seats_left === 0
                        ? "Every seat is taken."
                        : "Entries are not open for this one."}
                    </p>
                  ) : (
                    <ActionForm
                      action={registerTeam}
                      submit={
                        event.price_inr === 0 ? "Register the team" : "Claim a seat"
                      }
                      pendingLabel="Registering"
                      tone="lime"
                    >
                      <input type="hidden" name="team_id" value={event.my_team_id!} />
                    </ActionForm>
                  )}
                </div>
              ) : (
                <p className="mt-5 text-[0.95rem] leading-relaxed text-muted">
                  Your leader registers the team when everybody has accepted.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}
