import type { Metadata } from "next";

import { acceptInvitation, emsRazorpayConfigured, rejectInvitation } from "@/app/actions/ems-team";
import { ActionForm } from "@/components/console/action-form";
import { EmsEventCard } from "@/components/console/ems-event-card";
import { Empty, Panel } from "@/components/console/shell";
import { requireParticipant } from "@/lib/auth/guard";
import {
  getEventBoard,
  getMyInvitations,
  getRegistrationsForTeams,
  getTeamRoster,
} from "@/lib/data/ems";
import { formatDateTime, formatINR } from "@/lib/ems/time";
import { emsSchemaReady } from "@/lib/supabase/ems";

export const metadata: Metadata = {
  title: "Competitions",
  robots: { index: false, follow: false },
};

/**
 * The team events.
 *
 * Separate from /dashboard/events, which is the department calendar: a solo
 * or pair entry against a listed event, paid by UPI, signed off by an
 * organiser. This page is the other kind of thing, where a team of up to
 * eight forms first, people accept, and the seat is claimed and paid for in
 * one move. Keeping them apart means neither flow has to grow a branch for
 * the other.
 *
 * Only events the student can actually act on are listed. A draft is
 * invisible, and one that has been and gone is not a decision.
 */
export default async function CompetitionsPage() {
  const viewer = await requireParticipant();

  // An unexposed schema and a term with no events look identical from here,
  // so ask once and say which it is. A student cannot fix it, but being told
  // the site is not ready beats being told there is nothing on.
  const ready = await emsSchemaReady();

  const [events, invitations] = ready
    ? await Promise.all([getEventBoard(), getMyInvitations()])
    : [[], []];

  const shown = events.filter(
    (event) => event.status !== "completed" && event.status !== "cancelled",
  );

  const teamIds = shown
    .map((event) => event.my_team_id)
    .filter((id): id is string => Boolean(id));

  const [registrations, rosters, onlineEnabled] = await Promise.all([
    getRegistrationsForTeams(teamIds),
    Promise.all(teamIds.map((id) => getTeamRoster(id))),
    emsRazorpayConfigured(),
  ]);

  const rosterFor = new Map(teamIds.map((id, index) => [id, rosters[index]]));
  const registrationFor = new Map(registrations.map((row) => [row.team_id, row]));

  const open = shown.filter((event) => event.registration_open).length;

  return (
    <div className="grid gap-8">
      {invitations.length > 0 ? (
        <Panel
          eyebrow="Waiting on you"
          title={invitations.length === 1 ? "An invitation" : "Invitations"}
          aside={`${invitations.length}`}
        >
          <ul className="grid gap-3">
            {invitations.map((invitation) => (
              <li
                key={invitation.member_id}
                className="rounded-[var(--r-md)] border-2 border-teal/25 bg-teal/[0.04] px-5 py-4"
              >
                <p className="text-[1.05rem] text-ink">
                  {invitation.leader_name ?? invitation.leader_email} wants you on{" "}
                  <strong className="font-normal text-teal">{invitation.team_name}</strong>
                </p>
                <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">
                  {invitation.event_name} · {formatINR(invitation.price_inr)} · entries close{" "}
                  {formatDateTime(invitation.registration_end)}
                </p>

                <div className="mt-4 flex flex-wrap items-start gap-4">
                  <ActionForm
                    action={acceptInvitation}
                    submit="Accept"
                    pendingLabel="Joining"
                    tone="lime"
                  >
                    <input type="hidden" name="member_id" value={invitation.member_id} />
                  </ActionForm>

                  <ActionForm
                    action={rejectInvitation}
                    submit="Turn it down"
                    pendingLabel="Declining"
                    tone="ghost"
                  >
                    <input type="hidden" name="member_id" value={invitation.member_id} />
                  </ActionForm>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-[0.88rem] leading-relaxed text-muted">
            You can only be on one team per event, so accepting one closes the others for that
            event.
          </p>
        </Panel>
      ) : null}

      <Panel
        eyebrow="Compete"
        title="Competitions"
        aside={open ? `${open} taking entries` : "Nothing taking entries"}
      >
        <p className="serif-it -mt-1 mb-6 text-[1.02rem] leading-relaxed text-muted">
          Team events. You make a team, invite your people by their CESAC email, and register once
          enough of them have accepted. A seat is held from the moment you claim it, so nobody can
          take it while you are paying.
        </p>

        {!ready ? (
          <Empty>
            Competitions are not switched on yet. This is a setup step on the committee&rsquo;s
            side, not something you have missed. Try again later, or ask on the Questions tab.
          </Empty>
        ) : shown.length === 0 ? (
          <Empty>
            Nothing is running. Team events appear here the moment the committee opens entries, and
            the department calendar is on the Events tab.
          </Empty>
        ) : (
          <ul className="grid gap-5">
            {shown.map((event) => (
              <EmsEventCard
                key={event.id}
                event={event}
                roster={event.my_team_id ? (rosterFor.get(event.my_team_id) ?? []) : []}
                registration={
                  event.my_team_id ? (registrationFor.get(event.my_team_id) ?? null) : null
                }
                viewer={{ name: viewer.name, email: viewer.email }}
                onlineEnabled={onlineEnabled}
              />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
