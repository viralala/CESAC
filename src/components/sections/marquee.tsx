const ITEMS = [
  "Attack on Token",
  "進撃のトークン",
  "Vision Forge",
  "Token Trials",
  "Fusion Awakening",
  "CESAC · VIT Pune",
];

/** Scrolling band — the one saturated accent, edge to edge. */
export function Marquee() {
  const run = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS];

  return (
    <div className="overflow-hidden bg-red py-4 text-white">
      <div className="animate-drift flex w-max items-center gap-8 whitespace-nowrap">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center gap-8" aria-hidden={copy === 1}>
            {run.map((item, i) => {
              const jp = /[　-鿿]/.test(item);
              return (
                <span key={`${copy}-${i}`} className="flex items-center gap-8">
                  <span className={jp ? "jp text-lg" : "d-tall text-lg tracking-[0.06em]"}>
                    {item}
                  </span>
                  <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-white/70" />
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
