import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Panel, Row } from "@/components/console/shell";
import { StudentDataForm } from "@/components/console/student-data-form";
import { requireParticipant } from "@/lib/auth/guard";
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
 * The student's own record of themselves.
 *
 * Four fields, all theirs to change, and one they cannot: the address. That is
 * what the roster was imported on and what the account signs in with, and the
 * database reverts a change made to it anywhere but through auth, so it is
 * shown rather than offered.
 */
export default async function ProfilePage() {
  await requireParticipant();

  const profile = await getMyProfile();
  // requireParticipant already proved there is a session and a profile behind
  // it; this is the type narrowing, not a second check.
  if (!profile) redirect("/signin");

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
      <Panel eyebrow="On file" title="Student data">
        <StudentDataForm profile={profile} />
      </Panel>

      <div className="grid gap-6">
        <Panel eyebrow="Account" title="Signing in">
          <dl>
            <Row k="Role" v="Student" />
            <Row k="Department" v={profile.college ?? "VIT Pune"} />
            <Row k="Year" v={profile.year ?? "Not recorded"} />
            <Row k="Registered" v={when(profile.created_at)} />
          </dl>

          <p className="serif-it mt-6 text-[0.95rem] leading-relaxed text-muted">
            The department made this account for you from its own roster, which is why you did not
            sign up for it.
          </p>

          <Link
            href="/account/password"
            className="pill pill-ghost mt-6 inline-flex justify-self-start"
          >
            Change my password
          </Link>
        </Panel>

        <Panel eyebrow="Who sees it" title="Your data">
          <p className="serif-it text-[0.98rem] leading-relaxed text-muted">
            Your class, PRN and mobile number are readable by you and by the committee, and by
            nobody else signed in to this site. The ranking board shows a name, a year and a count
            of certificates; it never shows any of these.
          </p>
          <p className="serif-it mt-4 text-[0.98rem] leading-relaxed text-muted">
            Anything you want removed, ask on the{" "}
            <Link href="/dashboard/queries" className="text-teal hover:underline">
              questions page
            </Link>
            .
          </p>
        </Panel>
      </div>
    </div>
  );
}
