/**
 * One-off Google Drive consent.
 *
 *   npx tsx scripts/google-oauth.ts
 *   npx tsx scripts/google-oauth.ts --credentials ./credentials.json
 *   npx tsx scripts/google-oauth.ts --port 53682
 *
 * Deliberately a local script and not a route.
 *
 * Certificate uploads authenticate as a real Google account rather than as a
 * service account, because a service account owns no storage and cannot put a
 * file in anybody's My Drive. Acting as a user needs that user to sit in front
 * of a consent screen once, which is this script: it opens the screen, catches
 * the code Google sends back to a loopback port, and trades it for a refresh
 * token. The refresh token then goes in .env.local and in Vercel, and the
 * running site uses it forever without anyone signing in again.
 *
 * Run it as the account whose Drive the certificates should live in. Whoever
 * clicks Allow is the account that ends up owning every uploaded file and
 * paying for it out of their storage.
 *
 * The refresh token it prints is a password to that account's whole Drive.
 * It is written to token.json, which is gitignored, and should be pasted into
 * the two places that need it and nowhere else.
 */

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { DRIVE_SCOPE } from "../src/lib/drive/scope";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

const TOKEN_FILE = resolve(process.cwd(), "token.json");

/**
 * A fixed port, not an arbitrary one.
 *
 * A desktop OAuth client accepts any loopback port, so this could be zero and
 * let the OS pick. A web client accepts only redirect URIs registered by hand
 * in the console, and a port that changes every run cannot be registered. One
 * predictable number works for both, and is what the README says to paste.
 */
const DEFAULT_PORT = 53682;

/** Five minutes at a consent screen is generous. */
const TIMEOUT_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

/**
 * .env.local, parsed here rather than relying on a loader flag, so the script
 * runs the same way on every Node version anyone on the committee has.
 */
