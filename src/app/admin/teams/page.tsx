import type { Metadata } from "next";
import Link from "next/link";

import { markPaidOffline, restoreTeam, verifyPayment } from "@/app/actions/admin";
import { Container, Label } from "@/components/aot/bits";
import { ActionForm } from "@/components/console/action-form";
import { Chip, Empty, Panel, Row } from "@/components/console/shell";
import { requireAdmin } from "@/lib/auth/guard";
import { requireCap } from "@/lib/auth/caps";
import { getAdminOverview, getSettings, type TeamWithPeople } from "@/lib/data/console";
import { getEventEntries, type Entry } from "@/lib/data/dept-events";

export const metadata: Metadata = {
  title: "Teams",
  robots: { index: false, follow: false },
};

/**
 * Who is in, and the money.
 *
 * Two different things share this page because an organiser thinks of both as
 * "teams" and should not have to know which table a name came out of.
 *
 * The pairs at the top are entries: somebody registered on the events page and
 * named a partner, and the fee is theirs. That is where every real entry lives
 * and it is what an organiser wants at a desk, flat and scannable, rather than
 * nested under an event the way /admin/entries shows it.
 *
 * The teams below are the hand-in teams, made with a join code for the day
 * itself. They are a different arrangement with a different table and they no
 * longer collect any money, so a team can be empty here while its people are
 * perfectly well entered above.
 */
export default async function AdminTeamsPage() {
  await requireAdmin();
  await requireCap("events");
  const [{ teams, counts }, settings, entries] = await Promise.all([
    getAdminOverview(),
    getSettings(),
    getEventEntries(),
  ]);

  const waiting = teams.filter((team) => team.payment?.status === "submitted");
  const rest = teams.filter((team) => team.payment?.status !== "submitted");

  // Unpaid first: that is the only thing on this page anybody has to chase.
  const live = entries
    .filter((entry) => entry.status === "registered")
    .sort((a, b) => {
      const rank = (e: Entry) => (e.payment_status === "verified" ? 1 : 0);
      return rank(a) - rank(b) || a.event_slug.localeCompare(b.event_slug);
    });

  const paidUp = live.filter((entry) => entry.payment_status === "verified").length;
  const heads = live.reduce((n, entry) => n + (entry.partner_id ? 2 : 1), 0);

  return (
    <>
      <div className="washi grain min-h-[100svh] py-12 sm:py-16">
        <Container>
          <header className="max-w-[46ch]">
            <Label tone="teal">Registration</Label>
            <h1 className="d-tall mt-4 text-[clamp(2.6rem,7vw,4.5rem)] text-ink">Teams</h1>
            <p className="serif-it mt-4 text-[1.1rem] leading-relaxed text-muted">
              {live.length} {live.length === 1 ? "pair is" : "pairs are"} entered, {heads} people
              in all, {paidUp} paid up. Hand-in teams are counted separately below:{" "}
              {counts.registered} registered of {counts.teams} made, {counts.seated} seats held
              against a cap of {settings.seats_cap}.
            </p>
          </header>

          <section className="mt-10">
            <h2 className="d-tall text-[1.9rem] text-ink">Entered pairs</h2>
            <p className="serif-it mt-2 text-[1rem] leading-relaxed text-muted">
              Everybody who has entered an event and what they owe. Opening and closing events,
              and verifying a fee that came in by hand, are on{" "}
              <Link href="/admin/entries" className="text-teal hover:underline">
                Entries
              </Link>
              .
            </p>

            {live.length === 0 ? (
              <div className="mt-5">
                <Empty>
                  Nobody has entered anything yet. The first pair appears here the moment somebody
                  enters on the events page.
                </Empty>
              </div>
            ) : (
              <ul className="mt-5 grid gap-3">
                {live.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} />
                ))}
              </ul>
            )}
          </section>

          <section className="mt-12">
            <h2 className="d-tall text-[1.9rem] text-ink">Waiting on a check</h2>
            {waiting.length === 0 ? (
              <div className="mt-5">
                <Empty>
                  Nothing to verify. A team appears here when it records a payment, and stays
                  until an organiser confirms it against the account.
                </Empty>
              </div>
            ) : (
              <div className="mt-5 grid gap-5">
                {waiting.map((team) => (
                  <TeamCard key={team.id} team={team} highlight />
                ))}
              </div>
            )}
          </section>

          <section className="mt-12">
            <h2 className="d-tall text-[1.9rem] text-ink">Hand-in teams</h2>
            {rest.length === 0 ? (
              <div className="mt-5">
                <Empty>
                  No hand-in team has been made yet. These are separate from the entries above:
                  a pair can be entered and paid up without having made one.
                </Empty>
              </div>
            ) : (
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {rest.map((team) => (
                  <TeamCard key={team.id} team={team} />
                ))}
              </div>
            )}
          </section>
        </Container>
      </div>
    </>
  );
}

