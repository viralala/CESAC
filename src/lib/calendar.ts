import type { EventSchedule } from "@/lib/data/cesac";

/**
 * Calendar entries and countdowns, from an event's schedule.
 *
 * Plain functions with no server or browser dependency, so the countdown in
 * the browser and the .ics route on the server work from the same arithmetic
 * and cannot disagree about when something starts.
 *
 * Everything is India time. The committee is in Pune, every event is on
 * campus, and "3 October" means 3 October in IST whatever timezone the
 * visitor's laptop happens to be set to.
 */

export const TIMEZONE = "Asia/Kolkata";
const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cesac-azure.vercel.app";

/** The calendar day an instant falls on in India, as YYYYMMDD. */
function istDay(ms: number): string {
  return new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10).replace(/-/g, "");
}

/** An instant as an iCalendar UTC stamp, 20261003T043000Z. */
function utcStamp(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * The instants the event runs between, end exclusive.
 *
 * An all-day event ends at midnight after its last day. A timed event with no
 * end is given an hour, which is only what a calendar needs to draw a block,
 * and the description of the entry says the end time has not been set.
 */
export function span(schedule: EventSchedule): { start: number; end: number } {
  const start = Date.parse(schedule.start);
  if (schedule.allDay) {
    const last = schedule.end ? Date.parse(schedule.end) : start;
    return { start, end: last + DAY_MS };
  }
  const end = schedule.end ? Date.parse(schedule.end) : start + 60 * 60 * 1000;
  return { start, end };
}

export type Phase = "tba" | "upcoming" | "live" | "over";

export function phaseAt(schedule: EventSchedule | null, now: number): Phase {
  if (!schedule) return "tba";
  const { start, end } = span(schedule);
  if (now < start) return "upcoming";
  if (now < end) return "live";
  return "over";
}

/** What is left before it starts, in whole units. */
export function remaining(schedule: EventSchedule, now: number) {
  const ms = Math.max(0, span(schedule).start - now);
  return {
    days: Math.floor(ms / DAY_MS),
    hours: Math.floor((ms % DAY_MS) / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
    seconds: Math.floor((ms % 60_000) / 1000),
  };
}

/** The dates in words, in India time: "Sat 3 – Sun 4 Oct 2026", or with a time. */
export function describe(schedule: EventSchedule): string {
  const { start, end } = span(schedule);
  const day = (ms: number, withYear: boolean) =>
    new Intl.DateTimeFormat("en-IN", {
      timeZone: TIMEZONE,
      weekday: "short",
      day: "numeric",
      month: "short",
      ...(withYear ? { year: "numeric" } : {}),
    }).format(ms);
  const time = (ms: number) =>
    new Intl.DateTimeFormat("en-IN", {
      timeZone: TIMEZONE,
      hour: "numeric",
      minute: "2-digit",
    }).format(ms);

  if (schedule.allDay) {
    const lastDay = end - DAY_MS;
    return istDay(start) === istDay(lastDay)
      ? day(start, true)
      : `${day(start, false)} – ${day(lastDay, true)}`;
  }
  if (!schedule.end) return `${day(start, true)}, ${time(start)} IST`;
  return istDay(start) === istDay(end)
    ? `${day(start, true)}, ${time(start)} – ${time(end)} IST`
    : `${day(start, false)}, ${time(start)} – ${day(end, true)}, ${time(end)} IST`;
}

export type CalendarEvent = {
  slug: string;
  name: string;
  blurb: string;
  /** The event's page, relative to the site. */
  href: string;
  schedule: EventSchedule;
};

function details(event: CalendarEvent, siteUrl: string): string {
  const lines = [event.blurb, "", `${siteUrl}${event.href}`];
  if (!event.schedule.allDay && !event.schedule.end) {
    lines.push("", "The end time has not been announced yet.");
  }
  if (!event.schedule.venue) lines.push("", "Venue to be announced.");
  return lines.join("\n");
}

function location(event: CalendarEvent): string {
  return event.schedule.venue ?? "VIT Pune";
}

/** A link that opens Google Calendar with the entry filled in. */
export function googleCalendarUrl(event: CalendarEvent, siteUrl = SITE_URL): string {
  const { start, end } = span(event.schedule);
  const dates = event.schedule.allDay
    ? `${istDay(start)}/${istDay(end)}`
    : `${utcStamp(start)}/${utcStamp(end)}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${event.name} · CESAC`,
    dates,
    details: details(event, siteUrl),
    location: location(event),
    ctz: TIMEZONE,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** RFC 5545 text: backslash, semicolon, comma and newline escaped. */
function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Lines longer than 75 octets are folded, with the rest indented a space. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;

  const out: string[] = [];
  let current = "";
  let size = 0;
  for (const ch of line) {
    const width = new TextEncoder().encode(ch).length;
    if (size + width > (out.length ? 74 : 75)) {
      out.push(current);
      current = "";
      size = 0;
    }
    current += ch;
    size += width;
  }
  out.push(current);
  return out.join("\r\n ");
}

/**
 * The event as an .ics file, which Apple Calendar, Outlook and every phone
 * open. The UID is stable per event, so downloading it twice after the date
 * moves updates the entry rather than adding a second one.
 */
export function icsFile(event: CalendarEvent, siteUrl = SITE_URL, now = Date.now()): string {
  const { start, end } = span(event.schedule);
  const when = event.schedule.allDay
    ? [`DTSTART;VALUE=DATE:${istDay(start)}`, `DTEND;VALUE=DATE:${istDay(end)}`]
    : [`DTSTART:${utcStamp(start)}`, `DTEND:${utcStamp(end)}`];

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CESAC VIT Pune//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.slug}@cesac.vit-pune`,
    `DTSTAMP:${utcStamp(now)}`,
    ...when,
    `SUMMARY:${escapeText(`${event.name} · CESAC`)}`,
    `DESCRIPTION:${escapeText(details(event, siteUrl))}`,
    `LOCATION:${escapeText(location(event))}`,
    `URL:${siteUrl}${event.href}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
