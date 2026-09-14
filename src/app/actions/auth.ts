"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { findAccount, verifyCode, verifyPassword } from "@/lib/auth/accounts";
import { getSession } from "@/lib/auth/guard";
import {
  homeFor,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  type Role,
} from "@/lib/auth/session";

export type SignInState = {
  error?: string;
  /** Which field to point the message at, so the form can mark it invalid. */
  field?: "identifier" | "password" | "code";
};

/**
 * Attempt throttle.
 *
 * Per instance and in memory, so on Vercel it is a speed bump rather than a
 * lock: a new lambda starts with an empty map. It still blunts the obvious
 * case of one browser hammering one identifier. A real limiter needs shared
 * storage, and belongs with the database whenever that lands.
 */
const ATTEMPTS = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 8;
const LOCKOUT_MS = 5 * 60 * 1000;

function throttled(key: string): boolean {
  const entry = ATTEMPTS.get(key);
  if (!entry) return false;
  if (Date.now() > entry.until) {
    ATTEMPTS.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string) {
  const entry = ATTEMPTS.get(key);
  if (!entry || Date.now() > entry.until) {
    ATTEMPTS.set(key, { count: 1, until: Date.now() + LOCKOUT_MS });
    return;
  }
  entry.count += 1;
  entry.until = Date.now() + LOCKOUT_MS;
}

/**
 * Only same-origin paths are honoured as a return target, so a crafted
 * `?next=//evil.example` cannot turn the gate into an open redirect.
 */
function safeNext(value: FormDataEntryValue | null, role: Role): string {
  const next = typeof value === "string" ? value : "";
  if (!next.startsWith("/") || next.startsWith("//")) return homeFor(role);

  // A participant link must not drop someone into the organiser console.
  const area = role === "admin" ? "/admin" : "/dashboard";
  return next === area || next.startsWith(`${area}/`) ? next : homeFor(role);
}

export async function signIn(_state: SignInState, formData: FormData): Promise<SignInState> {
  const rawRole = formData.get("role");
  const role: Role = rawRole === "admin" ? "admin" : "participant";

  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const code = String(formData.get("code") ?? "");
  const remember = formData.get("remember") === "on";
  const destination = safeNext(formData.get("next"), role);

  if (!identifier) {
    return { error: "Enter your sign-in ID.", field: "identifier" };
  }
  if (!password) {
    return { error: "Enter your password.", field: "password" };
  }

  const key = `${role}:${identifier.toLowerCase()}`;
  if (throttled(key)) {
    return {
      error: "Too many attempts. Wait five minutes, then try again.",
      field: "password",
    };
  }

  const account = findAccount(role, identifier);

  // Hash even when the account is missing, so a wrong ID and a wrong password
  // take the same time to answer and neither can be used to enumerate accounts.
  const ok = account
    ? await verifyPassword(password, account.password)
    : await verifyPassword(password, `scrypt$16384$${"A".repeat(22)}$${"A".repeat(86)}`);

  if (!account || !ok) {
    recordFailure(key);
    return { error: "That ID and password do not match.", field: "password" };
  }

  if (role === "admin") {
    if (!account.code) {
      return { error: "This organiser account has no access code set.", field: "code" };
    }
    if (!verifyCode(code, account.code)) {
      recordFailure(key);
      return { error: "That access code is not right.", field: "code" };
    }
  }

  ATTEMPTS.delete(key);

  const token = await signSession({ sub: account.id, role: account.role, name: account.name });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Unticked, the cookie is a session cookie and dies with the browser.
    ...(remember ? { maxAge: SESSION_MAX_AGE } : {}),
  });

  // redirect throws, so it has to sit outside every try block above.
  redirect(destination);
}

export async function signOut() {
  const session = await getSession();
  (await cookies()).delete(SESSION_COOKIE);
  redirect(session?.role === "admin" ? "/signin?role=admin" : "/signin");
}
