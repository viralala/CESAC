import "server-only";

import { scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

import type { Role } from "@/lib/auth/session";

function scrypt(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

/**
 * The account store.
 *
 * There is no database on this project yet, so accounts are configuration:
 * a JSON array in `AOT_ACCOUNTS`, read once at module load. Swapping this file
 * for a real table later means replacing `findAccount` and nothing else, which
 * is why every caller goes through it rather than touching ACCOUNTS.
 *
 * Passwords are stored as scrypt digests, never plaintext, in the form
 * `scrypt$N$saltB64Url$hashB64Url`. Mint one with `npm run hash-password`.
 */
export type Account = {
  id: string;
  role: Role;
  /** Email for participants, organiser handle for admins. Matched lowercased. */
  identifier: string;
  /** What the console greets them with. */
  name: string;
  /** scrypt$N$salt$hash */
  password: string;
  /** Admin second factor. Ignored for participants. */
  code?: string;
  /** Participants only: the partner's name, shown on the dashboard. */
  partner?: string;
};

/**
 * Fallbacks, used only when AOT_ACCOUNTS is not configured.
 *
 * These exist so the sign-in flow is testable the moment the site is cloned or
 * previewed. They are public knowledge: the digests below are in the repo, so
 * anyone can read the source and derive nothing, but the matching passwords are
 * documented in the README. The sign-in page says so out loud whenever this
 * branch is live, and `demoAccountsActive()` is what drives that banner.
 *
 * Passwords: team@vit.edu / attackontoken, cesac.organiser / survivethetoken
 * with access code 402193.
 */
const DEMO_ACCOUNTS: readonly Account[] = [
  {
    id: "demo-team",
    role: "participant",
    identifier: "team@vit.edu",
    name: "Demo Duo",
    partner: "Demo Partner",
    password:
      "scrypt$16384$w6HIyrkQx4vuHr6UYQzcsg$DcDWFxEr-gDkSrqpmp0cqWPW2CxxkxJQ6qw6cbCh9Vd_FOfUXIYrUkOBSYWqeVql65eZyPbjOabSzri6QTc_vg",
  },
  {
    id: "demo-organiser",
    role: "admin",
    identifier: "cesac.organiser",
    name: "Demo Organiser",
    code: "402193",
    password:
      "scrypt$16384$IyOPy94vBJ-ABAjYQHVL8w$lsTZ-LoBfxXAS0tRYRxgYSs09txk16rIvOdyntx8cso7Cr2YJuWfO7K3jeAL2skN_ub-jKqmRDsqK12y10JVGQ",
  },
];

function parseConfigured(): readonly Account[] | null {
  const raw = process.env.AOT_ACCOUNTS?.trim();
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("AOT_ACCOUNTS must be a JSON array");

    return parsed.map((entry, i) => {
      const a = entry as Partial<Account>;
      if (!a.id || !a.identifier || !a.name || !a.password) {
        throw new Error(`account ${i} is missing id, identifier, name or password`);
      }
      if (a.role !== "participant" && a.role !== "admin") {
        throw new Error(`account ${i} has role "${String(a.role)}"`);
      }
      return {
        id: a.id,
        role: a.role,
        identifier: a.identifier.toLowerCase(),
        name: a.name,
        password: a.password,
        code: a.code,
        partner: a.partner,
      };
    });
  } catch (error) {
    // A malformed store must not silently fall back to the public demo
    // accounts, so fail loudly and sign nobody in.
    console.error("[auth] AOT_ACCOUNTS could not be parsed:", error);
    return [];
  }
}

const CONFIGURED = parseConfigured();
const ACCOUNTS: readonly Account[] = CONFIGURED ?? DEMO_ACCOUNTS;

/** True when the public demo credentials are the ones actually in use. */
export function demoAccountsActive(): boolean {
  return CONFIGURED === null;
}

/**
 * What the organiser console reports about the store. Counts only: no
 * identifiers, and certainly no digests, leave this module.
 */
export function accountSummary(): {
  source: "configured" | "demo";
  participants: number;
  admins: number;
} {
  return {
    source: CONFIGURED ? "configured" : "demo",
    participants: ACCOUNTS.filter((a) => a.role === "participant").length,
    admins: ACCOUNTS.filter((a) => a.role === "admin").length,
  };
}

export function findAccount(role: Role, identifier: string): Account | undefined {
  const needle = identifier.trim().toLowerCase();
  return ACCOUNTS.find((a) => a.role === role && a.identifier === needle);
}

/** The console's own lookup: the session carries an id, the page wants the row. */
export function findAccountById(id: string): Account | undefined {
  return ACCOUNTS.find((a) => a.id === id);
}

/** Parse and check a `scrypt$N$salt$hash` digest against a candidate password. */
export async function verifyPassword(password: string, digest: string): Promise<boolean> {
  const [scheme, cost, salt, hash] = digest.split("$");
  if (scheme !== "scrypt" || !cost || !salt || !hash) return false;

  const N = Number(cost);
  if (!Number.isInteger(N) || N < 1024) return false;

  const expected = Buffer.from(hash, "base64url");
  const actual = (await scrypt(password, Buffer.from(salt, "base64url"), expected.length, {
    N,
    r: 8,
    p: 1,
    // scrypt needs 128 * N * r bytes; Node's 32 MB default is too tight at N=16384.
    maxmem: 128 * N * 8 * 2,
  })) as Buffer;

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Admin access codes are short, so compare them in constant time too. */
export function verifyCode(code: string, expected: string): boolean {
  const a = Buffer.from(code.trim());
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
