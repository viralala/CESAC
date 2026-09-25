"use client";

import Image from "next/image";
import { useState } from "react";

import { initials } from "@/lib/photos";

/** Pop and the ink that reads on it, the same pairs the roster uses. */
const POPS: readonly [string, string][] = [
  ["var(--azure)", "var(--on-pop)"],
  ["var(--violet)", "var(--on-pop-light)"],
  ["var(--lime)", "var(--on-pop)"],
  ["var(--pink)", "var(--on-pop-light)"],
];

/** The same name always lands on the same colour, wherever it is drawn. */
function popFor(name: string): [string, string] {
  // FNV-1a. A plain times-31 hash leaves the bottom two bits nearly the
  // same for most names, and a board of eight people came out seven lime.
  let h = 0x811c9dc5;
  for (const ch of name) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0;
  return POPS[(h >>> 7) % POPS.length];
}

/**
 * A person's photo, or their initials when there is none that loads.
 *
 * `sources` is a list rather than one address because a roster member can
 * have two: the portrait the committee chose, which lives on Drive and only
 * loads if it was shared publicly, and the photo on their own account. Each
 * is tried in turn and a failure moves to the next, so a Drive file somebody
 * forgot to share degrades to the account photo and then to initials instead
 * of a broken image.
 *
 * A caller whose list can change for the same person gives this a `key` built
 * from the list, which is how a fresh set of sources starts from the top.
 */
export function Avatar({
  name,
  sources,
  size,
  className = "",
  priority = false,
  shape = "circle",
}: {
  name: string;
  sources: readonly (string | null | undefined)[];
  /** Rendered size in CSS pixels, which sets what the optimiser is asked for. */
  size: number;
  className?: string;
  priority?: boolean;
  /** A circle for lists, a rounded square for a card, a tile for a portrait. */
  shape?: "circle" | "rounded" | "tile";
}) {
  const usable = sources.filter((s): s is string => Boolean(s));
  const [tried, setTried] = useState(0);
  const src = usable[tried];

  const radius = {
    circle: "rounded-full",
    rounded: "rounded-[var(--r-md)]",
    tile: "rounded-[var(--r-xl)]",
  }[shape];
  const box = `relative inline-grid shrink-0 place-items-center overflow-hidden ${radius} ${className}`;

  if (!src) {
    const [bg, fg] = popFor(name);
    return (
      <span
        aria-hidden
        className={`${box} d-wide select-none leading-none`}
        style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.36 }}
      >
        {initials(name)}
      </span>
    );
  }

  return (
    <span className={`${box} bg-cream-3`} style={{ width: size, height: size }}>
      <Image
        src={src}
        alt=""
        fill
        sizes={`${size}px`}
        priority={priority}
        className="object-cover"
        onError={() => setTried((n) => n + 1)}
      />
    </span>
  );
}
