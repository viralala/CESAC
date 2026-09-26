import { SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Where the site's photographs come from, and how a stored value becomes an
 * address an <Image> can load.
 *
 * Two sources, and neither is the visitor's browser talking to a third party:
 * every photo goes through next/image, so it is the server that fetches the
 * original and the page that serves the copy. That keeps the privacy page's
 * claim true that a page load makes no request anywhere but this site.
 *
 *   - A student's own photo, uploaded at /account/photo. Since 26 September
 *     2026 it goes to Google Drive, into the "Profile photos" folder beside
 *     the certificate folders, and the profile stores `drive:<file id>`. It
 *     is also shared "anyone with the link", so the /photo route has a
 *     fallback if the Drive authorisation lapses. Supabase Storage has a hard quota on
 *     the free plan and Drive does not. A profile can still hold a path in
 *     the old public `avatars` bucket, for a photo saved while Drive was
 *     unreachable, and both forms resolve here.
 *   - A committee member's portrait on the roster, which the committee gave
 *     as a Google Drive share link. Drive's viewer page is not an image, so
 *     the file id is lifted out and pointed at Google's image host. That only
 *     loads if the file is shared as "anyone with the link"; the avatar falls
 *     back to the account photo, then to initials, when it does not.
 *
 * Both hosts are allowed in next.config.ts under `images.remotePatterns`, by
 * path, so nobody can use this site's optimiser to fetch anything else.
 */

export const AVATAR_BUCKET = "avatars";

/** How a profile marks a photo that lives on Drive: `drive:<file id>`. */
export const DRIVE_PHOTO_PREFIX = "drive:";

/** The Drive folder, directly under the records parent, that holds every photo. */
export const PHOTO_FOLDER = "Profile photos";

/** The Drive file id inside a stored photo value, or null for a bucket path. */
export function drivePhotoId(path: string | null | undefined): string | null {
  if (!path?.startsWith(DRIVE_PHOTO_PREFIX)) return null;
  const id = path.slice(DRIVE_PHOTO_PREFIX.length);
  return /^[\w-]{10,200}$/.test(id) ? id : null;
}

/** The largest photo the upload accepts, after the browser has shrunk it. */
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

/** The square the browser crops a photo to before it is sent. */
export const PHOTO_EDGE = 640;

const AVATAR_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${AVATAR_BUCKET}/`;

/**
 * The address a stored photo loads from, or null.
 *
 * A Drive photo goes to this site's own /photo route, which reads it through
 * the Drive API and is cached at the edge (src/app/photo/[id]/route.ts).
 * Google's public image host was tried first and was too unreliable. A bucket
 * path goes to the public bucket as before.
 */
export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  if (path.startsWith(DRIVE_PHOTO_PREFIX)) {
    const id = drivePhotoId(path);
    return id ? `/photo/${id}` : null;
  }

  return AVATAR_PREFIX + path.split("/").map(encodeURIComponent).join("/");
}

/**
 * A Drive share link, as an image address.
 *
 * Accepts the shapes people actually paste: /file/d/<id>/view, open?id=<id>,
 * uc?id=<id>, and an lh3 address that is already right. A folder link is not
 * a photo, so it comes back null rather than as a guess.
 */
export function driveImage(link: string | null | undefined): string | null {
  if (!link) return null;
  const s = link.trim();

  if (/^https:\/\/lh3\.googleusercontent\.com\/d\/[\w-]+/.test(s)) return s;

  const id =
    s.match(/drive\.google\.com\/file\/d\/([\w-]{10,})/)?.[1] ??
    s.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([\w-]{10,})/)?.[1];

  return id ? `https://lh3.googleusercontent.com/d/${id}=w800` : null;
}

/** Up to two initials, for the avatar that has no photo to show. */
export function initials(name: string): string {
  const words = name
    .replace(/^(dr|prof|mr|ms|mrs)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}
