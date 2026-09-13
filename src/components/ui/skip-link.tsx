export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-[4px] focus:bg-accent focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-ink"
    >
      Skip to main content
    </a>
  );
}
