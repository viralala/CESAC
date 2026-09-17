import "server-only";

import { createSign } from "node:crypto";

/**
 * A small Google Drive client, built on the REST API directly.
 *
 * The official googleapis package is tens of megabytes and carries every
 * Google service there is, to make four calls: get a token, find a folder,
 * make a folder, upload a file. Signing the assertion is twenty lines with
 * node:crypto, so this project does that instead and adds no dependency.
 *
 * Everything here is server only. The private key never reaches the browser,
 * and no Drive call is ever made from it.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://www.googleapis.com/drive/v3";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";
const FOLDER_MIME = "application/vnd.google-apps.folder";

/**
 * Drive, not drive.file.
 *
 * drive.file would only let the service account see what it created itself,
 * which is not enough: it has to find the parent folder that a human made and
 * shared with it.
 */
const SCOPE = "https://www.googleapis.com/auth/drive";

export type DriveCredentials = {
  clientEmail: string;
  privateKey: string;
  parentFolderId: string;
};

/**
 * The credentials, however they were supplied.
 *
 * Google hands out a JSON key file, so pasting the whole thing into one
 * variable is the path of least resistance and least transcription error.
 * The split form is accepted too because some hosts make a single enormous
 * value awkward to manage.
 */
export function driveCredentials(): DriveCredentials | null {
  const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID?.trim();
  if (!parentFolderId) return null;

  const blob = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (blob) {
    try {
      const parsed = JSON.parse(blob) as { client_email?: string; private_key?: string };
      if (parsed.client_email && parsed.private_key) {
        return {
          clientEmail: parsed.client_email,
          privateKey: normaliseKey(parsed.private_key),
          parentFolderId,
        };
      }
    } catch {
      // Fall through to the split form and let the missing-config path report.
    }
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (clientEmail && privateKey) {
    return { clientEmail, privateKey: normaliseKey(privateKey), parentFolderId };
  }

  return null;
}

/**
 * A PEM key that has been through an environment variable.
 *
 * Most dashboards cannot hold a real newline, so the key arrives with literal
 * backslash-n in it and, if someone quoted it on the way in, wrapped in quotes
 * as well. Both are undone here rather than in the setup instructions, because
 * the failure they cause is an opaque signing error an hour later.
 */
function normaliseKey(key: string): string {
  return key
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n");
}

export function driveConfigured(): boolean {
  return driveCredentials() !== null;
}

// ---------------------------------------------------------------------------
// Access tokens
// ---------------------------------------------------------------------------

let cached: { token: string; expiresAt: number } | null = null;

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * A service account access token, reused until it is nearly expired.
 *
 * The assertion is a JWT signed with the account's own private key, which is
 * the whole of the authentication: there is no user, no consent screen and no
 * refresh token, which is exactly why uploads keep working when nobody is
 * signed in to anything.
 */
async function accessToken(creds: DriveCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  // A minute of headroom, so a token cannot expire between here and the call.
  if (cached && cached.expiresAt > now + 60) return cached.token;

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: creds.clientEmail,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );

  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = base64url(signer.sign(creds.privateKey));
  const assertion = `${header}.${claims}.${signature}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new DriveError(
      `Google refused the service account credentials (${response.status}). Check the client email and private key.`,
      await response.text(),
    );
  }

  const token = (await response.json()) as { access_token: string; expires_in: number };
  cached = { token: token.access_token, expiresAt: now + token.expires_in };
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
  const token = await accessToken(creds);
  const response = await fetch(url, {
    ...init,
    headers: { ...init.headers, authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();

    /*
     * The one failure worth naming precisely.
     *
     * A service account owns no storage at all, so a file it creates has to
     * belong to something else. Inside a shared drive it does, and the upload
     * works. Inside a folder in somebody's My Drive it does not, and Google
     * rejects it with this, however much room that person has left. The
     * message says so, because the obvious reading of the error is that the
     * department has run out of space, and that sends people off buying
     * storage that will not fix it.
     */
    if (body.includes("storageQuotaExceeded") || body.includes("do not have storage quota")) {
      throw new DriveError(
        "Uploads are going to a folder in a personal My Drive. A service account owns no storage, so the parent folder has to live in a shared drive. See the Google Drive section of the README.",
        body,
      );
    }

    if (response.status === 404) {
      throw new DriveError(
        "The certificates folder was not found. Check GOOGLE_DRIVE_PARENT_FOLDER_ID, and that the folder is shared with the service account.",
        body,
      );
    }

    if (response.status === 403) {
      throw new DriveError(
        "Google refused the request. The service account probably does not have write access to the certificates folder.",
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
 * Every call opts into shared drive support. Without these two, a shared drive
 * is invisible to the API and the parent folder reads as missing.
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
