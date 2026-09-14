import type { Metadata } from "next";

import { markPaidOffline, restoreTeam, verifyPayment } from "@/app/actions/admin";
import { Container, Label } from "@/components/aot/bits";
import { ActionForm } from "@/components/console/action-form";
import { Chip, ConsoleBar, Empty, Panel, Row } from "@/components/console/shell";
import { requireAdmin } from "@/lib/auth/guard";
import { getAdminOverview, getSettings, type TeamWithPeople } from "@/lib/data/console";
import { ADMIN_NAV } from "../nav";

export const metadata: Metadata = {
  title: "Teams",
  robots: { index: false, follow: false },
};

/**
 * Every team, and the money.
 *
 * Ordered so the work comes first: payments waiting on a check sit at the
 * top, because that is the only thing on this page that blocks a team from
 * being registered.
 */
export default async function AdminTeamsPage() {
  const viewer = await requireAdmin();
  const [{ teams, counts }, settings] = await Promise.all([getAdminOverview(), getSettings()]);

  const waiting = teams.filter((team) => team.payment?.status === "submitted");
  const rest = teams.filter((team) => team.payment?.status !== "submitted");

  return (
    <>
      <ConsoleBar viewer={viewer} area="Organiser console" nav={ADMIN_NAV} />

      <div className="washi grain min-h-[100svh] py-12 sm:py-16">
        <Container>
          <header className="max-w-[46ch]">
            <Label tone="teal">Registration</Label>
            <h1 className="d-tall mt-4 text-[clamp(2.6rem,7vw,4.5rem)] text-ink">Teams</h1>
            <p className="serif-it mt-4 text-[1.1rem] leading-relaxed text-muted">
              {counts.registered} registered of {counts.teams} made, {counts.seated} seats held
              against a cap of {settings.seats_cap}.
            </p>
          </header>

          <section className="mt-10">
            <h2 className="d-tall text-[1.9rem] text-ink">Waiting on a check</h2>
            {waiting.length === 0 ? (
              <div className="mt-5">
                <Empty>
                  Nothing to verify. A team appears here when it records a payment, whether that
                  came through Razorpay or by hand, and stays until an organiser confirms it
                  against the account.
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

          <section className="mt-10">
            <h2 className="d-tall text-[1.9rem] text-ink">Everyone else</h2>
            {rest.length === 0 ? (
              <div className="mt-5">
                <Empty>No other team has been made yet.</Empty>
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
                    <option value="razorpay">Razorpay</option>
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
