import type { Metadata } from "next";

import { SignInPanel } from "@/components/sections/signin-panel";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Attack on Token — participant access for registered teams, organiser access for the CESAC committee.",
};

export default async function SignInPage(props: PageProps<"/signin">) {
  const { role } = await props.searchParams;
  const initialRole = role === "admin" ? "admin" : "participant";

  return <SignInPanel initialRole={initialRole} />;
}
