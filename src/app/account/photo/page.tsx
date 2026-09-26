import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/actions/auth";
import { Container, Label } from "@/components/aot/bits";
import { PhotoForm } from "@/components/sections/photo-form";
import { getViewer, homeFor } from "@/lib/auth/guard";
import { avatarUrl } from "@/lib/photos";

export const metadata: Metadata = {
  title: "Your photo",
  robots: { index: false, follow: false },
};

/**
 * The one step every student, and every verifier, takes before their console
 * opens.
 *
 * The boards print a photo next to every name, the front page's standouts
 * included, so a student with no photo would be a row of initials among
 * faces. Asked once, straight after the password, and never again.
 *
 * Like the password screen, this calls getViewer rather than
 * requireParticipant, because requireParticipant is what sends people here.
 * The password still comes first: a student holding their imported password
 * is sent to choose one before they are asked for anything else.
 */
export default async function PhotoPage(props: PageProps<"/account/photo">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/account/photo");
  if (viewer.mustChangePassword) redirect("/account/password?first=1");

  const { next } = await props.searchParams;
  const back =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : homeFor(viewer.role);

  const forced = viewer.needsPhoto;

  return (
    <div className="washi grain flex min-h-[100svh] items-center py-24">
      <Container>
        <div className="card mx-auto w-full max-w-[520px] p-8 sm:p-10">
          <Label tone={forced ? "ink" : "teal"}>{forced ? "One step first" : "Your account"}</Label>

          <h1 className="d-tall mt-3 text-[2.2rem] text-ink">
            {forced ? "Add your photo" : "Change your photo"}
          </h1>

          <p className="serif-it mt-3 text-[1.02rem] leading-relaxed text-muted">
            {viewer.isVerifier
              ? forced
                ? "Every account that checks student records carries a photo of the person behind it. Add one now and it is done; the queue does not open until you do."
                : "The photo on your account. A new one replaces the old one everywhere at once."
              : forced
                ? "Wherever the site ranks students, on the front page, on the standouts list and on the ranking in your console, your name is shown with your photo. Add one now and it is done; nothing else opens until you do."
                : "The photo shown next to your name on the standouts and the ranking. A new one replaces the old one everywhere at once."}
          </p>

          <PhotoForm current={avatarUrl(viewer.photoPath)} next={back} forced={forced} />


          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-5">
            {forced ? (
              <>
                <p className="serif-it text-[0.9rem] leading-relaxed text-muted">
                  Signed in as someone else?
                </p>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="label rounded-full border-2 border-ink/25 px-4 py-2 text-ink transition-colors hover:bg-ink hover:text-cream"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link href={back} className="label text-teal hover:text-ink">
                Back to your console
              </Link>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
