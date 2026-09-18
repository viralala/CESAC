import "server-only";

/**
 * A small Google Drive client, built on the REST API directly.
 *
 * The official googleapis package is tens of megabytes and carries every
 * Google service there is, to make four calls: get a token, find a folder,
 * make a folder, upload a file. A refresh token grant is one form post, so
 * this project does that instead and adds no dependency.
 *
 * Authentication is OAuth2 as a **real user**, not a service account.
 *
 * A service account owns no storage of its own and cannot own a file, so
 * uploading into a folder in somebody's My Drive fails with
 * `storageQuotaExceeded` however much room that person has left. The only way
 * to spend a personal account's storage is to act as that person, which is
 * what a refresh token issued to them does: every file created here is owned
 * by, and billed to, the Google account that granted consent.
 *
 * Everything here is server only. The client secret and the refresh token
 * never reach the browser, and no Drive call is ever made from it.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://www.googleapis.com/drive/v3";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";
const FOLDER_MIME = "application/vnd.google-apps.folder";

/*
 * There is no scope constant here. A refresh token grant does not take one:
 * the scopes were fixed when consent was given, and asking for them again at
 * this end would change nothing. The scope that matters lives in ./scope.ts,
 * where scripts/google-oauth.ts can read it too.
 */

export type DriveCredentials = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  parentFolderId: string;
};

/**
 * The credentials, however they were supplied.
 *
 * Google hands out two JSON files in this flow, credentials.json from the
 * Cloud console and token.json from the consent run, so pasting either one
 * whole is accepted: that is the path of least transcription error. The split
 * form is accepted too, and read first, because three short variables are
 * easier to manage in a hosting dashboard than two blobs.
 */
export function driveCredentials(): DriveCredentials | null {
  const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID?.trim();
  if (!parentFolderId) return null;

  const client = oauthClient();
  if (!client) return null;

  const refreshToken = oauthRefreshToken();
  if (!refreshToken) return null;

  return { ...client, refreshToken, parentFolderId };
}

