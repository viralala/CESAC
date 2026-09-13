# Attack on Token

Event site for **Attack on Token**, the prompt engineering hackathon run by CESAC —
the Computer Engineering Student Activities Committee at VIT Pune.

Next.js 16 (App Router, Turbopack) + Tailwind CSS 4.

```bash
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

## Where things come from

| Source | Used for |
| --- | --- |
| `Attack_on_Token_Sponsorship_Pitch.pdf` | **Content only** — every number, rule, rubric and schedule |
| The four reference boards in `New inspo/` | **Design language only** — type, colour, shape, layout devices |
| `CESAC TEAM.xlsx` | Faculty, board, associates and the four verticals |
| `logo.jpeg` | `public/cesac-logo.png` (background removed) |

Nothing in the copy is invented. Where the deck says TBD or placeholder, the site
says TBA — dates, venue and prize pool included.

## Design language

Pulled from the reference boards rather than the deck's print layout:

- **Reika / Cyberpunk** — cream washi ground, a single saturated red, one giant
  display word with the character standing in front of it, small white info cards
  with a red circular arrow, `LVL-20`-style micro labels.
- **Crypko** — a cream frame wrapped around a deep teal panel (`.shell`), a notched
  tab cutting into the panel edge, the rotating seal, clipped-corner plates.
- **Samurai** — carousel dots, pill buttons, the vertical kanji watermark.
- **Yonika** — the floating pill navbar, near-black panel, serif-italic display
  voice, the fanned card deck, the gradient strip closing a dark panel.

Type: **Anton** for tall condensed headlines, **Archivo 900** for the wide statement
word and all UI text, **Playfair Display italic** for ledes and asides, system
mincho for Japanese.

Custom classes live in `@layer components` in `globals.css` so Tailwind utilities
still override them.

## Structure

```
src/app/
  page.tsx              one scrolling landing page
  signin/page.tsx       sign-in front door (participant + admin)
src/components/
  aot/                  art, seal, reveal, meter, shared bits
  sections/             one file per landing section
  site/                 header, footer
src/lib/data/
  event.ts              deck content
  committee.ts          department committee + team roster
```

Page order: hero → event snapshot → three walls → the three chapters → awards →
operations → **department committee** → **team** → sponsorship → footer.

## Artwork

All original flat vector — no copyrighted characters, frames or logos. The Token
Titan, the wings crest, the wall, the chapter plates and the gradient strip are
drawn in `src/components/aot/art.tsx` and `src/components/sections/chapter-art.tsx`.

## Not built yet

`/signin` is the front door only — the form does not submit anywhere. Registration
flow, participant dashboard and admin pages are still to come.
