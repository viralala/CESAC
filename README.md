<p align="center">
  <img src="public/cesac-logo.png" width="120" alt="CESAC crest" />
</p>

<h1 align="center">学生委員会<br/>CESAC</h1>

<p align="center">
  <em>Computer Engineering Student Activities Committee, VIT Pune.</em>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-0C1418?style=flat-square&logo=next.js&logoColor=F5F1E7" />
  <img alt="React" src="https://img.shields.io/badge/React-19-0C1418?style=flat-square&logo=react&logoColor=12656F" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-0C1418?style=flat-square&logo=typescript&logoColor=12656F" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-0C1418?style=flat-square&logo=tailwindcss&logoColor=12656F" />
  <img alt="No tracking" src="https://img.shields.io/badge/tracking-none-12656F?style=flat-square" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-0C1418?style=flat-square" />
</p>

<p align="center">
  The website for <b>CESAC</b>, the student activities committee of the Computer
  Engineering department at <b>VIT Pune</b>, and for the events it runs.
</p>

---

## 🧭 What this is

A community site first. CESAC is the committee; Attack on Token is one of the
things it runs, and it lives at its own route rather than being the whole site.

| Route | What it is |
| --- | --- |
| `/` | CESAC: what it is, what it does, what is running, who runs it |
| `/about` | The committee, the four verticals, faculty leadership |
| `/people` | The full 38-name roster |
| `/events` | Everything running or announced |
| `/events/attack-on-token` | The event: vitals, funnel, three chapters, prizes, entry |
| `/privacy` · `/terms` | Policy pages, written against the deployed code |
| `/signin` | Sign-in front door, UI only, no backend behind it |

## ⚔ Attack on Token

Three chapters. One battlefield. Fifty teams enter, a leaderboard cuts them down,
and a build sprint decides who is left standing.

| | |
| --- | --- |
| **Cap** | 100 students, 50 duo teams |
| **Entry** | ₹200 per team (₹100 per head) |
| **Chapters** | 3: Vision, Trials, Build |
| **Venue and date** | TBA |

| Chapter | Cuts to | What happens |
| --- | --- | --- |
| I. **Vision Forge** (幻視の鍛冶) | Top 20 | Image and video generation in Gemini and Google Flow/Veo, scored on prompt efficiency |
| II. **Token Trials** (token の試練) | Top 8 | One system prompt per team, run against a hidden adversarial benchmark on a live leaderboard |
| III. **Fusion Awakening** (融合の覚醒) | Champion | Draw three chits, build a working prototype in one sprint, pitch it |

The event page carries only what a team needs in order to enter. The production
plan from the deck (staffing, AV, the grading pipeline, pre-launch gates,
fallback schedules) is internal and deliberately not published.

## 🩸 Design Language

Built off two reference boards, not the sponsorship deck's print layout. See
`New inspo/` for the boards this pulls from.

**Colour** — teal is the brand and carries the page. Red was the brand and is
now a spot accent only. Lime, pink, violet and azure are *pops*: they appear on
the sticker badges, the chapter markers and the vitals plates, and nowhere
structural.

