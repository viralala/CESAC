/**
 * The Drive scope, alone in a module with no server-only import.
 *
 * Two things have to agree on this string: the server client that makes the
 * calls, and scripts/google-oauth.ts, which asks for it at the consent screen.
 * A refresh token carries the scopes it was granted, so a disagreement between
 * the two does not fail at consent time, when somebody is watching. It fails
 * on the first upload weeks later, as a 403 that reads like a folder
 * permissions problem. One constant, read from both places, instead.
 *
 * It cannot live in client.ts because that file imports server-only, which
 * throws the moment a plain Node script requires it.
 *
 * Drive, and not drive.file: drive.file would only expose what the app created
 * itself, and this has to find the parent folder that a human made in the
 * browser.
 */
export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
