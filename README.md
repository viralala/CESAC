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

Audited, and the policy page is written against what is actually deployed:

- No analytics package, no tag manager, no embeds, no tracking cookies. The
  audio file is served from this origin, not from a player embed.
- **No cookies at all until you sign in.** Signing in sets the Supabase Auth
  session cookies, named `sb-…`, HttpOnly and SameSite=Lax. Strictly necessary:
  they exist only because someone asked to sign in.
- Third parties, each named on the privacy page and each contacted only when
  someone chooses it: **Supabase** holds the accounts and the data, **Google /
  GitHub / Facebook** only if a visitor presses that button, and **Razorpay**
  only when a team presses pay, and only if the keys are set.
- Card and UPI details never touch this site. Razorpay's own window collects
  them; we store the order and payment identifiers so an organiser can find the
  payment, and nothing else.
- Three keys in `localStorage` and nothing else: `cesac.consent` (the notice's
  answer, stored there because setting a cookie in order to ask about cookies is
  absurd) and `cesac.music` / `cesac.music.volume` (whether the event page's
  track is on, and how loud). None of them is sent anywhere.
- Fonts are downloaded at build time by `next/font` and served from this origin,
  so a page load makes **no** request to Google. Do not swap them for `<link>`
  tags; the privacy page makes that claim.
- `src/lib/consent.ts` is the switch. Set `NEXT_PUBLIC_ANALYTICS` and the notice
  becomes a real allow/decline gate with two equally weighted buttons, and
  nothing loads until one is pressed.

## 🔑 Accounts and the consoles

One door, `/signin`, with a tab for signing in and a tab for making an account.
Four ways in: Google, GitHub, Facebook, or an email and password. Everyone signs
in the same way, and the role on the account decides where they land:
participants on `/dashboard`, organisers on `/admin`.

**How it holds together**

| Piece | File | What it does |
| --- | --- | --- |
| Config | `src/lib/supabase/config.ts` | The project URL and publishable key. Public by design, checked in so a fresh deploy just works. |
| Clients | `src/lib/supabase/{client,server,proxy}.ts` | Browser, per-request server, and the proxy's refreshing client. |
| Types | `src/lib/supabase/database.types.ts` | Generated from the live schema. `npm run db:types` after every migration. |
| Guards | `src/lib/auth/guard.ts` | `requireParticipant()` / `requireAdmin()`. The authoritative check, run per page, memoised per request. |
| Actions | `src/app/actions/{auth,team,submissions,admin}.ts` | Every mutation, grouped by what it touches. |
| Callback | `src/app/auth/callback/route.ts` | Where OAuth, email confirmation and password resets come back to. |
| Proxy | `src/proxy.ts` | Refreshes the session, then bounces the obvious cases. Optimistic, never trusted. |

**The security model, in one paragraph**

