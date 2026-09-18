/**
 * Event times, in IST and nothing else.
 *
 * Every event on this site happens at VIT Pune, and every person filling in
 * or reading these dates is standing in the same timezone. So the console
 * says IST rather than guessing from the browser.
 *
 * Pinning the offset is also what makes the form safe to server-render. A
 * `datetime-local` input holds wall-clock text with no zone attached, so
 * `new Date(value)` reads it in whatever zone the runtime happens to be in.
 * That is the browser's zone on the client and UTC on Vercel, which would put
 * every saved deadline five and a half hours out. Asia/Kolkata has never
 * observed daylight saving, so +05:30 is a constant and both sides can agree
 * on it without asking anybody.
 */
const IST_OFFSET_MINUTES = 5 * 60 + 30;
const IST_SUFFIX = "+05:30";

/**
 * An instant, as the text a `datetime-local` input wants: YYYY-MM-DDTHH:mm,
 * read in IST. Deterministic on the server and in the browser, so it can be a
 * defaultValue without a hydration mismatch.
 */
export function toISTInput(iso: string | null | undefined): string {
  if (!iso) return "";

  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";

  const shifted = new Date(at.getTime() + IST_OFFSET_MINUTES * 60_000);
  return shifted.toISOString().slice(0, 16);
}

/**
 * The reverse: what the form sent back, as a real instant.
 *
 * Returns null for anything unparseable rather than an Invalid Date, so the
 * caller has one thing to check instead of two.
 */
export function fromISTInput(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) return null;

  const withSeconds = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
  const at = new Date(`${withSeconds}${IST_SUFFIX}`);

  return Number.isNaN(at.getTime()) ? null : at.toISOString();
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** For display. Fixed to IST so the server and the browser print the same string. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "not set";
  const at = new Date(iso);
  return Number.isNaN(at.getTime()) ? "not set" : DATE_FORMAT.format(at);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "not set";
  const at = new Date(iso);
  return Number.isNaN(at.getTime()) ? "not set" : `${DATE_TIME_FORMAT.format(at)} IST`;
}

/** Rupees, as a person writes them. Whole rupees: the fee is never in paise. */
export function formatINR(amount: number): string {
  if (amount === 0) return "Free";
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}
