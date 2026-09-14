export default function Loading() {
  return (
    <div className="washi flex min-h-[100svh] flex-col items-center justify-center gap-5">
      <span aria-hidden className="flex items-end gap-1.5">
        {["var(--azure)", "var(--violet)", "var(--lime)"].map((c, i) => (
          <span
            key={c}
            style={{ animationDelay: `${i * 160}ms`, background: c }}
            className="block h-7 w-2 rounded-full motion-safe:animate-pulse"
          />
        ))}
      </span>
      <p className="label text-muted">Breaching the wall</p>
    </div>
  );
}