The deployed site holds no service role key. Organiser powers ride on the
signed-in user's own role, and every rule is enforced by Postgres rather than by
the app: reads go through row level security, and the writes that carry real
invariants go through `security definer` functions that re-check `is_admin()`
themselves. The one thing that genuinely needs the service role key, creating
accounts in bulk, is a local script run by hand rather than a route, precisely
so the key never has to live in the deployment. See
[Importing the roster](#-importing-the-roster). A participant calling an organiser endpoint directly gets
`Organisers only.` from the database, not from a route handler. Nobody can
promote themselves: a trigger blocks any role change that an organiser did not
make. Uploads land in a private bucket under `{team_id}/…`, and the storage
policy checks that first path segment, so one team cannot write into another's
folder or read out of it.

**Becoming an organiser**

An email in `public.admin_emails` becomes an organiser the moment it signs in,
through any provider. That is how the first one gets in, since there is nobody
to promote them yet. After that, organisers add and remove each other from the
console. `viral.1251070777@vit.edu` is seeded.

**What organisers control**

Registration open or shut, the seat cap, the entry fee, the UPI ID, an
announcement banner, whether the leaderboard is published, and whether the
Razorpay button appears. Per chapter: open, close, mark graded, score each
hand-in, and apply the cut. Every one of those writes a row to `audit_log` with
who did it.

**The entry fee**

Two routes in, one way out. A team pays by UPI or at the desk and records the
reference, or pays through Razorpay if the keys are set and the switch is on.
Either way the payment lands on `submitted` and an **organiser** marks it
verified. The site never verifies its own payment. A team is registered, and
gets a seat, once it has two people and a verified payment.

**Chapter II really locks**

`chapters.allow_edit_after_submit` is false for Token Trials, so handing in sets
the row to `locked` in the same statement. Closing a chapter locks every
outstanding hand-in in it. Neither is undone by the app, because neither is the
app's decision to make.

## 🎓 Importing the roster

The department's students do not sign themselves up. Their accounts are made
ahead of time from the spreadsheets the office keeps, so that on day one every
student already exists and only has to sign in.

**The script**

```bash
npx tsx scripts/import-students.ts            # parse and report, writes nothing
npx tsx scripts/import-students.ts --commit   # create the accounts
```

It reads `../Data/SY-Student Info.xlsx` and `../Data/TY-Student Info.xlsx`,
alongside the repo. Dry run is the default on purpose: a run that creates
nearly two thousand accounts should be something you asked for twice.

**What it does with the spreadsheets**

Neither file is a clean table. Header rows sit at different offsets from sheet
to sheet, one sheet has a title banner above the header and another an empty
spacer column, so columns are found by their heading text rather than by index.
From the SY workbook it reads all twelve division sheets. From the TY workbook
it reads only `COMP`: `Sheet1` is the whole institute across every branch, and
the sheets named `A` to `N` are the same Computer Engineering students as
`COMP` split by division, so reading either alongside `COMP` would import the
same people twice.

Addresses are lowercased, trimmed and validated. Damage that is unambiguous is
repaired: whitespace inside an address, a missing `@` in front of an otherwise
intact domain, a bare `vit` that lost its `.edu`, a stray digit welded to the
end of one. Damage that needs a guess is not. An address that is merely
suspicious, a one-letter-off domain say, is imported untouched and listed under
**worth a look**, because inventing a correction to somebody's identity is
worse than handing the row back. That matters more than usual here: the address
is also the first password, so a wrong repair locks a student out of an account
whose credentials they cannot guess.

Two kinds of repeat are treated differently. The same person listed twice is
harmless and the first listing wins. One address against two different students
is a fault in the roster, and neither is imported, because whoever came second
would silently be handed an account under the first one's name.

Everything rejected is printed with its sheet, row and reason, and written to
`import-report.csv`. Fix the spreadsheet, run it again, and only the missing
accounts are created. The script is safe to re-run: an address that already has
an account is skipped, so a run that dies halfway just needs running again.

**The first password**

Each account's password is the student's own email address, bcrypt hashed by
Supabase Auth on the way in. The script never stores, logs or prints a
plaintext password.

An address is not a secret, so that password is only acceptable for as long as
it takes to change it. Every imported account is created with
`must_change_password` set, and `requireParticipant()` / `requireAdmin()` bounce
the account to `/account/password` until it is cleared. Nothing else in the app
opens first. The flag is protected in the database by a trigger, so a student
cannot clear it with a `PATCH` from the browser and walk past the screen; the
only thing that clears it is `complete_password_change()`, called after
Supabase has actually accepted a new password. Setting the new password back to
the email address is refused.

**Running it**

The import needs the service role key, which overrides every row level security
policy in the project. It is used on a laptop for a few minutes and never
deployed:

1. Supabase dashboard, **Project Settings → API → service_role**, copy it.
2. Put it in `.env.local`, which is gitignored:
   `SUPABASE_SERVICE_ROLE_KEY="eyJ..."`
3. Run the dry run, read the report, fix the spreadsheet if you want the
   rejected rows in.
4. Run it again with `--commit`.
5. Delete the key from `.env.local` afterwards. It is not needed again until
   the next intake.

Worth switching on at the same time: **Authentication → Policies → leaked
password protection**, which checks new passwords against HaveIBeenPwned. It is
off by default, and about to matter for a lot of people at once.

## 📜 Certificates and Google Drive

Students upload their own certificates from the dashboard. The files go to
Google Drive, not to this app's storage, so the department keeps one copy
rather than two that drift apart. Postgres holds the index: who it belongs to,
what it is called, and the Drive file id and link.

Uploads are validated by their **contents**, not their filename. The type a
browser reports comes from the extension and is trivial to change, so
`src/app/actions/certificates.ts` reads the leading bytes and accepts only a
real PDF, PNG or JPEG, up to 10MB. Each student gets a subfolder named after
their email, made on their first upload and remembered on their profile.
`certificates_read_own` means a student sees their own and nobody else's.

**Uploads must go to a shared drive**

This is the part that catches people out. A service account has **no storage
quota of its own and cannot own files**. Share a folder from a personal My
Drive with it and every upload fails with `storageQuotaExceeded`, however much
space that account has left. The parent folder has to live in a **shared
drive**, where the drive owns the file instead. `vit.edu` is Google Workspace,
so shared drives are available. The client detects this failure and says so
rather than letting you go and buy storage that will not fix it.

**Setting it up**

1. **A Google Cloud project.** <https://console.cloud.google.com> → new project,
   call it something like `cesac-certificates`.
2. **Enable the Drive API.** APIs & Services → Library → search **Google Drive
   API** → Enable.
3. **Make a service account.** APIs & Services → Credentials → Create
   credentials → Service account. Name it `cesac-certificates`. No project role
   is needed: its access comes from the folder being shared with it, not from
   IAM.
4. **Make a key.** Open the service account → Keys → Add key → Create new key →
   **JSON**. It downloads once. Treat it like a password.
5. **Copy its email.** It looks like
   `cesac-certificates@your-project.iam.gserviceaccount.com`.
6. **Make a shared drive.** Google Drive → Shared drives → new, for example
   *CESAC Department*. Inside it, create the folder **Department Certificates**.
7. **Share it with the service account.** Right-click the shared drive → Manage
   members → paste the service account email → **Content manager**. Editor is
   enough to upload; content manager also lets it tidy up.
8. **Get the folder id.** Open *Department Certificates* and take it from the
   address bar: `…/folders/THIS_PART_HERE`.
9. **Set the variables** in `.env.local` for development and in the Vercel
   project settings for the deployment:

   ```
   GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account", ...}'
   GOOGLE_DRIVE_PARENT_FOLDER_ID="1AbC..."
   ```

   Paste the JSON key file whole. If a single long value is awkward, the split
   form works too:

   ```
   GOOGLE_SERVICE_ACCOUNT_EMAIL="cesac-certificates@your-project.iam.gserviceaccount.com"
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
   ```

   The `\n` escapes are handled, and so are stray wrapping quotes.

Leave these unset and the dashboard says uploads are not switched on yet
instead of breaking. Nothing here reaches the browser: the key is server only
and every Drive call is made from the server.

## 🛠 Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 5 · Tailwind CSS 4 ·
Supabase (Postgres, Auth, Storage). No 3D runtime, no animation library, no audio
library, no ORM and no auth framework on top of Supabase. The petals are one
canvas, the parallax is one transform, and the access rules are SQL.

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
  signin/ signup/           the gate; signin/help resets a password
  auth/callback/            where OAuth and email links come back to
  account/password/         set a new password after a reset
  dashboard/                participant console (guarded)
  admin/                    organiser console (guarded)
    teams/                  every team, and the payment checks
    grade/[chapterId]/      one chapter's hand-ins, with a score box each
  actions/                  auth, team, submissions, admin
src/proxy.ts                refreshes the session, then the early bounce
src/components/
  console/    the signed-in bar, panels, forms, team setup, hand-in, payment
  aot/        crest, wall mark, stickers, parallax rig, shared bits
  sections/
    home/     the CESAC community sections
    event/    the Attack on Token sections
    ribbon    legal, page-head, roster (shared)
  site/       header, footer, cookie notice, petal cursor, music box
src/lib/
  supabase/   config, browser/server/proxy clients, generated types
  auth/       guard.ts (the page checks), session.ts (the viewer shape)
  data/       console.ts (every read), hand-ins.ts (what each chapter collects),
              cesac.ts, event.ts, committee.ts
  consent.ts  consent store, read through useSyncExternalStore
  audio.ts    track config and the music preference store
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
- [x] Accounts: email and password, Google, GitHub, Facebook
- [x] Registration: teams of two, join codes, seats against the cap
- [x] Entry fee: offline references and Razorpay, both verified by an organiser
- [x] Chapter hand-ins with uploads, and Chapter II's hard lock
- [x] Grading, the weighted leaderboard, and the cut
- [x] Organiser console: switches, payments, chapter control, roles, audit log
- [ ] Turn off email confirmation or add SMTP before sign-ups open at scale
- [ ] Register the OAuth apps and add the redirect URLs (see `HANDOVER.md`)
- [ ] Clear the event soundtrack for public performance, or replace it
- [ ] A published committee inbox for the contact card (`CONTACT.email`)
- [ ] The live Chapter II adversarial test runner, which is still a manual score
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
