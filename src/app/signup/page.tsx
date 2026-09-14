import type { Metadata } from "next";

import { SignInPanel } from "@/components/sections/signin-panel";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Make an Attack on Token account, then build your team from the console.",
  robots: { index: false, follow: false },
};

/**
 * The same panel, opened on the other tab. A separate route rather than a
 * query string because "sign up" is a link people are given, and it should
 * look like one.
 */
export default async function SignUpPage(props: PageProps<"/signup">) {
  const { next, error } = await props.searchParams;

  return (
    <SignInPanel
      initialMode="signup"
      next={typeof next === "string" ? next : undefined}
      urlError={typeof error === "string" ? error : undefined}
    />
  );
}
