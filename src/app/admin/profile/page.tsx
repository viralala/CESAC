import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Container, Label } from "@/components/aot/bits";
import { Panel, Row } from "@/components/console/shell";
import { StudentDataForm } from "@/components/console/student-data-form";
import { requireAdmin } from "@/lib/auth/guard";
import { EVENT } from "@/lib/data/event";
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
 */
export default async function AdminProfilePage() {
  const viewer = await requireAdmin();

  const profile = await getMyProfile();
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
      </Container>
    </div>
  );
}
