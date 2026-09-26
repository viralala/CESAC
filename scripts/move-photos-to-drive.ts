/**
 * Move every profile photo out of Supabase Storage and onto Google Drive.
 *
 *   npx tsx scripts/move-photos-to-drive.ts              # report only, writes nothing
 *   npx tsx scripts/move-photos-to-drive.ts --commit     # actually move them
 *
 * Since 26 September 2026 a new photo goes to Drive, into the "Profile photos"
 * folder under GOOGLE_DRIVE_PARENT_FOLDER_ID, shared "anyone with the link",
 * and the profile stores `drive:<file id>` (see src/lib/photos.ts). This
 * carries the photos saved before that across, so the site reads every face
 * from Drive and the Supabase quota stops mattering.
 *
 * Local, for the same reason as import-students.ts: it needs the service role
 * key to update other people's profiles, and that key belongs on a laptop for
 * the minutes this runs, not in the deployment.
 *
 * HOW IT AVOIDS MISTAKES
 *
 * One photo at a time, and a photo is only switched once it is proven: the
 * file is uploaded, shared, and then fetched back from Google's image host as
 * a signed-out visitor would. Anything short of an image coming back leaves
 * that profile exactly as it was and bins the half-made Drive file.
 *
 * The profile is switched with a compare-and-set on the old path, so a
 * student who changes their photo while this runs keeps the new one.
 *
 * Each Drive file carries the bucket path it came from as an app property, so
 * a run that is stopped halfway and started again reuses what it already
 * uploaded instead of making a second copy.
 *
 * It never deletes the originals in the bucket. They cost a few megabytes and
 * are the only way back if something is found wrong later; remove them from
 * the Supabase dashboard once the site has been checked.
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Database } from "../src/lib/supabase/database.types";

const COMMIT = process.argv.includes("--commit");
const FOLDER = "Profile photos";
const BUCKET = "avatars";
const EDGE = 640;

const dim = (s: string) => `\x1b[2m${s}\x1b[22m`;
const green = (s: string) => `\x1b[32m${s}\x1b[39m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[39m`;
const red = (s: string) => `\x1b[31m${s}\x1b[39m`;

function loadEnv(): void {
  const local = resolve(process.cwd(), ".env.local");
  if (!existsSync(local)) return;
  for (const line of readFileSync(local, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function need(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(red(`\n  ${name} is not set.\n`) + "  Put it in .env.local.\n");
    process.exit(1);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Drive, over REST, the same calls src/lib/drive/client.ts makes. That file
// imports server-only, which throws in a plain Node script.
// ---------------------------------------------------------------------------

const API = "https://www.googleapis.com/drive/v3";
const ALL = "supportsAllDrives=true&includeItemsFromAllDrives=true";

let token = "";

async function authorise(): Promise<void> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: need("GOOGLE_OAUTH_CLIENT_ID"),
      client_secret: need("GOOGLE_OAUTH_CLIENT_SECRET"),
      refresh_token: need("GOOGLE_OAUTH_REFRESH_TOKEN"),
    }),
  });
  if (!response.ok) {
    console.error(red("\n  Google refused the Drive authorisation:\n"), await response.text());
    process.exit(1);
  }
  token = ((await response.json()) as { access_token: string }).access_token;
}

async function drive<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { ...init.headers, authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Drive ${response.status}: ${await response.text()}`);
  return (await response.json()) as T;
}

const q = (s: string) => s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

async function photoFolder(parent: string): Promise<string> {
  const query = [
    `name = '${q(FOLDER)}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    `'${q(parent)}' in parents`,
    "trashed = false",
  ].join(" and ");
  const found = await drive<{ files: { id: string }[] }>(
    `${API}/files?q=${encodeURIComponent(query)}&fields=files(id)&pageSize=1&corpora=allDrives&${ALL}`,
  );
  if (found.files[0]?.id) return found.files[0].id;
  if (!COMMIT) return "(would be created)";

  const made = await drive<{ id: string }>(`${API}/files?fields=id&${ALL}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: FOLDER,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parent],
    }),
  });
  return made.id;
}

/** A file this script uploaded on an earlier run for the same bucket path. */
async function alreadyUploaded(folder: string, source: string): Promise<string | null> {
  const query = [
    `'${q(folder)}' in parents`,
    `appProperties has { key='cesacSource' and value='${q(source)}' }`,
    "trashed = false",
  ].join(" and ");
  const found = await drive<{ files: { id: string }[] }>(
    `${API}/files?q=${encodeURIComponent(query)}&fields=files(id)&pageSize=1&corpora=allDrives&${ALL}`,
  );
  return found.files[0]?.id ?? null;
}

async function upload(
  folder: string,
  name: string,
  source: string,
  mime: string,
  bytes: Uint8Array,
): Promise<string> {
  const boundary = `cesac-${crypto.randomUUID()}`;
  const metadata = JSON.stringify({
    name,
    parents: [folder],
    appProperties: { cesacSource: source },
  });
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
        `--${boundary}\r\ncontent-type: ${mime}\r\n\r\n`,
    ),
    Buffer.from(bytes),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  const made = await drive<{ id: string }>(
    `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id&${ALL}`,
    {
      method: "POST",
      headers: { "content-type": `multipart/related; boundary=${boundary}` },
      body: new Uint8Array(body),
    },
  );
  return made.id;
}

