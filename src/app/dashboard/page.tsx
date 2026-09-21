import type { Metadata } from "next";
import Link from "next/link";

import { Label } from "@/components/aot/bits";
import { Chip, Empty, Notice, Panel, Row } from "@/components/console/shell";
import { StandingSummary } from "@/components/console/standing";
import { requireParticipant } from "@/lib/auth/guard";
import { CONTRIBUTION_LABEL } from "@/lib/console/options";
import { KIND_LABEL, LEVEL_LABEL } from "@/lib/console/records";
import { getMyCertificates } from "@/lib/data/certificates";
import { getSettings } from "@/lib/data/console";
import { getDeptEvents, getMyRegistrations } from "@/lib/data/dept-events";
import { getMyQueries } from "@/lib/data/queries";
import { getMyProfile, getMyStanding } from "@/lib/data/student";

export const metadata: Metadata = {
  title: "Your console",
  robots: { index: false, follow: false },
};

function when(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * The front page of a student's record.
 *
 * This is the department's site now, not an event's, so what opens is the
 * student: who they are, what they have done, where that puts them. Every
 * figure is read from the database for the person looking at it, and where
 * there is genuinely nothing yet the panel says what has to happen first
 * rather than showing a placeholder. A console that opens on invented numbers
 * teaches its users to distrust the real ones.
 */
export default async function ConsolePage() {
  const viewer = await requireParticipant();

  const [profile, certificates, standing, events, registrations, queries, settings] =
    await Promise.all([
      getMyProfile(),
      getMyCertificates(),
      getMyStanding(),
      getDeptEvents(),
      getMyRegistrations(),
      getMyQueries(),
      getSettings(),
    ]);

  const missing = [
    profile?.full_name?.trim() ? null : "name",
    profile?.student_class ? null : "class",
    profile?.prn ? null : "PRN",
    profile?.phone ? null : "mobile number",
  ].filter(Boolean) as string[];

  const openEntries = events.filter((e) => e.state === "open").length;
  const waiting = queries.filter((q) => q.status === "open").length;
  const answered = queries.filter((q) => q.status === "answered").length;

  return (
    <>
      <header className="max-w-[46ch]">
        <Label tone="teal">Computer Engineering</Label>
        <h1 className="d-tall mt-4 text-[clamp(2.4rem,6.5vw,4rem)] text-ink">{viewer.name}</h1>
        <p className="serif-it mt-4 text-[1.05rem] leading-relaxed text-muted">
          {[profile?.student_class, profile?.prn].filter(Boolean).join(" · ") ||
            "Your class and PRN are not filled in yet."}
        </p>
      </header>

      {settings.announcement ? (
        <div className="mt-8">
          <Notice tone="ok">{settings.announcement}</Notice>
        </div>
      ) : null}

      {missing.length > 0 ? (
        <div className="mt-8">
          <Notice tone="error">
            Your {missing.join(", ").replace(/, ([^,]*)$/, " and $1")}{" "}
            {missing.length === 1 ? "is" : "are"} still blank.{" "}
            <Link href="/dashboard/profile" className="underline decoration-2 underline-offset-2">
              {missing.length === 1 ? "Fill it in" : "Fill them in"}
            </Link>{" "}
            so the department can put a certificate in the right hands.
          </Notice>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Panel
          eyebrow="Standing"
          title="Where you rank"
          aside={
            <Link href="/dashboard/ranking" className="text-teal hover:underline">
              The board
            </Link>
          }
        >
          <StandingSummary standing={standing} />
        </Panel>

        <Panel
          eyebrow="On file"
          title="Your details"
          aside={
            <Link href="/dashboard/profile" className="text-teal hover:underline">
              Edit
            </Link>
          }
        >
          <dl>
            <Row k="Name" v={profile?.full_name?.trim() || <Blank />} />
            <Row k="Class" v={profile?.student_class || <Blank />} />
            <Row k="PRN" v={profile?.prn || <Blank />} />
            <Row k="Mobile" v={profile?.phone || <Blank />} />
            <Row
              k="Email"
              v={<span className="[overflow-wrap:anywhere]">{viewer.email}</span>}
            />
          </dl>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Panel
          eyebrow="Your record"
          title="Hackathons and publications"
          aside={
            <Link href="/dashboard/certificates" className="text-teal hover:underline">
              {certificates.length ? "All of them" : "Add one"}
            </Link>
          }
        >
          {certificates.length === 0 ? (
            <Empty>
              Nothing on your record yet. Hackathons, competitions, journal papers, conference
              papers, books and book chapters all go here, from anywhere and not only our own
              events, and every one of them counts towards your ranking.
            </Empty>
          ) : (
            <ul className="grid gap-0">
              {certificates.slice(0, 4).map((certificate) => (
                <li
                  key={certificate.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink/10 py-3.5 last:border-0"
                >
                  <span className="min-w-0 text-[1.02rem] text-ink">{certificate.event_name}</span>
                  <span className="label-sm text-muted">
                    {/* A publication has no place, so it is named by what it
                        is. A hackathon is named by what they came away with. */}
                    {certificate.kind === "event"
                      ? (CONTRIBUTION_LABEL[certificate.contribution] ?? "Participation")
                      : (KIND_LABEL[certificate.kind] ?? "Publication")}{" "}
                    {"·"}{" "}
                    {certificate.level ? `${LEVEL_LABEL[certificate.level]} · ` : ""}
                    {when(certificate.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="grid gap-6">
          <Panel
            eyebrow="Calendar"
            title="Events"
            aside={
              <Link href="/dashboard/events" className="text-teal hover:underline">
                See them
              </Link>
            }
          >
            <dl>
              <Row k="On the calendar" v={events.length} />
              <Row
                k="Taking entries"
                v={
                  openEntries > 0 ? (
                    <Chip tone="lime">{openEntries} open</Chip>
                  ) : (
                    <span className="text-muted">None yet</span>
                  )
                }
              />
              <Row
                k="You have entered"
                v={registrations.length || <span className="text-muted">Nothing</span>}
              />
            </dl>
          </Panel>

          <Panel
            eyebrow="Ask us"
            title="Questions"
            aside={
              <Link href="/dashboard/queries" className="text-teal hover:underline">
                Open one
              </Link>
            }
          >
            <dl>
              <Row
                k="Waiting"
                v={waiting || <span className="text-muted">None</span>}
              />
              <Row
                k="Answered"
                v={
                  answered ? <Chip tone="lime">{answered}</Chip> : <span className="text-muted">None</span>
                }
              />
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Blank() {
  return <span className="text-muted">Not filled in</span>;
}