/** Strips the wrapping quotes a dashboard or a shell leaves behind. */
function unquote(value: string): string {
  return value.trim().replace(/^["']|["']$/g, "");
}

/**
 * The OAuth client, from the split variables or from credentials.json.
 *
 * The console gives that file an `installed` key for a desktop client and a
 * `web` key for a web one. Both are read, because which button somebody
 * pressed in the console is not something this code should care about.
 */
function oauthClient(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (clientId && clientSecret) {
    return { clientId: unquote(clientId), clientSecret: unquote(clientSecret) };
  }

  const blob = process.env.GOOGLE_OAUTH_CREDENTIALS_JSON?.trim();
  if (!blob) return null;

  try {
    const parsed = JSON.parse(blob) as {
      installed?: { client_id?: string; client_secret?: string };
      web?: { client_id?: string; client_secret?: string };
      client_id?: string;
      client_secret?: string;
    };
    const inner = parsed.installed ?? parsed.web ?? parsed;
    if (inner.client_id && inner.client_secret) {
      return { clientId: inner.client_id, clientSecret: inner.client_secret };
    }
  } catch {
    // Unparseable. Fall through and report as unconfigured, which the console
    // already renders as "not switched on yet" rather than as a failure.
  }

  return null;
}

/** The refresh token, bare or inside a pasted token.json. */
function oauthRefreshToken(): string | null {
  const bare = process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim();
  if (bare) return unquote(bare);

  const blob = process.env.GOOGLE_OAUTH_TOKEN_JSON?.trim();
  if (!blob) return null;

  try {
    const parsed = JSON.parse(blob) as { refresh_token?: string };
    if (parsed.refresh_token) return parsed.refresh_token;
  } catch {
    // As above.
  }

  return null;
}

export function driveConfigured(): boolean {
  return driveCredentials() !== null;
}

// ---------------------------------------------------------------------------
// Access tokens
// ---------------------------------------------------------------------------

/**
 * Keyed on the refresh token, so changing the credentials in the environment
 * cannot leave a token minted for the old account sitting in the cache.
 */
let cached: { key: string; token: string; expiresAt: number } | null = null;

/**
 * A user access token, reused until it is nearly expired.
 *
 * The refresh token is the long-lived half and never leaves the server. It is
 * traded for a one hour access token here, which is what every Drive call
 * below actually carries. Nobody has to be signed in to the site for this to
 * work: consent was given once, by an organiser, on a laptop.
 */
async function accessToken(creds: DriveCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  // A minute of headroom, so a token cannot expire between here and the call.
  if (cached && cached.key === creds.refreshToken && cached.expiresAt > now + 60) {
    return cached.token;
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: creds.refreshToken,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();

    /*
     * The failure this flow actually has, and the one a service account never
     * did: a refresh token can stop working while the configuration stays
     * perfectly valid. Google revokes it when the account's password changes,
     * when the user removes the app from their account, after six months
     * unused, and, the one that catches people out, seven days after it was
     * issued if the OAuth consent screen is still in Testing rather than
     * published. The fix is always the same, so the message says it.
     */
    if (body.includes("invalid_grant")) {
      throw new DriveError(
        "Google has stopped accepting the saved Drive authorisation. An organiser has to run the consent step again (npx tsx scripts/google-oauth.ts) and update GOOGLE_OAUTH_REFRESH_TOKEN. See the Google Drive section of the README.",
        body,
      );
    }

    if (body.includes("invalid_client") || body.includes("unauthorized_client")) {
      throw new DriveError(
        "Google refused the OAuth client. Check GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET against the credentials in the Cloud console.",
        body,
      );
    }

    throw new DriveError(
      `Google refused the Drive credentials (${response.status}). Check the OAuth client and the refresh token.`,
      body,
    );
  }

  const token = (await response.json()) as { access_token: string; expires_in: number };
  cached = {
    key: creds.refreshToken,
    token: token.access_token,
    expiresAt: now + token.expires_in,
  };
  return token.access_token;
}

/** Carries the raw Google response, for the server log, never for the browser. */
export class DriveError extends Error {
  readonly detail: string;

  constructor(message: string, detail = "") {
    super(message);
    this.name = "DriveError";
    this.detail = detail;
  }
}

async function call<T>(
  creds: DriveCredentials,
  url: string,
  init: RequestInit = {},
): Promise<T> {
  let response = await fetch(url, {
    ...init,
    headers: { ...init.headers, authorization: `Bearer ${await accessToken(creds)}` },
    cache: "no-store",
  });

  /*
   * One retry, on one condition.
   *
   * The cached token is dropped and a fresh one minted if Google says the
   * current one is no good. That happens for reasons the expiry clock does not
   * predict: a token revoked early, or a deployment resumed after long enough
   * that the cached copy is stale in a way the arithmetic missed. Only 401 is
   * retried, and only once, so a genuine permissions problem still fails fast.
   */
  if (response.status === 401) {
    cached = null;
    response = await fetch(url, {
      ...init,
      headers: { ...init.headers, authorization: `Bearer ${await accessToken(creds)}` },
      cache: "no-store",
    });
  }

  if (!response.ok) {
    const body = await response.text();

    /*
     * Under a service account this meant the parent folder was in a personal
     * My Drive, which was a configuration mistake. Authenticating as a user
     * makes that the normal case, so the same error now means what it says:
     * that account's Drive is actually full. Say that, rather than sending
     * anyone back to a shared-drive instruction that no longer applies.
     */
    if (body.includes("storageQuotaExceeded") || body.includes("do not have storage quota")) {
      throw new DriveError(
        "The Google account these uploads go to has run out of Drive storage. An organiser has to free some space or add more.",
        body,
      );
    }

    /*
     * The second failure worth naming precisely.
     *
     * Creating OAuth credentials and consenting to them does not switch the
     * Drive API on for the project they belong to. The authorisation is then
     * perfectly good, the token endpoint hands back a token, and every actual
     * Drive call comes back 403, which reads exactly like a permissions
     * problem on the folder and sends people off re-sharing it. It is one
     * switch in the Cloud console instead.
     */
    if (body.includes("accessNotConfigured") || body.includes("SERVICE_DISABLED")) {
      throw new DriveError(
        "The Google Drive API is switched off in the Google Cloud project the OAuth client belongs to. An organiser has to turn it on in the Cloud console. Nothing you did caused this.",
        body,
      );
    }

    /*
     * Scope, not ownership. A refresh token carries the scopes it was granted,
     * so consenting to a narrower one leaves everything looking correct until
     * the first write.
     */
    if (body.includes("insufficientPermissions") || body.includes("insufficientScopes")) {
      throw new DriveError(
        "The saved Drive authorisation does not cover writing files. An organiser has to run the consent step again and grant full Drive access.",
        body,
      );
    }

    if (response.status === 404) {
      throw new DriveError(
        "The certificates folder was not found. Check GOOGLE_DRIVE_PARENT_FOLDER_ID, and that the folder belongs to, or is shared with, the Google account that granted access.",
        body,
      );
    }

    if (response.status === 403) {
      throw new DriveError(
        "Google refused the request. The authorised account probably does not have write access to the certificates folder.",
        body,
      );
    }

    throw new DriveError(`Google Drive returned ${response.status}.`, body);
  }

  return (await response.json()) as T;
}

/** Single quotes and backslashes are the only things that can break a q clause. */
function quote(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/*
 * Every call opts into shared drive support. Uploads go to a My Drive folder
 * now, which does not need these, but they cost nothing and mean a parent
 * folder moved into a shared drive later keeps working rather than reading as
 * missing.
 */
const ALL_DRIVES = "supportsAllDrives=true&includeItemsFromAllDrives=true";

type DriveFile = { id: string; name?: string; webViewLink?: string };

/**
 * The student's own folder, made on their first upload and found thereafter.
 *
 * Named by email because that is the one thing about a student that is unique,
 * stable and already the key everywhere else in this schema. Two people called
 * Vedant Chavan would otherwise share a folder.
 */
export async function ensureStudentFolder(
  creds: DriveCredentials,
  email: string,
): Promise<string> {
  const q = [
    `name = '${quote(email)}'`,
    `mimeType = '${FOLDER_MIME}'`,
    `'${quote(creds.parentFolderId)}' in parents`,
    "trashed = false",
  ].join(" and ");

  const found = await call<{ files: DriveFile[] }>(
    creds,
    `${API}/files?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1&corpora=allDrives&${ALL_DRIVES}`,
  );

  if (found.files?.[0]?.id) return found.files[0].id;

  const created = await call<DriveFile>(creds, `${API}/files?fields=id&${ALL_DRIVES}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: email,
      mimeType: FOLDER_MIME,
      parents: [creds.parentFolderId],
    }),
  });

  return created.id;
}

export type UploadedFile = { id: string; link: string };

/**
 * Upload, in one multipart request.
 *
 * A resumable upload would be the right call for large files, but nothing here
 * is allowed past ten megabytes, so a single request is simpler and one round
 * trip faster.
 */
export async function uploadToFolder(
  creds: DriveCredentials,
  folderId: string,
  file: { name: string; mimeType: string; bytes: Uint8Array },
): Promise<UploadedFile> {
  const boundary = `cesac-${crypto.randomUUID()}`;
  const metadata = JSON.stringify({ name: file.name, parents: [folderId] });

  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\n` +
        "content-type: application/json; charset=UTF-8\r\n\r\n" +
        `${metadata}\r\n` +
        `--${boundary}\r\n` +
        `content-type: ${file.mimeType}\r\n\r\n`,
    ),
    Buffer.from(file.bytes),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const uploaded = await call<DriveFile>(
    creds,
    `${UPLOAD_API}/files?uploadType=multipart&fields=id,webViewLink&${ALL_DRIVES}`,
    {
      method: "POST",
      headers: { "content-type": `multipart/related; boundary=${boundary}` },
      body: new Uint8Array(body),
    },
  );

  return {
    id: uploaded.id,
    // webViewLink is normally returned; the canonical form is a safe fallback.
    link: uploaded.webViewLink ?? `https://drive.google.com/file/d/${uploaded.id}/view`,
  };
}
