import type { Metadata } from "next";

import { SignInPanel } from "@/components/sections/signin-panel";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Attack on Token with Google, GitHub, Facebook or an email and password.",
  robots: { index: false, follow: false },
};

export default async function SignInPage(props: PageProps<"/signin">) {
  const { next, error, mode } = await props.searchParams;

  // `next` arrives from the proxy redirect. It is re-checked inside the action
  // and again in the callback before anyone is sent anywhere, so this only has
  // to pass it along.
  return (
    <SignInPanel
      initialMode={mode === "signup" ? "signup" : "signin"}
      next={typeof next === "string" ? next : undefined}
      urlError={typeof error === "string" ? error : undefined}
    />
  );
}
