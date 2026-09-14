"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getViewer } from "@/lib/auth/guard";
import { homeFor, type Role } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  notice?: string;
  field?: "email" | "password" | "name";
  /**
   * React resets an uncontrolled form once its action settles, so a rejected
   * attempt would otherwise blank the address the person just typed and make
   * them type it again to find out the password was the problem. Handing it
   * back lets the field re-fill from its default. The password is not
   * returned: that one should be retyped.
   */
  email?: string;
};

export type Provider = "google" | "github" | "facebook";

/**
 * Only same-origin paths are honoured as a return target, so a crafted
 * `?next=//evil.example` cannot turn the gate into an open redirect.
 */
function safeNext(value: FormDataEntryValue | null): string | null {
  const next = typeof value === "string" ? value.trim() : "";
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

/**
 * Where the provider sends the browser back to.
 *
 * Read from the request rather than a constant, so a Vercel preview
 * deployment returns to itself instead of to production. Falls back to the
 * configured site URL when the header is missing.
 */
async function origin(): Promise<string> {
  const h = await headers();
  const forwardedHost = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) return `${proto}://${forwardedHost}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://cesac-azure.vercel.app";
}

/**
 * Supabase returns its own wording, which is written for developers. These
 * are the cases a student will actually hit, said plainly.
 */
function readable(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password do not match.";
  if (m.includes("email not confirmed")) {
    return "Confirm your email first. The link is in your inbox, and it may be in spam.";
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "There is already an account on that email. Sign in instead.";
  }
  if (m.includes("password should be at least")) {
    return "Passwords need at least 8 characters.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts from here. Wait a minute, then try again.";
  }
  if (m.includes("provider is not enabled")) {
    return "That sign-in method is not switched on yet. Use email and password for now.";
  }
  return message;
}

export async function signInWithPassword(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email) return { error: "Enter your email.", field: "email" };
  if (!password) return { error: "Enter your password.", field: "password", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: readable(error.message), field: "password", email };

  const viewer = await getViewer();
  redirect(next ?? homeFor(viewer?.role ?? "participant"));
}

export async function signUpWithPassword(_state: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (name.length < 2) return { error: "Enter your name.", field: "name", email };
  if (!email) return { error: "Enter your email.", field: "email", email };
  if (password.length < 8) {
    return { error: "Pick a password of at least 8 characters.", field: "password", email };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${await origin()}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`,
    },
  });

  if (error) return { error: readable(error.message), field: "email", email };

  // No session back means the project requires email confirmation. Say so
  // rather than dropping them on a gate that will not let them through.
  if (!data.session) {
    return {
      notice: `Account made. Open the link sent to ${email} to confirm it, then sign in.`,
      email,
    };
  }

  redirect(next ?? "/dashboard");
}

/**
 * The social hand-off.
 *
 * Started on the server so the PKCE verifier is written as an HttpOnly cookie
 * before the browser ever leaves, which is what stops the returning code from
 * being usable by anyone but this browser.
 */
export async function signInWithProvider(formData: FormData): Promise<void> {
  const provider = String(formData.get("provider") ?? "") as Provider;
  if (!["google", "github", "facebook"].includes(provider)) {
    redirect("/signin?error=unknown-provider");
  }

  const next = safeNext(formData.get("next"));
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${await origin()}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`,
    },
  });

  if (error || !data.url) {
    redirect(`/signin?error=${encodeURIComponent(readable(error?.message ?? "provider-failed"))}`);
  }

  redirect(data.url);
}

export async function requestPasswordReset(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Enter your email.", field: "email" };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origin()}/auth/callback?next=%2Faccount%2Fpassword`,
  });

  // Deliberately the same answer whether or not that address has an account.
  // Anything else turns this form into a way to find out who has registered.
  return {
    notice: `If ${email} has an account, a reset link is on its way. It may land in spam.`,
    email,
  };
}

export async function updatePassword(_state: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { error: "Pick a password of at least 8 characters.", field: "password" };
  }
  if (password !== confirm) return { error: "The two passwords do not match.", field: "password" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: readable(error.message), field: "password" };

  const viewer = await getViewer();
  redirect(homeFor((viewer?.role ?? "participant") as Role));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/signin");
}
