import { MusicBox } from "@/components/site/music-box";

/**
 * Scope for the soundtrack and the red/black theme.
 *
 * The music widget is mounted here and nowhere else, so it exists on
 * /events/attack-on-token and on no other route. Routing away unmounts the
 * audio element, which is what stops playback: there is no global player
 * holding state across pages and no cleanup to forget.
 *
 * The `theme-aot` wrapper re-points the shared teal custom properties at red
 * for this subtree only (see globals.css): the community pages elsewhere on
 * the site keep the teal brand untouched.
 */
export default function AttackOnTokenLayout({ children }: LayoutProps<"/events/attack-on-token">) {
  return (
    <div className="theme-aot">
      {children}
      <MusicBox />
    </div>
  );
}
