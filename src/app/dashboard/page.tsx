import type { Metadata } from "next";
import Link from "next/link";

import { Container, Label } from "@/components/aot/bits";
import { HandInForm } from "@/components/console/hand-in-form";
import { InviteCode } from "@/components/console/invite-code";
import { PaymentPanel } from "@/components/console/payment-panel";
import { Chip, ConsoleBar, Empty, Notice, Panel, Row } from "@/components/console/shell";
import { TeamSetup } from "@/components/console/team-setup";
import { requireParticipant } from "@/lib/auth/guard";
import {
  getChapters,
  getLeaderboard,
  getMySubmissions,
  getMyTeam,
  getSettings,
} from "@/lib/data/console";
import { handInFor } from "@/lib/data/hand-ins";
import { EVENT } from "@/lib/data/event";
import { razorpayConfigured } from "@/app/actions/team";

export const metadata: Metadata = {
  title: "Your console",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/events/attack-on-token", label: "Event page" },
  { href: "/events", label: "Events" },
  { href: "/", label: "Site" },
];

/**
 * The participant console.
 *
 * Everything on this page is read from the database for the person looking at
 * it: their team, their payment, their hand-ins, their standing. Where there
 * is genuinely nothing yet, the panel says what has to happen first rather
 * than showing a placeholder number. A console that opens on invented figures
 * teaches its users to distrust the real ones.
 */
