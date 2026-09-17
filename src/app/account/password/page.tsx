import type { Metadata } from "next";

import { signOut } from "@/app/actions/auth";
import { Container, Label } from "@/components/aot/bits";
import { PasswordForm } from "@/components/sections/password-form";
import { getViewer } from "@/lib/auth/guard";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

/**
 * Two ways in, one screen.
 *
 * A reset link lands here, and so does every student whose account still holds
 * the password it was imported with. The second group did not choose to be
 * here and has no idea why they are, so the page says plainly what happened
 * and what it wants before showing them a form.
 *
 * This is the one guarded page that calls getViewer rather than
 * requireParticipant, because requireParticipant is what sends people here.
 */
export default async function PasswordPage(props: PageProps<"/account/password">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin/help");

  const { first } = await props.searchParams;
  // The flag is what decides, not the query string: a student cannot get out
  // of the forced screen by trimming ?first=1 off the address bar, and a
  // student who has already changed theirs cannot be scared by adding it.
  const forced = viewer.mustChangePassword;
  const arrivedFromSignIn = forced && first === "1";

  return (
    <div className="washi grain flex min-h-[100svh] items-center py-24">
      <Container>
        <div className="card mx-auto w-full max-w-[460px] p-8 sm:p-10">
          <Label tone={forced ? "ink" : "teal"}>{forced ? "One step first" : "Access"}</Label>

          <h1 className="d-tall mt-3 text-[2.2rem] text-ink">
            {forced ? "Choose your password" : "Set a new password"}
          </h1>

          {forced ? (
            <>
              <p className="serif-it mt-3 text-[1.02rem] leading-relaxed text-muted">
                {arrivedFromSignIn ? "Welcome. " : null}
                Your account for{" "}
                {/* A 30 character address is one unbreakable word, and justified
                    copy stretches the line it will not fit on into a row of
                    gaps. Letting it break anywhere keeps the paragraph even. */}
                <span className="[overflow-wrap:anywhere]">{viewer.email}</span> was created for
                you by the department, and its password is currently your own email address.
                Anyone who knows your address knows how to sign in as you, so pick a real password
                before you go any further.
              </p>
              <p className="serif-it mt-3 text-[1.02rem] leading-relaxed text-muted">
                Nothing else opens until you do.
              </p>
            </>
          ) : (
            <p className="serif-it mt-3 text-[1.02rem] leading-relaxed text-muted">
              For {viewer.email}. Signing in with a provider stays available either way.
            </p>
          )}

          <PasswordForm forced={forced} />

          {forced ? (
            <div className="mt-6 border-t border-ink/10 pt-5">
              <p className="serif-it text-[0.9rem] leading-relaxed text-muted">
                Signed in as someone else?
              </p>
              <form action={signOut} className="mt-2.5">
                <button
                  type="submit"
                  className="label rounded-full border-2 border-ink/25 px-4 py-2 text-ink transition-colors hover:bg-ink hover:text-cream"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </Container>
    </div>
  );
}
