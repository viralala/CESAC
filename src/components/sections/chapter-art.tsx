import { CHITS } from "@/lib/data/event";

/** Chapter I — an image forged, then extended into video, in as few prompts as possible. */
function VisionArt() {
  return (
    <div className="plate relative aspect-[4/3] w-full overflow-hidden bg-ink">
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative h-[58%] w-[68%]">
          <span className="absolute inset-0 rounded-[var(--r-sm)] border-2 border-cream/45" />
          <span className="absolute -bottom-5 -right-5 h-full w-full rounded-[var(--r-sm)] border-2 border-cream/22" />
          <span className="absolute -bottom-10 -right-10 h-full w-full rounded-[var(--r-sm)] border-2 border-cream/10" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="dot-btn h-14 w-14">
              <svg viewBox="0 0 16 16" className="h-5 w-5" aria-hidden>
                <path d="M5 3.5 12.5 8 5 12.5Z" fill="currentColor" />
              </svg>
            </span>
          </span>
        </div>
      </div>
      <p className="label absolute left-5 top-5 text-cream/70">Image → Video</p>
      <div className="absolute bottom-5 left-5 flex items-end gap-1.5" aria-hidden>
        {[14, 22, 9, 28, 6].map((h, i) => (
          <span
            key={i}
            style={{ height: `${h}px` }}
            className={`w-[7px] rounded-full ${i < 2 ? "bg-red" : "bg-cream/25"}`}
          />
        ))}
      </div>
      <p className="serif-it absolute bottom-4 right-8 text-sm text-cream/55">
        fewer prompts, higher score
      </p>
    </div>
  );
}

/** Chapter II — the sealed case file, a clock whose hands disagree. */
function TrialsArt() {
  return (
    <div className="plate relative aspect-[4/3] w-full overflow-hidden bg-ink">
      <div className="absolute inset-0 grid place-items-center">
        <svg viewBox="0 0 200 200" className="h-[66%] w-auto" aria-hidden>
          <circle cx="100" cy="100" r="78" fill="none" stroke="var(--cream)" strokeWidth="2" opacity="0.35" />
          <circle cx="100" cy="100" r="66" fill="none" stroke="var(--cream)" strokeWidth="1" opacity="0.14" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            return (
              <line
                key={i}
                x1={100 + Math.cos(a) * 62}
                y1={100 + Math.sin(a) * 62}
                x2={100 + Math.cos(a) * 72}
                y2={100 + Math.sin(a) * 72}
                stroke="var(--cream)"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.4"
              />
            );
          })}
          {/* hands pointing at times that cannot all be true */}
          <line x1="100" y1="100" x2="148" y2="72" stroke="var(--red)" strokeWidth="5" strokeLinecap="round" />
          <line x1="100" y1="100" x2="64" y2="146" stroke="var(--cream)" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
          <line x1="100" y1="100" x2="132" y2="150" stroke="var(--cream)" strokeWidth="3" strokeLinecap="round" opacity="0.42" />
          <circle cx="100" cy="100" r="6" fill="var(--red)" />
        </svg>
      </div>

      {/* sealed-file tape */}
      <span
        aria-hidden
        className="label absolute left-[-14%] top-[15%] w-[130%] rotate-[-9deg] bg-red py-2 text-center text-white"
      >
        Sealed · hidden tests · do not open
      </span>

      <p className="serif-it absolute bottom-4 left-5 text-sm text-cream/55">
        14:20 → 09:05 → &ldquo;ten minutes later&rdquo;
      </p>
    </div>
  );
}

/** Chapter III — three chits drawn and traded, fanned like the Yonika card deck. */
function FusionArt() {
  const rot = [-11, 0, 11];
  const shift = [-136, 0, 136];

  return (
    <div className="plate relative aspect-[4/3] w-full overflow-hidden bg-ink">
      <div className="absolute inset-0 grid place-items-center">
        {/* scaled as a group so the fan never clips out of a narrow plate */}
        <div className="relative h-full w-full scale-[0.62] sm:scale-[0.78] lg:scale-90 xl:scale-100">
          {CHITS.map((chit, i) => (
            <div
              key={chit.title}
              style={{
                transform: `translateX(${shift[i]}px) rotate(${rot[i]}deg)`,
                zIndex: i === 1 ? 3 : 2,
              }}
              className="absolute left-1/2 top-1/2 -ml-[66px] -mt-[95px] flex h-[190px] w-[132px] flex-col justify-between rounded-[var(--r-sm)] bg-cream p-4 shadow-[0_14px_30px_-12px_rgba(0,0,0,0.75)]"
            >
              <p className="label-sm text-red">Chit {String(i + 1).padStart(2, "0")}</p>
              <div>
                <p className="d-tall text-[1.15rem] leading-tight text-ink">{chit.title}</p>
                <p className="serif-it mt-1.5 text-[0.72rem] leading-snug text-muted">{chit.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="serif-it absolute bottom-4 left-5 text-sm text-cream/55">
        every final chit must appear in the concept
      </p>
    </div>
  );
}

export function ChapterArt({ id }: { id: string }) {
  if (id === "vision-forge") return <VisionArt />;
  if (id === "token-trials") return <TrialsArt />;
  return <FusionArt />;
}
