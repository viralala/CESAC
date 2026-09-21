import { Container } from "@/components/aot/bits";

/**
 * What the console shows while a page is being built.
 *
 * Next.js prefetches this and swaps it in the moment a nav link is clicked, so
 * the click has an answer immediately instead of the browser sitting on the
 * old page until the server is done. The bar above it belongs to the layout
 * and never goes away, so what the organiser sees is the same console with its
 * middle filling in.
 *
 * Deliberately the shape of a console page rather than a spinner: three bars
 * where the heading goes, a row of counts, two panels. It is a placeholder for
 * something whose layout is known, and a placeholder that matches stops the
 * page jumping when the real thing arrives.
 */
export default function AdminLoading() {
  return (
    <div className="washi grain min-h-[100svh] py-12 sm:py-16">
      <Container>
        <div aria-hidden className="motion-safe:animate-pulse">
          <div className="h-3 w-24 rounded-full bg-ink/10" />
          <div className="mt-5 h-12 w-72 max-w-full rounded-[var(--r-md)] bg-ink/10" />
          <div className="mt-4 h-4 w-[38ch] max-w-full rounded-full bg-ink/[0.07]" />

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-[6.5rem] rounded-[var(--r-md)] bg-cream-2" />
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="h-[22rem] rounded-[var(--r-lg)] bg-cream-2" />
            <div className="h-[22rem] rounded-[var(--r-lg)] bg-cream-2" />
          </div>
        </div>

        <p className="sr-only" role="status">
          Loading the console
        </p>
      </Container>
    </div>
  );
}
