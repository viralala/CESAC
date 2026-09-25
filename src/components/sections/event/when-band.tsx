import { Container, Label } from "@/components/aot/bits";
import { EventWhen } from "@/components/site/event-when";
import { EVENTS } from "@/lib/data/cesac";
import { getSchedules, scheduleFor } from "@/lib/data/event-schedule";

/**
 * The date, the countdown and the calendar button, as a band on an event's
 * own page.
 *
 * Shared by both event routes, and it takes each route's ground as a class
 * so it sits in Attack on Token's parchment and HR Final Boss's grid without
 * either page knowing how the other looks. The card itself reads the route's
 * tokens, so on Attack on Token it comes out in the deck's paper and crimson.
 */
export async function WhenBand({ slug, ground }: { slug: string; ground: string }) {
  const event = EVENTS.find((e) => e.slug === slug);
  if (!event) return null;
  const schedule = scheduleFor(event, await getSchedules());

  return (
    <section className={`${ground} pb-6 pt-2 sm:pb-10`}>
      <Container>
        <div className="card flex flex-wrap items-center justify-between gap-x-10 gap-y-6 p-7 sm:p-9">
          <div className="max-w-[34rem]">
            <Label tone="teal">When</Label>
            <h2 className="d-tall mt-3 text-[clamp(1.9rem,4.2vw,2.8rem)] leading-tight text-ink">
              {schedule ? "Put it in your calendar" : "Not set yet"}
            </h2>
          </div>
          <EventWhen event={event} schedule={schedule} />
        </div>
      </Container>
    </section>
  );
}
