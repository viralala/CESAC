import { Container } from "@/components/aot/bits";

/**
 * What fills the middle while the queue is counted.
 *
 * Shaped like the page rather than a spinner, so the screen does not jump when
 * the real thing arrives. The bar above it is in the layout and never goes.
 */
export default function VerifyLoading() {
  return (
    <div className="washi grain min-h-[100svh] py-12 sm:py-16">
      <Container>
        <div className="h-4 w-28 rounded-full bg-ink/10" />
        <div className="mt-5 h-12 w-72 max-w-full rounded-[var(--r-md)] bg-ink/10" />
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-[var(--r-md)] bg-ink/[0.06]" />
          ))}
        </div>
        <div className="mt-6 grid gap-6">
          {[0, 1].map((i) => (
            <div key={i} className="h-64 rounded-[var(--r-lg)] bg-ink/[0.06]" />
          ))}
        </div>
      </Container>
    </div>
  );
}