function loadEnvLocal(): void {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const value = m[2].replace(/^(['"])(.*)\1$/, "$2");
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
}

function flag(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1];
  const inline = process.argv.find((a) => a.startsWith(`--${name}=`));
  return inline ? inline.slice(name.length + 3) : null;
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

const bold = (s: string) => `[1m${s}[0m`;
const dim = (s: string) => `[2m${s}[0m`;
const red = (s: string) => `[31m${s}[0m`;
const green = (s: string) => `[32m${s}[0m`;
const yellow = (s: string) => `[33m${s}[0m`;

function rule(label = ""): void {
  const line = "-".repeat(Math.max(0, 74 - label.length));
  console.log(dim(label ? `-- ${label} ${line}` : `--${line}--`));
}

function die(message: string, hint = ""): never {
  console.log();
  console.log(red(`  ${message}`));
  if (hint) console.log(dim(`  ${hint}`));
  console.log();
  process.exit(1);
}

// ---------------------------------------------------------------------------
// The OAuth client
// ---------------------------------------------------------------------------

type OAuthClient = { clientId: string; clientSecret: string };

/** The `installed` and `web` shapes the Cloud console downloads. */
function parseCredentialsJson(text: string, source: string): OAuthClient {
  let parsed: {
    installed?: { client_id?: string; client_secret?: string };
    web?: { client_id?: string; client_secret?: string };
  };

  try {
    parsed = JSON.parse(text);
  } catch {
    die(`${source} is not valid JSON.`);
  }

  const inner = parsed.installed ?? parsed.web;
  if (!inner?.client_id || !inner.client_secret) {
    die(
      `${source} has no client_id and client_secret in it.`,
      "Download it again from APIs & Services -> Credentials -> the OAuth client -> Download JSON.",
    );
  }

  return { clientId: inner.client_id, clientSecret: inner.client_secret };
}

/**
 * Whichever way the credentials were supplied, in the order that puts the most
 * explicit one first: a file named on the command line, then the split
 * variables, then a pasted blob, then credentials.json sitting in the project.
 */
function oauthClient(): OAuthClient {
  const named = flag("credentials");
  if (named) {
    const path = resolve(process.cwd(), named);
    if (!existsSync(path)) die(`No file at ${path}.`);
    return parseCredentialsJson(readFileSync(path, "utf8"), named);
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (clientId && clientSecret) return { clientId, clientSecret };

  const blob = process.env.GOOGLE_OAUTH_CREDENTIALS_JSON?.trim();
  if (blob) return parseCredentialsJson(blob, "GOOGLE_OAUTH_CREDENTIALS_JSON");

  const fallback = resolve(process.cwd(), "credentials.json");
  if (existsSync(fallback)) {
    return parseCredentialsJson(readFileSync(fallback, "utf8"), "credentials.json");
  }

  die(
    "No OAuth client to work with.",
    "Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in .env.local, or put the\n  downloaded credentials.json in this folder. The README walks through making one\n  under \"Certificates and Google Drive\".",
  );
}

// ---------------------------------------------------------------------------
// PKCE
// ---------------------------------------------------------------------------

function base64url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Proof key for code exchange.
 *
 * The client secret of an installed app is not really a secret, so Google asks
 * installed clients to prove that whoever redeems the code is whoever asked
 * for it. A random verifier is kept here, its hash is sent to the consent
 * screen, and the verifier goes up with the exchange. It costs four lines.
 */
function pkce(): { verifier: string; challenge: string } {
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

// ---------------------------------------------------------------------------
// The consent round trip
// ---------------------------------------------------------------------------

/** What the browser tab shows once it has handed the code over. */
function closingPage(heading: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>CESAC</title>
<style>
  body { margin:0; min-height:100vh; display:grid; place-items:center;
         background:#0d0b08; color:#f2e9d8;
         font:16px/1.6 ui-serif, Georgia, serif; text-align:center; }
  div { max-width:34rem; padding:2rem; }
  h1 { font-size:1.4rem; margin:0 0 .75rem; letter-spacing:.02em; }
  p { margin:0; color:#bfae91; }
</style></head>
<body><div><h1>${heading}</h1><p>${body}</p></div></body></html>`;
}

/** Opens the consent screen without making a fuss if it cannot. */
function openBrowser(url: string): void {
  const [cmd, args] =
    process.platform === "win32"
      ? ["cmd", ["/c", "start", "", url]]
      : process.platform === "darwin"
        ? ["open", [url]]
        : ["xdg-open", [url]];
  try {
    spawn(cmd, args, { detached: true, stdio: "ignore" }).unref();
  } catch {
    // The URL is printed either way, so this is a convenience and not a step.
  }
}

/**
 * Waits on the loopback port for Google to come back with a code.
 *
 * The server answers exactly one request that carries a code or an error and
 * ignores everything else, because a browser will ask for /favicon.ico in the
 * middle of this and that must not be mistaken for the callback.
 */
function waitForCode(port: number, state: string): Promise<string> {
  return new Promise((settle, fail) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (!code && !error) {
        res.writeHead(404).end();
        return;
      }

      const finish = (status: number, page: string, done: () => void) => {
        res.writeHead(status, { "content-type": "text/html; charset=utf-8" }).end(page);
        server.close(done);
      };

      if (error) {
        finish(400, closingPage("Access was not granted", "Nothing has changed. You can close this tab."), () =>
          fail(new Error(`Google returned "${error}".`)),
        );
        return;
      }

      // A forged callback cannot redeem anything without the verifier, but
      // checking state is one line and keeps the tab that started this the
      // only tab that can finish it.
      if (url.searchParams.get("state") !== state) {
        finish(400, closingPage("That did not come from here", "You can close this tab and run the script again."), () =>
          fail(new Error("The state parameter did not match.")),
        );
        return;
      }

      finish(200, closingPage("Drive access granted", "You can close this tab and go back to the terminal."), () =>
        settle(code as string),
      );
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
      fail(
        err.code === "EADDRINUSE"
          ? new Error(`Port ${port} is already in use. Run again with --port <number>.`)
          : err,
      );
    });

    const timer = setTimeout(() => {
      server.close();
      fail(new Error("Timed out waiting for the consent screen."));
    }, TIMEOUT_MS);
    timer.unref();

    server.listen(port, "127.0.0.1");
  });
}

type Tokens = { access_token: string; refresh_token?: string; expires_in: number; scope: string };

async function exchange(
  client: OAuthClient,
  code: string,
  verifier: string,
  redirectUri: string,
): Promise<Tokens> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier: verifier,
      client_id: client.clientId,
      client_secret: client.clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    die(`Google refused the code exchange (${response.status}).`, text);
  }

  return JSON.parse(text) as Tokens;
}

// ---------------------------------------------------------------------------
// Proving it works
// ---------------------------------------------------------------------------

/**
 * Who this token belongs to, and how much room they have.
 *
 * Worth one extra call. The whole point of the change is whose storage gets
 * spent, so seeing the address on screen before anything is pasted anywhere
 * catches the commonest mistake of all: consenting as the wrong account
 * because that was the one already signed in to the browser.
 */
async function whoami(accessToken: string): Promise<void> {
  const response = await fetch(
    "https://www.googleapis.com/drive/v3/about?fields=user(emailAddress),storageQuota(limit,usage)",
    { headers: { authorization: `Bearer ${accessToken}` } },
  );

  if (!response.ok) {
    const body = await response.text();
    console.log(yellow("  Could not read the account back:"));
    console.log(dim(`  ${body.slice(0, 300)}`));
    if (body.includes("accessNotConfigured") || body.includes("SERVICE_DISABLED")) {
      console.log(
        yellow("  The Drive API is not switched on for this Cloud project. The token is fine;"),
      );
      console.log(yellow("  turn the API on and uploads will start working."));
    }
    return;
  }

  const about = (await response.json()) as {
    user?: { emailAddress?: string };
    storageQuota?: { limit?: string; usage?: string };
  };

  const gb = (bytes?: string) =>
    bytes ? `${(Number(bytes) / 1024 ** 3).toFixed(1)}GB` : "unlimited";

  console.log(`  Authorised as ${bold(about.user?.emailAddress ?? "an unknown account")}`);
  console.log(
    dim(`  Drive in use: ${gb(about.storageQuota?.usage)} of ${gb(about.storageQuota?.limit)}`),
  );
}

/** That the folder in the configuration is one this account can actually see. */
async function checkParentFolder(accessToken: string): Promise<void> {
  const id = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID?.trim();
  if (!id) {
    console.log(dim("  GOOGLE_DRIVE_PARENT_FOLDER_ID is not set yet, so the folder was not checked."));
    return;
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=name,mimeType&supportsAllDrives=true`,
    { headers: { authorization: `Bearer ${accessToken}` } },
  );

  if (!response.ok) {
    console.log(yellow(`  The parent folder ${id} could not be opened by this account.`));
    console.log(dim("  Check GOOGLE_DRIVE_PARENT_FOLDER_ID, or share the folder with it."));
    return;
  }

  const folder = (await response.json()) as { name?: string; mimeType?: string };
  if (folder.mimeType !== "application/vnd.google-apps.folder") {
    console.log(yellow(`  ${id} is not a folder. Check GOOGLE_DRIVE_PARENT_FOLDER_ID.`));
    return;
  }

  console.log(`  Parent folder: ${bold(folder.name ?? id)}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  loadEnvLocal();

  const client = oauthClient();
  const port = Number(flag("port") ?? DEFAULT_PORT);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    die(`--port ${flag("port")} is not a usable port number.`);
  }

  const redirectUri = `http://localhost:${port}`;
  const { verifier, challenge } = pkce();
  const state = randomUUID();

  const authUrl = `${AUTH_URL}?${new URLSearchParams({
    client_id: client.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: DRIVE_SCOPE,
    // Without offline there is no refresh token at all, and without the
    // forced consent Google quietly omits it on every run after the first,
    // which looks like the script is broken.
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  })}`;

  console.log();
  console.log(bold("CESAC Google Drive consent"));
  console.log(
    dim("  Sign in as the account whose Drive the certificates should live in."),
  );
  console.log(dim("  Whoever grants this owns every uploaded file and pays the storage."));
  console.log();
  rule("consent");
  console.log("  Opening your browser. If nothing happens, paste this in yourself:");
  console.log();
  console.log(dim(`  ${authUrl}`));
  console.log();

  openBrowser(authUrl);

  let code: string;
  try {
    code = await waitForCode(port, state);
  } catch (error) {
    die(error instanceof Error ? error.message : String(error));
  }

  const tokens = await exchange(client, code, verifier, redirectUri);

  if (!tokens.refresh_token) {
    die(
      "Google returned an access token but no refresh token.",
      "That happens when consent was remembered from a previous run. Remove the app at\n  https://myaccount.google.com/permissions and run this again.",
    );
  }

  console.log();
  rule("account");
  await whoami(tokens.access_token);
  await checkParentFolder(tokens.access_token);

  if (!tokens.scope.includes(DRIVE_SCOPE)) {
    console.log();
    console.log(yellow(`  Warning: the granted scope is "${tokens.scope}".`));
    console.log(yellow("  Uploads need full Drive access. Run again and leave the tick box on."));
  }

  // The file is for the operator's own records and for pasting from. Nothing
  // on the server reads it: Vercel has no filesystem to keep it on, so the
  // deployment takes the refresh token as an environment variable instead.
  writeFileSync(
    TOKEN_FILE,
    `${JSON.stringify(
      {
        client_id: client.clientId,
        client_secret: client.clientSecret,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        obtained_at: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    { mode: 0o600 },
  );

  console.log();
  rule("set these");
  console.log(dim("  In .env.local, and in the Vercel project settings:"));
  console.log();
  console.log(`  GOOGLE_OAUTH_CLIENT_ID="${client.clientId}"`);
  console.log(`  GOOGLE_OAUTH_CLIENT_SECRET="${client.clientSecret}"`);
  console.log(`  GOOGLE_OAUTH_REFRESH_TOKEN="${tokens.refresh_token}"`);
  console.log();
  console.log(dim(`  Also written to token.json, which is gitignored.`));
  console.log();
  console.log(
    yellow("  If the OAuth consent screen is still in Testing, this token stops working"),
  );
  console.log(
    yellow("  in seven days. Publish the app in the Cloud console to keep it alive."),
  );
  console.log();
  console.log(green("  Done."));
  console.log();
}

main().catch((error) => {
  console.error(red(`\n  ${error instanceof Error ? error.message : String(error)}\n`));
  process.exit(1);
});
