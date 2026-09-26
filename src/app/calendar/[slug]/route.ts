import { icsFile } from "@/lib/calendar";
import { getEventCards } from "@/lib/data/event-content";
import { getSchedules, scheduleFor } from "@/lib/data/event-schedule";

/**
 * An event as an .ics file, for Apple Calendar, Outlook and phones.
 *
 * A route rather than a data: link built in the browser, because iOS Safari
 * hands a real text/calendar response straight to the Calendar app and does
 * much less with a download it has to assemble itself. The address of the
 * site written into the entry is this request's own origin, so an entry
 * added from a preview deployment points back at that preview.
 *
 * An event with no date answers 404 with a sentence, rather than a file with
 * a made-up date in it.
 */
export async function GET(request: Request, ctx: RouteContext<"/calendar/[slug]">) {
  const { slug } = await ctx.params;
  const event = (await getEventCards()).find((e) => e.slug === slug);
  if (!event) return new Response("There is no event at that address.", { status: 404 });

  const schedule = scheduleFor(event, await getSchedules());
  if (!schedule) {
    return new Response(
      `${event.name} does not have a date yet. The calendar entry appears on the event page once it does.`,
      { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  const origin = new URL(request.url).origin;
  const body = icsFile(
    { slug: event.slug, name: event.name, blurb: event.blurb, href: event.href, schedule },
    origin,
  );

  return new Response(body, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${event.slug}.ics"`,
      // Short, because the committee can move the date from the console.
      "cache-control": "public, max-age=300",
    },
  });
}
