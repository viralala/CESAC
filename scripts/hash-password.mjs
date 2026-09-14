/**
 * Mint a password digest for AOT_ACCOUNTS.
 *
 *   node scripts/hash-password.mjs "the password"
 *   npm run hash-password -- "the password"
 *
 * Prints one `scrypt$N$salt$hash` string. Paste it into the account's
 * `password` field. The password itself is never written anywhere by this
 * script, so pass it in quotes and clear your shell history afterwards.
 */

import { randomBytes, scryptSync } from "node:crypto";

const N = 16384;
const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "the password"');
  process.exit(1);
}

if (password.length < 10) {
  console.error("Use at least 10 characters. These accounts are handed out, not chosen.");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64, { N, r: 8, p: 1, maxmem: 128 * N * 8 * 2 });

console.log(`scrypt$${N}$${salt.toString("base64url")}$${hash.toString("base64url")}`);
