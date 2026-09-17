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

/**
 * Who is knocking, as far as the throttle is concerned.
 *
 * The left-most entry in x-forwarded-for is the client as the first proxy saw
 * it. It is spoofable in general, which is why it only ever widens the net
 * here: the per-address counter does the real work and does not depend on it.
 */
async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip")?.trim() ?? "";
}

/**
 * One answer for every way a credential can be wrong.
 *
 * Saying which half did not match turns the form into a way to find out who
 * holds an account, and right now that matters more than usual: until the last
 * imported student has changed their password, knowing an address is on the
 * roster is knowing a password that works.
 */
const GENERIC_SIGN_IN_ERROR = "Invalid email or password.";

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
  const ip = await clientIp();

  // Ask before trying, so a run of guesses costs the attacker the wait rather
  // than the auth endpoint the attempts.
  const { data: waitFor } = await supabase.rpc("login_throttle_check", {
    p_email: email,
    p_ip: ip,
  });

  if (typeof waitFor === "number" && waitFor > 0) {
    const minutes = Math.ceil(waitFor / 60);
    return {
      error: `Too many sign-in attempts. Try again in ${
        minutes <= 1 ? "a minute" : `${minutes} minutes`
      }.`,
      field: "password",
      email,
    };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // The outcome only. The password itself is never passed on, written down or
  // logged anywhere in this function.
  await supabase.rpc("login_attempt_record", { p_email: email, p_ip: ip, p_ok: !error });

  if (error) {
    // An unconfirmed account is a different problem with a different fix, and
    // the sign-up form already says as much when the address is taken, so
    // there is nothing left to conceal by hiding it here.
    const unconfirmed = error.message.toLowerCase().includes("email not confirmed");
    return {
      error: unconfirmed ? readable(error.message) : GENERIC_SIGN_IN_ERROR,
      field: "password",
      email,
    };
  }

  const viewer = await getViewer();
  if (viewer?.mustChangePassword) redirect("/account/password?first=1");

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
  const viewer = await getViewer();

  // An imported student setting their first real password must not be allowed
  // to set it back to the address they signed in with, which is the one thing
  // the whole forced-change screen exists to get rid of.
  if (viewer?.mustChangePassword && password.trim().toLowerCase() === viewer.email) {
    return {
      error: "Choose something other than your email address.",
      field: "password",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: readable(error.message), field: "password" };

  // Only now, and only through this function: the flag is guarded in the
  // database so that clearing it cannot be faked from the browser, and it is
  // cleared as the last step of the change so it can never outlive the
  // password it describes.
  const { error: flagError } = await supabase.rpc("complete_password_change");
  if (flagError) {
    return {
      error: "Your password was changed, but the account did not unlock. Sign in again.",
      field: "password",
    };
  }

  redirect(homeFor((viewer?.role ?? "participant") as Role));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/signin");
}