async function share(fileId: string): Promise<void> {
  await drive(`${API}/files/${encodeURIComponent(fileId)}/permissions?${ALL}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role: "reader", type: "anyone", allowFileDiscovery: false }),
  });
}

async function bin(fileId: string): Promise<void> {
  await drive(`${API}/files/${encodeURIComponent(fileId)}?${ALL}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ trashed: true }),
  }).catch(() => undefined);
}

/** Loads the photo the way the site will, signed in to nothing. A few tries. */
async function servesPublicly(fileId: string): Promise<boolean> {
  const url = `https://lh3.googleusercontent.com/d/${fileId}=w${EDGE}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, { redirect: "follow" });
    const type = response.headers.get("content-type") ?? "";
    const size = (await response.arrayBuffer()).byteLength;
    if (response.ok && type.startsWith("image/") && size > 0) return true;
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  return false;
}

function sniff(bytes: Uint8Array): { mime: string; ext: string } | null {
  const at = (offset: number, ...sig: number[]) => sig.every((b, i) => bytes[offset + i] === b);
  if (at(0, 0xff, 0xd8, 0xff)) return { mime: "image/jpeg", ext: "jpg" };
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { mime: "image/png", ext: "png" };
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lgshgaltulbnjqfxjsme.supabase.co";
  const supabase = createClient<Database>(url, need("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
  const parent = need("GOOGLE_DRIVE_PARENT_FOLDER_ID");

  await authorise();
  const folder = await photoFolder(parent);

  const { data: rows, error } = await supabase
    .from("profiles")
    .select("id, email, photo_path")
    .not("photo_path", "is", null)
    .not("photo_path", "like", "drive:%")
    .order("email");
  if (error) throw error;

  console.log(
    `\n  ${rows.length} photos still in the bucket. ${COMMIT ? "Moving them." : dim("Report only; add --commit to move them.")}\n`,
  );

  let moved = 0;
  const failed: string[] = [];
  const skipped: string[] = [];

  for (const row of rows) {
    const source = row.photo_path!;
    const label = row.email.padEnd(40);

    const original = await fetch(
      `${url}/storage/v1/object/public/${BUCKET}/${source.split("/").map(encodeURIComponent).join("/")}`,
    );
    if (!original.ok) {
      failed.push(`${row.email}: the original would not download (${original.status})`);
      console.log(`  ${red("x")} ${label} original missing (${original.status})`);
      continue;
    }
    const bytes = new Uint8Array(await original.arrayBuffer());
    const kind = sniff(bytes);
    if (!kind) {
      failed.push(`${row.email}: the original is not a JPEG, PNG or WebP`);
      console.log(`  ${red("x")} ${label} not an image`);
      continue;
    }

    if (!COMMIT) {
      console.log(`  ${dim("-")} ${label} ${dim(`${(bytes.length / 1024).toFixed(0)} KB ${kind.ext}`)}`);
      continue;
    }

    let fileId: string | null = null;
    let reused = false;
    try {
      fileId = await alreadyUploaded(folder, source);
      reused = fileId !== null;
      if (!fileId) {
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
        fileId = await upload(folder, `${row.email} ${stamp}.${kind.ext}`, source, kind.mime, bytes);
      }
      await share(fileId);

      if (!(await servesPublicly(fileId))) {
        throw new Error("Google's image host would not serve it back");
      }

      const { data: switched, error: switchError } = await supabase
        .from("profiles")
        .update({ photo_path: `drive:${fileId}` })
        .eq("id", row.id)
        .eq("photo_path", source)
        .select("id")
        .maybeSingle();
      if (switchError) throw switchError;

      if (!switched) {
        // They changed their photo while this ran. Theirs wins.
        await bin(fileId);
        skipped.push(`${row.email}: changed their photo mid-run, left alone`);
        console.log(`  ${yellow("~")} ${label} changed mid-run, left alone`);
        continue;
      }

      moved++;
      console.log(`  ${green("+")} ${label} ${dim(fileId)}${reused ? dim(" (reused)") : ""}`);
    } catch (e) {
      if (fileId && !reused) await bin(fileId);
      const message = e instanceof Error ? e.message : String(e);
      failed.push(`${row.email}: ${message.slice(0, 200)}`);
      console.log(`  ${red("x")} ${label} ${message.slice(0, 120)}`);
    }
  }

  console.log(`\n  ${green(`${moved} moved`)}, ${skipped.length} left alone, ${failed.length} failed.`);
  for (const line of [...skipped, ...failed]) console.log(`    ${line}`);
  console.log(dim(`\n  The originals are still in the ${BUCKET} bucket. Nothing was deleted.\n`));
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(red("\n  Stopped:"), e);
  process.exit(1);
});
