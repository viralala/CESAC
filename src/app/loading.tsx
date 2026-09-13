export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <span
        aria-hidden
        className="size-3 bg-accent motion-safe:animate-pulse"
      />
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-fg-muted">
        Loading
      </p>
    </div>
  );
}