| | Token | Hex | Role |
| --- | --- | --- | --- |
| ![#F5F1E7](https://img.shields.io/badge/-F5F1E7?style=flat-square&color=F5F1E7) | `--cream` | `#F5F1E7` | washi ground |
| ![#0C1418](https://img.shields.io/badge/-0C1418?style=flat-square&color=0C1418) | `--ink` | `#0C1418` | text, toolbar |
| ![#12656F](https://img.shields.io/badge/-12656F?style=flat-square&color=12656F) | `--teal` | `#12656F` | **brand** |
| ![#093C44](https://img.shields.io/badge/-093C44?style=flat-square&color=093C44) | `--teal-2` | `#093C44` | deep panel |
| ![#2FC4DD](https://img.shields.io/badge/-2FC4DD?style=flat-square&color=2FC4DD) | `--azure` | `#2FC4DD` | pop, Chapter I |
| ![#6A2FF0](https://img.shields.io/badge/-6A2FF0?style=flat-square&color=6A2FF0) | `--violet` | `#6A2FF0` | pop, Chapter II |
| ![#C6F733](https://img.shields.io/badge/-C6F733?style=flat-square&color=C6F733) | `--lime` | `#C6F733` | pop, Chapter III, CTAs |
| ![#FF3D8F](https://img.shields.io/badge/-FF3D8F?style=flat-square&color=FF3D8F) | `--pink` | `#FF3D8F` | pop |
| ![#E83B2A](https://img.shields.io/badge/-E83B2A?style=flat-square&color=E83B2A) | `--red` | `#E83B2A` | spot accent |

**Type** — Anton for tall condensed headlines, Archivo 900 for the wide statement
word and all UI text, Playfair Display italic for asides, system mincho for
Japanese.

**Influences**

- **The character board** — cream seigaiha washi ground, one giant display
  word, small white info cards, `LVL-20` micro labels. The board's figure is
  the one thing deliberately not taken from it
- **The sticker board** — floating badges in six clip-path shapes (starburst,
  blob, leaf, ribbon, scallop, octagon), one lime thread through the headline,
  and a segmented pill toolbar closing the frame

There are no figures in the design language. Colour masses, masonry, stickers
and type carry the compositions; nothing is a person.

Facts are shown before they are read: the cut is a bar chart, the champion
weighting is one stacked bar, entry numbers are colour plates. Sticker labels
stay real text inside a `clip-path`, so they remain selectable and
screen-readable.

Custom classes live in `@layer components` in `globals.css`, so Tailwind
utilities still override them.

## 🧱 No figures, anywhere

There is no character on this site. Not a 3D one, not a 2D one, not a licensed
one, not an original one. The procedural three.js scout and the flat-vector
scout that replaced it are both gone, along with the `three` dependency and the
optional character-image override. Do not reintroduce either.

What closes a composition instead is `WallMark` in `aot/art.tsx`: masonry with
an arch cut through it, which is the motif the copy already leans on ("this
wall has no gate"). It carries the 404, the sign-in panel, the event hero and
the events panel on the home page.

Two rules keep it from reading as clip art. The bricks are few and large, so it
reads as a graphic device rather than as a texture of small rectangles. And
every joint is cream, the page's own ground, so the courses separate by paper
rather than by a drawn line.

Depth is still parallax, applied to colour and masonry rather than to a body.
`aot/parallax.tsx` damps the pointer into `--px`/`--py` and the scroll into
`--sy`; each plane reads them through one `transform`, so a pointer sweep
repaints and never re-renders. `prefers-reduced-motion` parks every value at
zero and stops the loop.

## 🌸 The cursor

`site/petal-cursor.tsx` sheds cherry blossom as the pointer moves, and about
every sixth spawn opens as a whole five-petal flower that pops to size before
it falls. One canvas, no DOM node per petal, and the loop stops itself the
moment the last petal dies.

It refuses to run in three cases, all of them on purpose: `prefers-reduced-motion`,
no fine pointer (a phone has no cursor to decorate), and a backgrounded tab.

The palette is mid pink with a deeper edge on every petal, not the pale blush a
real blossom is. Pale blush on a `#F5F1E7` ground is invisible, which the first
version proved.

## 🎵 The music box

`site/music-box.tsx`, mounted only by `app/events/attack-on-token/layout.tsx`,
so it exists on that one route and nowhere else. Routing away unmounts the
audio element, which is what stops playback.

The volume control is a crank. You wind it, in circles, and a full revolution
is worth about a third of the range. It is meant to be funny to use, which is
not the same as broken: the knob is a real ARIA slider and takes arrow keys,
Home, End and Page Up/Down in sane steps, so the winding is flavour rather than
the only way in.

The track lives at `public/audio/attack-on-token.mp3`: a three minute excerpt
frame-cut from the 3h18m, 169 MB master in `New inspo/`, which is a listening
compilation and cannot be deployed. `public/audio/README.md` has the details
and the recut command. The page ramps the volume down over the last two seconds
and up over the first two, so the loop seam does not click.

If the file is missing the widget hides itself rather than rendering a button
that does nothing, so the site is safe to deploy without it. Path, starting
volume, fade and auto-start all live in `lib/audio.ts`.

**The track is not cleared yet.** An event page is a public performance and a
compilation of that kind almost certainly is not licensed for it. Confirm the
rights or swap the file before launch.

## 🎗 The ribbon

`sections/ribbon.tsx` is the marquee, on a curve. The band is a fat stroked path
and the words ride that same path, so they bank with it. It occupies part of its
section rather than spanning the page, which is the point of curving it at all.

One repeat's width is measured off a hidden straight copy of the text, because
`getComputedTextLength()` is unreliable on content inside a `<textPath>`. The
loop wraps `startOffset` on that width so the seam always lands on identical
glyphs, pauses when scrolled out of view, and never re-renders.

## 🔒 Privacy and tracking

Audited, and the policy pages are written against what is actually deployed:

- No analytics package, no tag manager, no third-party scripts, no embeds. The
  audio file is served from this origin, not from a player embed.
- No cookies. Three keys in `localStorage` and nothing else: `cesac.consent`
  (the notice's answer, stored there because setting a cookie in order to ask
  about cookies is absurd) and `cesac.music` / `cesac.music.volume` (whether
  the event page's track is on, and how loud). None of them is sent anywhere.
- Fonts are downloaded at build time by `next/font` and served from this origin,
  so a page load makes **no** request to Google. Do not swap them for `<link>`
  tags; the privacy page makes that claim.
- `src/lib/consent.ts` is the switch. Set `NEXT_PUBLIC_ANALYTICS` and the notice
  becomes a real allow/decline gate with two equally weighted buttons, and
  nothing loads until one is pressed.

## 🛠 Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 5 · Tailwind CSS 4.
No 3D runtime, no animation library, no audio library. The petals are one
canvas and the parallax is one transform.

## 🚀 Quick Start

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

## 🗂 Structure

```
src/app/
  page.tsx                  CESAC community home
  about/ people/ events/    committee, roster, calendar
  events/attack-on-token/   the event, with its own OG image
  privacy/ terms/           policy pages
  signin/                   sign-in front door (UI only)
src/components/
  aot/        crest, wall mark, stickers, parallax rig, shared bits
  sections/
    home/     the CESAC community sections
    event/    the Attack on Token sections
    ribbon    legal, page-head, roster (shared)
  site/       header, footer, cookie notice, petal cursor, music box
src/lib/
  consent.ts  consent store, read through useSyncExternalStore
  audio.ts    track config and the music preference store
  data/       cesac.ts, event.ts, committee.ts
public/audio/ the event track (drop attack-on-token.mp3 here)
```

Home order: identity → what the committee does → what is running → who runs it →
how to get involved. Event order: hero → vitals → ribbon → funnel and the three
chapters → prizes → entry.

## 📜 Sourcing

Nothing in the copy is invented. There are no attendance figures, no founding
year, no past-event counts, no testimonials and no sponsor names, because none
were supplied. Where something is not decided it says TBA.

| Source | Used for |
| --- | --- |
| `CESAC_PRD_for_Claude_Code.pdf` | Product brief and the non-negotiable content rules |
| `Attack_on_Token_Sponsorship_Pitch.pdf` | Event content: every number, rule and deadline |
| `CESAC TEAM.xlsx` | Faculty, board, associates and the four verticals, verbatim |
| The reference boards in `New inspo/` | Design language only: type, colour, shape, layout |
| `logo.jpeg` | `public/cesac-logo.png` (background removed) |

One caveat worth knowing: the committee sheet lists only vertical **names**. The
one-line `remit` on each vertical in `committee.ts` is a plain reading of the
title, not something the committee wrote. Replace those lines when there is
official wording.

## 🧭 Roadmap

- [x] CESAC community site: home, about, people, events
- [x] Attack on Token event page
- [x] Privacy policy, terms, cookie notice
- [x] Sign-in front door (UI only)
- [ ] Clear the event soundtrack for public performance, or replace it
- [ ] A published committee inbox for the contact card (`CONTACT.email`)
- [ ] Registration flow: the sign-in form does not submit anywhere yet
- [ ] Participant dashboard and admin pages
- [ ] Legal review of `/privacy` and `/terms` by the department before launch

## 🤝 Contributing

This is CESAC's build, run by the Computer Engineering department at VIT Pune.
If you are on the team: branch off `main`, keep content changes scoped to
`src/lib/data/`, keep design changes scoped to `src/components/`, and run
`npm run lint` before you open a PR. Never add a statistic, testimonial or
achievement that nobody supplied.

## 👤 About Me

Built by **Viral Dhoka** ([@viralala](https://github.com/viralala)), Associate
Executive, CESAC, VIT Pune.

Reach out: [viral.1251070777@vit.edu](mailto:viral.1251070777@vit.edu)

## 📄 License

Code in this repository is licensed under the [MIT License](LICENSE) ©
2026 Viral Dhoka.

The CESAC name, crest, and the "Attack on Token" event identity belong to CESAC
and the Computer Engineering department at Vishwakarma Institute of Technology,
Pune, and are not covered by the MIT grant. Do not reuse them to represent a
different event or organization.
