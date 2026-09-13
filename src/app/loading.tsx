export default function Loading() {
  return (
    <div className="washi flex min-h-[100svh] flex-col items-center justify-center gap-5">
      <span aria-hidden className="flex items-end gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{ animationDelay: `${i * 160}ms` }}
            className="block h-7 w-2 rounded-full bg-red motion-safe:animate-pulse"
          />
        ))}
      </span>
      <p className="label text-muted">Breaching the wall</p>
    </div>
  );
}
