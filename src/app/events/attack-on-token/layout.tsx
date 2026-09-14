import { MusicBox } from "@/components/site/music-box";

/**
 * Scope for the soundtrack.
 *
 * The music widget is mounted here and nowhere else, so it exists on
 * /events/attack-on-token and on no other route. Routing away unmounts the
 * audio element, which is what stops playback: there is no global player
 * holding state across pages and no cleanup to forget.
 */
export default function AttackOnTokenLayout({ children }: LayoutProps<"/events/attack-on-token">) {
  return (
    <>
      {children}
      <MusicBox />
    </>
  );
}
