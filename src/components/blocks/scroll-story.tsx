"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

export type StoryChapter = {
  index: string;
  label: string;
  title: string;
  body: string;
};

function ChapterBlock({
  chapter,
  isActive,
  onActivate,
}: {
  chapter: StoryChapter;
  isActive: boolean;
  onActivate: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-40% 0px -40% 0px" });

  useEffect(() => {
    if (inView) onActivate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <div ref={ref} className="flex flex-col gap-4 py-10 lg:py-16">
      <span
        className={cn(
          "font-mono text-sm tracking-widest transition-colors",
          isActive ? "text-accent" : "text-fg-muted/50"
        )}
      >
        {chapter.index}
      </span>
      <h3
        className={cn(
          "font-display text-3xl font-medium transition-colors sm:text-4xl",
          isActive ? "text-fg" : "text-fg-muted/50"
        )}
      >
        {chapter.title}
      </h3>
      <p
        className={cn(
          "max-w-md text-balance text-base leading-relaxed transition-colors",
          isActive ? "text-fg-muted" : "text-fg-muted/40"
        )}
      >
        {chapter.body}
      </p>
    </div>
  );
}

export function ScrollStory({ chapters }: { chapters: StoryChapter[] }) {
  const [active, setActive] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
      <div className="lg:sticky lg:top-28 lg:h-[420px]">
        <div className="bg-dot-grid bg-grain relative h-[280px] overflow-hidden rounded-[4px] border border-line bg-ink-2 lg:h-full">
          <span aria-hidden className="absolute left-0 top-0 h-1.5 w-full bg-accent" />
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={shouldReduceMotion ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0 z-[2] flex flex-col justify-between p-8"
            >
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-fg-muted">
                {chapters[active].label}
              </span>
              <span className="font-display text-[clamp(4rem,10vw,7rem)] font-medium leading-none text-accent">
                {chapters[active].index}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-4 flex gap-2" role="tablist" aria-label="Story chapters">
          {chapters.map((chapter, i) => (
            <span
              key={chapter.index}
              role="tab"
              aria-selected={active === i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                active === i ? "bg-accent" : "bg-line"
              )}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col divide-y divide-line/60">
        {chapters.map((chapter, i) => (
          <ChapterBlock
            key={chapter.index}
            chapter={chapter}
            isActive={active === i}
            onActivate={() => setActive(i)}
          />
        ))}
      </div>
    </div>
  );
}
