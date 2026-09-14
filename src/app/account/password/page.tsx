import type { Metadata } from "next";

import { Container, Label } from "@/components/aot/bits";
import { PasswordForm } from "@/components/sections/password-form";
import { getViewer } from "@/lib/auth/guard";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

/**
 * Where a reset link lands. Reaching this page at all means the one-time link
 * was good, because the callback exchanged it for a session before sending
 * anyone here.
 */
export default async function PasswordPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin/help");

  return (
    <div className="washi grain flex min-h-[100svh] items-center py-24">
      <Container>
        <div className="card mx-auto w-full max-w-[460px] p-8 sm:p-10">
          <Label tone="teal">Access</Label>
          <h1 className="d-tall mt-3 text-[2.2rem] text-ink">Set a new password</h1>
          <p className="serif-it mt-3 text-[1.02rem] leading-relaxed text-muted">
            For {viewer.email}. Signing in with a provider stays available either way.
          </p>
          <PasswordForm />
        </div>
      </Container>
    </div>
  );
}
