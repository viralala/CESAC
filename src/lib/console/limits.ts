/**
 * How large a certificate file may be, in one place.
 *
 * Three separate things have to agree on this number, and when they drift the
 * failure is an ugly one. The browser checks before sending, the server action
 * checks what arrived, and Next.js refuses the request outright before either
 * of those runs. That last one is the trap: a file over the action's body limit
 * never reaches our code at all, so no friendly message is possible and the
 * student is thrown out to the error page with a reference number. That is
 * exactly what happened on 18 September 2026, against the 1MB default.
 *
 * There is a ceiling above this that is not ours to set. A Vercel function
 * refuses any request body over 4.5MB with a 413, whatever Next.js has been
 * told to allow, so nothing here can be raised past that. Accepting bigger
 * files means not sending them through a server action at all.
 */

/** What a student may choose. Shown to them, and checked on both sides. */
export const MAX_CERTIFICATE_BYTES = 4 * 1024 * 1024;

/** The same number, as it reads in a sentence. */
export const MAX_CERTIFICATE_LABEL = "4MB";

/**
 * What Next.js will accept for the whole request.
 *
 * Deliberately larger than the file itself. A multipart body carries boundaries,
 * part headers and the other fields of the form on top of the bytes, so a file
 * sitting exactly on the limit above still has to get our own message rather
 * than a 413 from the framework.
 */
export const ACTION_BODY_LIMIT_BYTES = MAX_CERTIFICATE_BYTES + 256 * 1024;
