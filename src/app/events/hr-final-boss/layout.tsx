import { LightCursor } from "@/components/hrfb/cursor";

/**
 * Scope for this route's own cursor.
 *
 * The site-wide cherry blossom trail checks its own pathname and stands down
 * on this route (see petal-cursor.tsx), and this layout mounts the
 * replacement in its place: a sparser, blue-and-white light trail instead of
 * petals. Mounted here and nowhere else, the same way the music box is
 * scoped to the Attack on Token route.
 */
export default function HrFinalBossLayout({
  children,
}: LayoutProps<"/events/hr-final-boss">) {
  // keep-light: the page is blue and white by design, and keeps that in dark
  // mode rather than having the site's dark palette poured over it.
  return (
    <div className="keep-light">
      {children}
      <LightCursor />
    </div>
  );
}
