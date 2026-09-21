import { Arrow } from "@/components/aot/bits";
import { REGISTER, REGISTRATION_IS_LIVE } from "@/lib/data/event";

/**
 * The one call to action on the event page, written once and dropped in
 * wherever a reader is likely to have made up their mind.
 *
 * It has two states and no third. When the form address is set the button
 * opens the form; when it is not, the same button goes to the registration
 * panel, where the QR code and the steps are, and says so. What it never does
 * is open a link that goes nowhere, which is the one way a scroll of buttons
 * costs more than it earns.
 *
 * `fallbackHref` is where that second state points. It defaults to the bare
 * anchor, which is right on the event page itself and wrong anywhere else, so
 * a button on another page passes the full path.
 *
 * The form is somebody else's site, so it opens in its own tab: a reader who
 * fills it in still has the event page, the payment code and the chapter list
 * sitting behind them.
 */
export function RegisterButton({
  tone = "lime",
  size = "lg",
  label = "Register here",
  fallbackHref = "#register",
  className = "",
}: {
  tone?: "lime" | "ghost" | "ghost-light";
  size?: "lg" | "sm";
  label?: string;
  fallbackHref?: string;
  className?: string;
}) {
  const shape = size === "lg" ? "px-8 py-4 text-[0.95rem]" : "px-6 py-2.5 text-[0.8rem]";
  const paint = { lime: "pill-lime", ghost: "pill-ghost", "ghost-light": "pill-ghost-light" }[tone];

  if (!REGISTRATION_IS_LIVE) {
    return (
      <a href={fallbackHref} className={`pill ${paint} ${shape} ${className}`}>
        How to register
      </a>
    );
  }

  return (
    <a
      href={REGISTER.formUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`pill ${paint} ${shape} ${className}`}
    >
      {label}
      <Arrow className={size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"} />
    </a>
  );
}

/**
 * A register button on its own strip, for the seams between sections.
 *
 * Deliberately thin. It is a reminder that the decision is available, not a
 * second pitch, so it carries one line and one button and gets out of the way.
 */
export function RegisterStrip({
  line,
  className = "",
}: {
  line: string;
  className?: string;
}) {
  return (
    <section className={`bg-cream pb-4 pt-2 sm:pb-6 ${className}`}>
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-[var(--r-lg)] border-2 border-ink/12 bg-white px-6 py-5 sm:px-8">
          <p className="serif-it max-w-[46ch] text-[1.02rem] leading-snug text-muted">{line}</p>
          <RegisterButton size="sm" className="shrink-0" />
        </div>
      </div>
    </section>
  );
}