function TeamCard({ team, highlight = false }: { team: TeamWithPeople; highlight?: boolean }) {
  const payment = team.payment;
  const paid = payment?.status === "verified";

  return (
    <Panel
      eyebrow={team.seat ? `Seat ${team.seat}` : "No seat yet"}
      title={team.name}
      aside={
        <span className="flex flex-wrap items-center gap-2">
          <Chip tone={team.status === "registered" ? "lime" : team.status === "forming" ? "teal" : "red"}>
            {team.status}
          </Chip>
          {team.eliminated_at_chapter ? <Chip tone="red">out at {team.eliminated_at_chapter}</Chip> : null}
        </span>
      }
      className={highlight ? "ring-2 ring-red/25" : ""}
    >
      <dl>
        <Row k="Captain" v={team.captain?.full_name ?? team.captain?.email ?? "Unknown"} />
        <Row
          k="Partner"
          v={
            team.partner
              ? (team.partner.full_name ?? team.partner.email)
              : team.partner_name
                ? `${team.partner_name}, not joined`
                : "Nobody yet"
          }
        />
        <Row k="Contact" v={team.captain?.email ?? "Unknown"} />
        <Row
          k="Join code"
          v={<span className="font-mono text-[0.9em] uppercase">{team.invite_code}</span>}
        />
        <Row
          k="Payment"
          v={
            payment ? (
              <span className="flex flex-wrap items-center justify-end gap-2">
                <Chip
                  tone={
                    payment.status === "verified"
                      ? "lime"
                      : payment.status === "submitted"
                        ? "teal"
                        : payment.status === "rejected"
                          ? "red"
                          : "muted"
                  }
                >
                  {payment.status}
                </Chip>
                {payment.method ? <span className="label-sm text-muted">{payment.method}</span> : null}
              </span>
            ) : (
              "No record"
            )
          }
        />
        {payment?.reference ? (
          <Row
            k="Reference"
            v={<span className="font-mono text-[0.85em] break-all">{payment.reference}</span>}
          />
        ) : null}
        {payment?.note ? <Row k="Their note" v={payment.note} /> : null}
      </dl>

      {!paid ? (
        <div className="mt-6 grid gap-4 border-t border-ink/10 pt-6">
          {payment?.status === "submitted" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <ActionForm action={verifyPayment} submit="Verify this payment" tone="lime">
                <input type="hidden" name="team_id" value={team.id} />
                <input type="hidden" name="verified" value="true" />
                <p className="serif-it text-[0.9rem] leading-relaxed text-muted">
                  Check the reference against the account first. Verifying registers the team if
                  it already has two people.
                </p>
              </ActionForm>

              <ActionForm action={verifyPayment} submit="Send it back" tone="danger">
                <input type="hidden" name="team_id" value={team.id} />
                <input type="hidden" name="verified" value="false" />
                <label htmlFor={`reason-${team.id}`} className="label block text-ink">
                  Why
                </label>
                <input
                  id={`reason-${team.id}`}
                  name="reason"
                  type="text"
                  maxLength={200}
                  placeholder="No matching transfer found"
                  className="field mt-2.5"
                />
              </ActionForm>
            </div>
          ) : (
            <ActionForm action={markPaidOffline} submit="Mark as paid" tone="solid">
              <input type="hidden" name="team_id" value={team.id} />
              <p className="label text-ink">Record a payment yourself</p>
              <p className="serif-it mt-2 text-[0.9rem] leading-relaxed text-muted">
                For a team that paid at the desk and never recorded it.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`method-${team.id}`} className="label block text-ink">
                    Method
                  </label>
                  <select
                    id={`method-${team.id}`}
                    name="method"
                    defaultValue="cash"
                    className="field mt-2.5"
                  >
                    <option value="cash">At the desk</option>
                    <option value="upi">UPI</option>
                    <option value="waived">Waived</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={`ref-${team.id}`} className="label block text-ink">
                    Reference
                  </label>
                  <input
                    id={`ref-${team.id}`}
                    name="reference"
                    type="text"
                    maxLength={120}
                    placeholder="Optional"
                    className="field mt-2.5"
                  />
                </div>
              </div>
            </ActionForm>
          )}
        </div>
      ) : null}

      {team.eliminated_at ? (
        <div className="mt-6 border-t border-ink/10 pt-6">
          <ActionForm action={restoreTeam} submit="Put this team back in" tone="ghost">
            <input type="hidden" name="team_id" value={team.id} />
          </ActionForm>
        </div>
      ) : null}
    </Panel>
  );
}


const ENTRY_TONE = {
  pending: "muted",
  submitted: "teal",
  verified: "lime",
  rejected: "red",
} as const;

/** A person as an organiser needs them: name to say, address to write to, PRN to find on a list. */
function who(p: Entry["student"]): string {
  if (!p) return "Account deleted";
  const tail = [p.student_class, p.prn].filter(Boolean).join(" · ");
  const name = p.full_name ?? p.email;
  return tail ? `${name} · ${tail}` : name;
}

/** One entry, flat. Both people, the event, and whether the fee is in. */
function EntryRow({ entry }: { entry: Entry }) {
  const tone = ENTRY_TONE[entry.payment_status] ?? "muted";

  return (
    <li className="rounded-[var(--r-md)] border-2 border-ink/10 px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <p className="label-sm text-teal">{entry.event_slug}</p>
          <p className="mt-1 text-[1.02rem] text-ink [overflow-wrap:anywhere]">
            {who(entry.student)}
          </p>
          <p className="mt-0.5 text-[0.95rem] text-muted [overflow-wrap:anywhere]">
            {entry.partner ? `with ${who(entry.partner)}` : "On their own"}
          </p>
          <p className="mt-1.5 text-[0.88rem] text-muted [overflow-wrap:anywhere]">
            {entry.student?.email ?? "No address"}
            {entry.partner?.email ? ` · ${entry.partner.email}` : ""}
          </p>
        </div>

        <span className="flex flex-wrap items-center gap-2">
          <Chip tone={tone}>{entry.payment_status}</Chip>
          {entry.payment_method ? (
            <span className="label-sm text-muted">{entry.payment_method}</span>
          ) : null}
        </span>
      </div>

      {entry.payment_reference ? (
        <p className="mt-3 border-t border-ink/10 pt-3 font-mono text-[0.85rem] text-muted [overflow-wrap:anywhere]">
          {entry.payment_reference}
        </p>
      ) : null}
    </li>
  );
}
