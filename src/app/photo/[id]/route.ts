import { DriveError, downloadPhoto, driveCredentials, ensureFolder } from "@/lib/drive/client";
import { PHOTO_EDGE, PHOTO_FOLDER } from "@/lib/photos";

/**
 * A profile photo, served from this site.
 *
 * Photos live on Google Drive (see src/lib/photos.ts). Google's public image
 * host for a shared Drive file works, but not reliably: tested on
 * 26 September 2026 it answered one request in five after ninety seconds
 * with a 500, and others after five. A face that loads most of the time is a
 * board full of initials some of the time. So the page asks for /photo/<id>
 * and this reads the file through the Drive API instead, which is the
 * supported way in, and falls back to the public host only if the saved Drive
 * authorisation has lapsed, so a lapse degrades to slower photos rather than
 * missing ones.
 *
 * A photo's id never points at different bytes (a new photo is a new file),
 * so the answer is cached at the edge for a year and the Drive API is asked
 * about each photo roughly once. The session proxy skips this path, because a
 * refreshed cookie on the response would stop the edge from keeping it.
 */

const ID = /^[\w-]{10,200}$/;
const YEAR = 60 * 60 * 24 * 365;

let folderId: string | null = null;

function image(bytes: ArrayBuffer, type: string): Response {
  return new Response(bytes, {
    headers: {
      "content-type": type,
      "cache-control": `public, max-age=${YEAR}, s-maxage=${YEAR}, immutable`,
      "x-content-type-options": "nosniff",
    },
  });
}

function missing(): Response {
  return new Response("No such photo.", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function GET(_request: Request, ctx: RouteContext<"/photo/[id]">) {
  const { id } = await ctx.params;
  if (!ID.test(id)) return missing();

  const creds = driveCredentials();
  if (creds) {
    try {
      folderId ??= await ensureFolder(creds, PHOTO_FOLDER);
      const photo = await downloadPhoto(creds, id, folderId);
      // Readable, and not a profile photo: refused, and never retried through
      // the public host, which would serve any shared image by id.
      if (!photo) return missing();
      return image(photo.bytes, photo.mimeType);
    } catch (error) {
      // Drive answered, and the file is not there. The public host would not
      // have it either, and asking would make this a proxy for any shared id.
      if (error instanceof DriveError && error.detail.includes("notFound")) return missing();
      console.error("photo route: Drive API failed, trying the public host", error);
    }
  }

  // The fallback. Only reached when the Drive API itself could not answer.
  try {
    const response = await fetch(`https://lh3.googleusercontent.com/d/${id}=w${PHOTO_EDGE}`, {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const type = response.headers.get("content-type") ?? "";
    if (response.ok && /^image\/(jpeg|png|webp)$/.test(type)) {
      return image(await response.arrayBuffer(), type);
    }
  } catch {
    // Timed out or refused. Nothing more to try.
  }

  return new Response("That photo could not be loaded just now.", {
    status: 502,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
