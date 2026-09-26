import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { saveMyRosterProfile } from "@/app/actions/console-content";
import { Container, Label } from "@/components/aot/bits";
import { ActionForm } from "@/components/console/action-form";
import { Empty, Panel, Row } from "@/components/console/shell";
import { StudentDataForm } from "@/components/console/student-data-form";
import { requireAdmin } from "@/lib/auth/guard";
import { EVENT } from "@/lib/data/event";
import { getMyRosterCard } from "@/lib/data/site";
import { getMyProfile } from "@/lib/data/student";

export const metadata: Metadata = {
  title: "My details",
  robots: { index: false, follow: false },
};

function when(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * The organiser-side twin of /dashboard/profile.
 *
 * An organiser or the owner edits their own name, class, PRN and mobile here,
 * through the same form and the same action a student uses, and changes their
 * password on the same screen everybody else does. The address is shown and
 * not offered, for the reason given on the student page: it is what the
 * account signs in with.
 *
 * Only ever the signed-in account's own row. Editing somebody else is the
 * Students page, behind the People capability, and this page does not reach it.
 *
 * Below that, their own page on the public roster, for an organiser whose
 * address the committee has linked to a roster card. Before 27 September
 * 2026 only somebody with Site access could change a roster page at all.
 */
export default async function AdminProfilePage() {
  const viewer = await requireAdmin();

  const [profile, card] = await Promise.all([getMyProfile(), getMyRosterCard()]);
  if (!profile) redirect("/signin");

  return (
    <div className="washi grain min-h-[100svh] py-12 sm:py-16">
      <Container>
        <header className="max-w-[52ch]">
          <Label tone="teal">{EVENT.host}</Label>
          <h1 className="d-tall mt-4 text-[clamp(2.4rem,6vw,4rem)] text-ink">My details</h1>
          <p className="serif-it mt-4 text-[1.1rem] leading-relaxed text-muted">
            Your own account, whose name is printed beside your records and on the console bar.
          </p>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          <Panel eyebrow="On file" title="Your details">
            <StudentDataForm profile={profile} />
          </Panel>

          <Panel eyebrow="Account" title="Signing in">
            <dl>
              <Row k="Email" v={<span className="[overflow-wrap:anywhere]">{profile.email}</span>} />
              <Row k="Role" v={viewer.role === "owner" ? "Owner" : "Organiser"} />
              <Row k="Registered" v={when(profile.created_at)} />
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/account/password" className="pill pill-ghost inline-flex">
                Change my password
              </Link>
              <Link href="/account/photo?next=/admin/profile" className="pill pill-ghost inline-flex">
                Change my photo
              </Link>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel
            eyebrow="The public roster"
            title="My roster page"
            aside={
              card?.slug ? (
                <Link href={`/people/${card.slug}`} className="text-teal hover:underline">
                  /people/{card.slug}
                </Link>
              ) : undefined
            }
          >
            {card ? (
              <ActionForm action={saveMyRosterProfile} submit="Save my page" tone="lime">
                <p className="serif-it text-[0.98rem] leading-relaxed text-muted">
                  What you write here is printed on your public page as you wrote it; your name,
                  rank and block are set by the committee.
                </p>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <RosterField name="preferred_name" label="Goes by" value={card.preferred_name} max={80} />
                  <RosterField name="year_branch" label="Year and branch" value={card.year_branch} max={80} placeholder="TY Computer Engineering" />
                  <RosterField name="tagline" label="One line about you" value={card.tagline} max={240} wide />
                  <RosterField name="about" label="About" value={card.about} max={2000} wide long />
                  <RosterField name="hobbies" label="Hobbies and interests" value={card.hobbies} max={400} long />
                  <RosterField name="fun_fact" label="Fun fact, or a hidden skill" value={card.fun_fact} max={500} long />
                  <RosterField name="linkedin" label="LinkedIn" value={card.linkedin} max={300} placeholder="https://www.linkedin.com/in/" />
                  <RosterField name="github" label="GitHub" value={card.github} max={300} placeholder="https://github.com/" />
                  <RosterField name="instagram" label="Instagram" value={card.instagram} max={300} placeholder="https://www.instagram.com/" />
                </div>
              </ActionForm>
            ) : (
              <Empty>
                Your account is not linked to a card on the roster yet. An organiser with Site access
                can link it by putting your email on your card under Site, Roster.
              </Empty>
            )}
          </Panel>
        </div>
      </Container>
    </div>
  );
}

function RosterField({
  name,
  label,
  value,
  max,
  placeholder,
  wide = false,
  long = false,
}: {
  name: string;
  label: string;
  value: string | null;
  max: number;
  placeholder?: string;
  wide?: boolean;
  long?: boolean;
}) {
  const id = `roster-${name}`;
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="label block text-ink">
        {label}
      </label>
      {long ? (
        <textarea
          id={id}
          name={name}
          maxLength={max}
          rows={wide ? 5 : 3}
          defaultValue={value ?? ""}
          className="field mt-2.5"
        />
      ) : (
        <input
          id={id}
          name={name}
          type={name === "linkedin" || name === "github" || name === "instagram" ? "url" : "text"}
          maxLength={max}
          defaultValue={value ?? ""}
          placeholder={placeholder}
          className="field mt-2.5"
        />
      )}
    </div>
  );
}