export default async function DashboardPage() {
  const viewer = await requireParticipant();

  const [team, settings, chapters, submissions, board, onlinePayments] = await Promise.all([
    getMyTeam(),
    getSettings(),
    getChapters(),
    getMySubmissions(),
    getLeaderboard(),
    razorpayConfigured(),
  ]);

  const standing = team ? board.rows.find((row) => row.team_id === team.id) : undefined;
  const isCaptain = team?.captain_id === viewer.id;
  const registered = team?.status === "registered";

  return (
    <>
      <ConsoleBar viewer={viewer} area="Participant console" nav={NAV} />

      <div className="washi grain min-h-[100svh] py-12 sm:py-16">
        <Container>
          <header className="max-w-[46ch]">
            <Label tone="teal">{EVENT.kicker}</Label>
            <h1 className="d-tall mt-4 text-[clamp(2.6rem,7vw,4.5rem)] text-ink">{viewer.name}</h1>
            <p className="serif-it mt-4 text-[1.1rem] leading-relaxed text-muted">
              {team
                ? registered
                  ? "You are in. Chapters open on the day, and each one appears below as it does."
                  : "Your team is not complete yet. The panel below says what is still outstanding."
                : "You are through the gate. Next is a team of two."}
            </p>
          </header>

          {settings.announcement ? (
            <div className="mt-8">
              <Notice tone="ok">{settings.announcement}</Notice>
            </div>
          ) : null}

          {!team ? (
            <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
              <TeamSetup registrationOpen={settings.registration_open} />

              <Panel eyebrow="How it works" title="Three steps">
                <ol className="grid gap-3">
                  {[
                    {
                      step: "01",
                      title: "One of you makes the team",
                      note: "You get a six character code the moment you do.",
                    },
                    {
                      step: "02",
                      title: "The other joins with the code",
                      note: "They need an account of their own first. Teams are exactly two.",
                    },
                    {
                      step: "03",
                      title: "Pay the entry fee",
                      note: `₹${settings.entry_fee_inr} per team. An organiser verifies it, and the seat is yours.`,
                    },
                  ].map((item) => (
                    <li
                      key={item.step}
                      className="flex items-start gap-4 rounded-[var(--r-md)] bg-cream-2 px-5 py-4"
                    >
                      <span className="d-tall shrink-0 text-[1.4rem] leading-none text-teal">
                        {item.step}
                      </span>
                      <span>
                        <span className="label block text-ink">{item.title}</span>
                        <span className="mt-1.5 block text-[0.95rem] text-muted">{item.note}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="serif-it mt-6 text-[0.95rem] leading-relaxed text-muted">
                  The full brief, prizes and rules live on the{" "}
                  <Link href="/events/attack-on-token" className="text-teal hover:underline">
                    event page
                  </Link>
                  .
                </p>
              </Panel>
            </div>
          ) : (
            <>
              <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
                <Panel
                  eyebrow="Your team"
                  title={team.name}
                  aside={
                    <Chip
                      tone={
                        team.status === "registered"
                          ? "lime"
                          : team.status === "forming"
                            ? "teal"
                            : "red"
                      }
                    >
                      {team.status === "registered"
                        ? "Registered"
                        : team.status === "forming"
                          ? "Forming"
                          : team.status === "withdrawn"
                            ? "Withdrawn"
                            : "Disqualified"}
                    </Chip>
                  }
                >
                  <dl>
                    <Row
                      k="Captain"
                      v={team.captain?.full_name ?? team.captain?.email ?? "Unknown"}
                    />
                    <Row
                      k="Partner"
                      v={
                        team.partner ? (
                          (team.partner.full_name ?? team.partner.email)
                        ) : team.partner_name ? (
                          <span className="text-muted">{team.partner_name}, not joined yet</span>
                        ) : (
                          <span className="text-muted">Nobody has joined yet</span>
                        )
                      }
                    />
                    <Row k="Seat" v={team.seat ? `#${team.seat}` : "Assigned once registered"} />
                    <Row k="Entry" v={`₹${settings.entry_fee_inr} per team of two`} />
                    {team.eliminated_at_chapter ? (
                      <Row k="Out at" v={team.eliminated_at_chapter} />
                    ) : null}
                  </dl>

                  {!team.partner_id ? (
                    <div className="mt-7">
                      <InviteCode code={team.invite_code} isCaptain={isCaptain} />
                    </div>
                  ) : null}
                </Panel>

                <PaymentPanel
                  payment={team.payment}
                  settings={settings}
                  onlineEnabled={settings.online_payment && onlinePayments}
                  viewer={{ name: viewer.name, email: viewer.email }}
                />
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Panel
                  eyebrow="Standing"
                  title="Leaderboard"
                  aside={board.published ? "Published" : undefined}
                >
                  {!standing || standing.chapters_scored === 0 ? (
                    <Empty>
                      Nothing scored yet. Your position appears here the moment organisers publish
                      the first round of scores, and the whole board opens up when they publish
                      it.
                    </Empty>
                  ) : (
                    <>
                      <dl>
                        <Row k="Weighted total" v={standing.total?.toFixed(2) ?? "0.00"} />
                        <Row k="Chapters scored" v={standing.chapters_scored} />
                        {board.published ? (
                          <Row k="Position" v={`#${standing.rank} of ${board.rows.length}`} />
                        ) : null}
                      </dl>
                      {!board.published ? (
                        <p className="serif-it mt-5 text-[0.95rem] leading-relaxed text-muted">
                          Your own score only. Positions appear once organisers publish the board.
                        </p>
                      ) : null}
                    </>
                  )}
                </Panel>

                <Panel eyebrow="Before the day" title="Where you stand">
                  <dl>
                    <Row k="Account" v="Made" />
                    <Row k="Team" v={team.partner_id ? "Two of you" : "Waiting on your partner"} />
                    <Row
                      k="Entry fee"
                      v={
                        team.payment?.status === "verified"
                          ? "Verified"
                          : team.payment?.status === "submitted"
                            ? "Waiting on an organiser"
                            : "Outstanding"
                      }
                    />
                    <Row k="Seat" v={team.seat ? `Held, #${team.seat}` : "Not yet"} />
                  </dl>
                  <p className="serif-it mt-6 text-[0.95rem] leading-relaxed text-muted">
                    A team is registered once it has two people and a verified payment. Seats are
                    given out in the order teams complete, up to {settings.seats_cap}.
                  </p>
                </Panel>
              </div>

              <section className="mt-6">
                <header className="flex flex-wrap items-baseline justify-between gap-4">
                  <h2 className="d-tall text-[1.9rem] text-ink">Three chapters</h2>
                  <p className="label text-muted">{EVENT.tagline}</p>
                </header>

                {!registered ? (
                  <div className="mt-5">
                    <Empty>
                      Hand-ins open once your team is registered, which means two people and a
                      verified entry fee. Until then the chapters below are read-only.
                    </Empty>
                  </div>
                ) : null}

                <div className="mt-5 grid gap-6">
                  {chapters.map((chapter) => {
                    const spec = handInFor(chapter.id);
                    if (!spec) return null;
                    return (
                      <HandInForm
                        key={chapter.id}
                        chapter={chapter}
                        handIn={spec}
                        submission={submissions.find((s) => s.chapter_id === chapter.id) ?? null}
                        teamId={team.id}
                      />
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </Container>
      </div>
    </>
  );
}
