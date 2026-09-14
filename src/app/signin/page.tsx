import type { Metadata } from "next";

import { SignInPanel } from "@/components/sections/signin-panel";
import { demoAccountsActive } from "@/lib/auth/accounts";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Attack on Token. Participant access for registered teams, organiser access for the CESAC committee.",
  robots: { index: false, follow: false },
};

export default async function SignInPage(props: PageProps<"/signin">) {
  const { role, next } = await props.searchParams;
  const initialRole = role === "admin" ? "admin" : "participant";

  // `next` arrives from the proxy redirect. It is re-checked inside the action
  // before anyone is sent anywhere, so this only has to pass it along.
  const target = typeof next === "string" ? next : undefined;

  return <SignInPanel initialRole={initialRole} next={target} demo={demoAccountsActive()} />;
}
