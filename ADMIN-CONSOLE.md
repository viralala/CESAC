# Admin console: what still has to be built

A shared list. Add anything you want built; I will do the same as things come
up. Tick a box when the feature is live on `cesac-azure.vercel.app`, not when
the code is written.

**Registration for Attack on Token is open.** Opened 19 September 2026 from the
new control on the Entries page. HR Final Boss is still locked. Two things
about it are worth knowing before the first student asks:

- The entry fee is Rs 125 and **no UPI ID is set**, so the payment panel tells
  students to pay at the desk and record a receipt number. Set the UPI ID and
  payee name in Event controls on the Command page to offer UPI as well.
- 1,864 of 1,871 accounts are still holding the password they were imported
  with, and `register_for_event()` refuses an account in that state. Everybody
  has to set a password before they can enter anything. That is deliberate, and
  it means the password count on the student directory is also the count of
  who can actually register.

The student console is built. Most of what is below already exists as a column,
a policy or a function in the database, with no screen behind it yet, so
building each one is a page in `/admin` rather than a migration. Where that is
the case it says so.

---

## 1. Events

- [x] **Unlock and lock an event.** *Asked for, and the reason this file
      exists.* Live since 19 September. It is on the
      new **Entries** page, one row of controls per event, and it offers only
      the moves that make sense from where the event is: a locked event can be
      opened, an open one closed or locked again, a closed one re-opened.
      Opening asks first, because every student on the site can enter from the
      moment it is pressed.

      It goes through `admin_set_event_state()` rather than writing the column,
      so the change and its audit row land in one transaction and a disputed
      decision has a record of who made it.

      **Attack on Token was opened this way on 19 September 2026**, and
      HR Final Boss was deliberately left locked.

- [x] **Add an event, and edit one.** Live since 19 September, at the bottom of
      the Entries page. Name, kicker, the one line, the date label, the fee,
      solo or pairs, the order, and the page it links to. Putting in a slug
      that already exists edits that event instead of making a second one.

      A new event is always born `locked`, so it is safe to fill the form in
      early. The slug is deliberately not editable: `event_registrations`
      points at it, so moving it would orphan every entry.

- [x] **See who has entered.** Live since 19 September. Each event on the
      Entries page carries its own list: both names of each pair, both
      addresses, class and PRN, and the payment state, newest first. Withdrawn
      entries stay in the list, greyed, rather than vanishing.

      PRN and class are on a separate type from the one the student side uses,
      on purpose. Widening the shared one would have handed every student their
      partner's PRN as a side effect, and the profiles policy allows that read,
      so nothing would have stopped it.

- [x] **Verify an entry fee.** Live since 19 September. The reference the
      student recorded is shown next to the entry, with the method, and two
      controls: verify it, or send it back.

      Sending it back puts the entry at `pending` rather than `rejected`.
      `rejected` is on the enum and has no screen that clears it, so an entry
      parked there would strand the student with no way to record a corrected
      reference. The reason goes in the audit row instead.

- [x] **Withdraw an entry.** Live since 19 September, with the bug that came
      with it. The row is kept rather than deleted, so what was entered and
      what was paid survives the withdrawal, and both people are freed to enter
      again because every check looks for `status = 'registered'`.

      Freed in principle, that is. `register_for_event()` ended in
      `on conflict do nothing`, which was right until withdrawing existed and
      wrong the moment it did: the withdrawn row stayed, the new insert hit it,
      nothing came back, and the student was told they were already entered for
      something they had just been taken off. No screen could undo it. The
      conflict now updates, and only where the existing row is withdrawn, so a
      genuine double entry still gets the sentence it always got. Whatever was
      paid is kept.

---

## 2. Certificates and the ranking

- [x] **Verify a certificate.** Live since 19 September at
      `/admin/certificates`. A queue oldest first with the student's name,
      class and PRN, the Drive link and how long it has been waiting, then the
      settled ones underneath so a decision can be undone.

      **Three states out of one boolean.** The table has `verified` and an
      organiser has three things to say: not looked at, checked and good,
      checked and no. The third is carried by `verified_at`, so a row nobody
      has opened has no stamp and a row somebody turned down has one. That is
      what makes the queue clearable, and a queue that cannot be cleared is
      the whole problem: without it the duplicate a student uploaded twice
      sits at the top of the list every morning. A `rejected` column would say
      it more plainly and is a migration.

- [ ] **Reject or delete a certificate.** A duplicate, a file for somebody
      else's event, a screenshot of nothing. Deleting the row is easy; it also
      has to delete the file from Drive, or the folder fills with orphans.

- [ ] **Decide whether unverified certificates count.** A switch, defaulting to
      counting them, so the board can be tightened up once there are enough
      organisers to check them. Today it is baked into `ranking_board()`.
      **Turning a certificate down on the new page does not take its points
      off the board**, for exactly this reason. The page says so out loud, and
      it is the one thing about the queue that is not yet honest.

- [ ] **Bulk-issue certificates for our own events.** After Attack on Token we
      will know exactly who participated and who placed. Typing that back in
      one student at a time is the wrong shape; issuing them from the entry
      list is the right one.

- [x] **Export.** Live since 19 September, the button at the bottom of the
      certificates page. The whole table with the student, their class and
      PRN, the state, who verified it and the Drive link.

      A route handler rather than a server action, because the point is a file
      and `Content-Disposition` already does what an action would need a
      client component and an object URL to do. Every field is quoted rather
      than only the ones that need it, and a value starting `=`, `+`, `-` or
      `@` is prefixed, because Excel runs those as formulas.

      Still to do: the ranking board itself as CSV.

---

## 3. Questions

- [x] **Answer a question.** Live since 19 September at `/admin/queries`. An
      answer box per question, and sending the same question again overwrites,
      which is the only way to correct an answer that went out wrong.

      It is a plain update rather than a `security definer` function, because
      the admin update policy on `queries` is the whole rule. It does select
      the row back afterwards, and that is not for the value: an update row
      level security refuses matches nothing and comes back from PostgREST as
      a success with no error, so without it an organiser would be told the
      student had their answer when nothing had been written.

- [x] **A queue, oldest first, with a count.** Live since 19 September. The
      page also counts how many students are sitting on all five of their
      slots, which is the number that says the ceiling has started behaving
      like a mute.

- [x] **Canned answers.** Live since 19 September. Seven of them, appended to
      the box rather than dropped on top of it, so a misclick cannot destroy a
      half-written answer and two can be stacked.

---

## 4. Students

- [x] **Find a student.** Live since 19 September at `/admin/students`. Name,
      address, PRN or class, one substring, twenty-five to a page.

      The search runs in Postgres rather than the browser. Every row carries a
      real name, a real address and a real PRN, so loading the roster and
      filtering it client-side would put the whole department in the page
      source of every search. An empty box shows no names at all, for the same
      reason. PostgREST's own syntax is taken out of the term before it goes
      into the `or=` expression: a comma or a bracket would be writing filter
      structure rather than searching for it, and a bare `%` would match every
      account and read like a search that had found the entire college.

- [ ] **Change a student's email.** The one field a student cannot edit
      themselves, deliberately: it is what the account signs in with, and the
      database reverts a change made anywhere but through auth. When a roster
      address turns out to be wrong, only an organiser can fix it, and today
      only through the Supabase dashboard.

- [ ] **Add the five students the import could not take.** Two pairs share an
      address between them and one address is truncated in the spreadsheet.
      They are in `import-report.csv`, which is gitignored because it has real
      names and addresses in it.

- [x] **See whether a student has set their own password.** Live since
      19 September, on the same page, counted at request time.

      Read the number honestly: "set their own" is a subtraction rather than a
      column. `must_change_password` records that an account is *held*, not
      where its password came from, so an account made through Google was
      never held in the first place and counts as released. The page says so
      rather than claiming a precision the data does not have.

- [ ] **Send a password reset for one student.** Needs custom SMTP first, see
      below.

- [ ] **Clear out `you@vit.edu`.** A placeholder account from an early build,
      created 15 September, never confirmed and never signed in. Its password
      is its own email and it is not held at the change-password screen,
      because it predates that check. Harmless as it stands, and still one
      account nobody owns. It is now also one of the three accounts with no
      PRN against it, so it shows up in the list below.

---

## 5. The roster numbers, and the seven cells that need a person

Filled in on 19 September. Before that, **2 of 1,871 accounts had a PRN or a
class**: the import carried a name, an address and a year and nothing else, and
those two columns were left for students to fill in themselves. Which meant the
new entries list and the student directory both said "No class or PRN on the
row" against very nearly everybody, and the one place that matters is a desk on
the day with a printed class list on it.

Both numbers were in the spreadsheets the accounts were made from all along.
`scripts/backfill-roster.ts` reads the same two files through the same parser
and writes only what is missing:

    npx tsx scripts/backfill-roster.ts              # report only
    npx tsx scripts/backfill-roster.ts --commit     # write

**1,868 of 1,871 accounts now carry both.** It never overwrites: a student who
typed their own PRN in keeps it.

Two things worth knowing about the data:

- **The two workbooks do not agree on what the number is.** SY carries a ten
  digit "GR. No", which also appears inside the student's own address. TY
  carries an eight digit "PRN No", which does not, except for one group inside
  TY that uses the ten digit style. All of them land in `profiles.prn`, because
  from the console's point of view it is one thing: the number on the sheet the
  organiser at the desk is holding.

- **`profiles.prn` is unique, and that caught seven bad cells.** Seven SY
  numbers were each written against two different students. The address settles
  it, since an SY address contains the student's own number, so the four people
  holding somebody else's were put back to their own and the seven who had been
  refused got theirs. None of that was a guess.

### The seven rows a person still has to settle

Three have no number at all:

| Address | Why |
| --- | --- |
| `pruthviraj.125107043@vit.edu` | Nine digits. The address is the truncated cell that kept a student out of the original import, and the number is short with it, so writing it would record a wrong one. |
| `anshay.peter17@vit.edu` | Seven digits, `1710056`. Looks like an older intake and is probably simply right, which is why a script should not be the one deciding. |
| `you@vit.edu` | The placeholder account. Nothing to fill in; delete it. |

Four carry a number that disagrees with their own address:

| Address | On the roster | In the address |
| --- | --- | --- |
| `shriram.1271070378@vit.edu` | `1251070378` | `1271070378` |
| `jayesh.1252070648@vit.edu` | `1251070648` | `1252070648` |
| `om.1251071042@vit.edu` | `1251150362` | `1251071042` |
| `mahavir.1252070086@vit.edu` | `12520125` | `1252070086` |

These four were deliberately left as the roster has them. Unlike the seven
duplicates there is no second student to cross-check against, and for the first
two the difference is a single digit that could as easily be a typo in the
address as in the sheet. `om` and `mahavir` look like plain roster errors and
probably want the address value. Check them against the office copy and set
them from the student directory, or in the dashboard.

---

## 6. Things that broke

- [x] **The sign-in throttle would have locked out the whole campus.** Changed
      19 September, before it happened rather than after. Found while checking
      what opening registration exposes.

      The per-IP half was written for "a whole lecture hall can share one
      campus NAT address" and sized at **sixty failed attempts in fifteen
      minutes**. The population it now faces is the whole department: 1,871
      accounts, 1,864 of them still holding the password they were imported
      with, all signing in for the first time in the same few days, from
      behind one campus NAT. Sixty failures is perhaps sixty confused
      students, after which **every student on campus is locked out for
      fifteen minutes, including the ones typing the right password**, and it
      would have happened during the registration rush with nobody watching.

      Two changes, both about the signal rather than the number. It counts
      distinct addresses now rather than attempts, because "one source working
      through many addresses" is what the rule is for and one student retrying
      ten times is one address. And it asks whether that source is also
      succeeding, which is the thing an IP alone cannot tell you: a campus
      mid-rush produces failures and successes together, because most people
      do know their password, while a sprayer working a list produces failures
      and almost nothing else.

      Verified against three cases before it shipped: 200 failing addresses
      with 120 successes from one IP is allowed, 200 failing addresses with no
      successes is throttled, and ten failures on one address is still
      throttled. **The per-address rule is untouched** and is the one that
      actually protects an account.

      On a shared campus NAT the IP rule is now close to inert by design, and
      that is the honest trade. **Worth a look when you are up**, since it is
      the one security control that was deliberately loosened.


- [x] **The organiser console threw on `/admin/events`.** Fixed and live on
      19 September. This is the one that was reported: the page was
      erroring for three people and had done so twenty-four times since the
      EMS panel went live the day before.

      `ActionForm` took its `children` as a render prop, `(pending) => ...`, so
      a caller could disable its own fields while the action was in flight.
      That is fine from another client component and an instant crash from a
      server one: a function cannot be serialized across the boundary, and
      React says so with *"Functions cannot be passed directly to Client
      Components"*. Three of the five callers were server components.

      What made it survive review is that **nothing catches it before
      production**. `tsc --noEmit` passes, `eslint` passes, `next build`
      passes, because `ReactNode | ((pending: boolean) => ReactNode)` is a
      perfectly good type and the boundary is not part of it. It fails only
      when the page is actually rendered by a signed-in organiser.

      The pending state is read from inside the form now, by a
      `<PendingFields>` wrapper calling `useFormStatus()`, and a disabled
      fieldset disables every control inside it without the caller touching a
      field. `ActionForm`'s `children` is plain `ReactNode`, so writing the old
      shape is a compile error rather than something that shows up in the
      Vercel error log a day later.

      **The general lesson, worth remembering the next time a console panel is
      added:** a green local build says nothing about whether a server
      component can hand that prop to a client one. If a page is only reachable
      signed in, it has to be opened signed in before it is called done.

---

- [ ] **`TypeError: fetch failed` on the public pages, source unknown.** Six of
      them between 15 and 17 September, across five people, on `/index.rsc`,
      `/events.rsc`, `/signin.rsc` and `/_not-found`. The cause is
      `UND_ERR_SOCKET`, "other side closed", against `104.18.38.10`, which is
      Cloudflare and so almost certainly Supabase.

      **Not diagnosed.** Written down here rather than guessed at, because an
      afternoon of guessing at it produced a plausible fix for the wrong
      thing.

      What was ruled out on 19 September, by pointing a local build at a
      socket that accepts the connection and then destroys it, which is
      exactly what `other side closed` means:

      - **It is not the proxy.** `supabase.auth.getUser()` in
        `lib/supabase/proxy.ts` looked like the obvious suspect, since the
        proxy runs before routing and would explain why four unrelated routes
        failed together. It does not throw: supabase-js catches the fetch
        failure and returns it as an error on the result, so the proxy
        carries on and the page still renders 200. Verified both with and
        without a guard around it, and the status codes were identical.
      - **It is not `authMethods()`**, which wraps its own fetch and falls
        back to no social buttons.
      - **It is not the fonts.** `next/font/google` downloads at build time.
      - The other raw fetches in the codebase are Razorpay and Google Drive,
        and neither runs on any of those four routes.

      Worth knowing before picking it up again: the `.rsc` suffix means these
      were client-side navigations rather than fresh page loads, and **it was
      never established that any of them returned a 5xx.** They may be logged
      and recovered rather than fatal. Vercel keeps runtime logs for one hour
      on the Hobby plan, so the status codes for those requests are long gone;
      the next occurrence needs catching inside that window. If the pages did
      stay up, this is noise in the error list rather than an outage, and
      should be closed as such.

## 7. Things that are not features

Operational, and worth doing before any of the above.

- [x] **Google Drive authenticates as a person now.** Changed on 18 September.
      The service account was the wrong tool: it owns no storage and cannot put
      a file in anybody's My Drive, so every upload into the department folder
      failed with `storageQuotaExceeded`. `src/lib/drive/client.ts` holds an
      OAuth2 refresh token for a real Google account instead, and the files are
      owned by and billed to that account. Nothing else about the upload path
      changed, and the parent folder is still `GOOGLE_DRIVE_PARENT_FOLDER_ID`.

- [x] **OAuth client made, consent granted, upload proved.** Tested end to end
      on 18 September: the refresh token in `.env.local` was accepted, a folder
      was created inside **Department Certificates** and a file uploaded into
      it. The file came back `ownedByMe: true`, owned by
      **dhoka.viral12@gmail.com** and billed to that account's own quota, which
      is the whole point of the change: the parent folder is in a **My Drive**,
      exactly the arrangement that failed with `storageQuotaExceeded` before.
      Test folder and file were moved to the Drive trash afterwards. The Drive
      API is evidently on, since every call succeeded.

      That account has 10.6GB of 5TB used, so storage is not a concern.

- [ ] **Publish the OAuth consent screen. This one has a deadline.** While the
      consent screen is in **Testing**, Google expires the refresh token
      **seven days** after it was issued, and uploads then start failing with
      `invalid_grant` although nobody touched anything. The client says exactly
      that when it happens and the fix is to re-run the consent script, but it
      should not be happening during an event.

      **Internal is not an option here.** The authorised account is a personal
      Gmail, not a `vit.edu` Workspace account, and Internal needs Workspace.
      So set the consent screen to **In production** in the Cloud console.

      Publishing unverified is fine for this: Google's verification review
      matters for apps with many users, and exactly one person ever consents to
      this one. The consent screen will show an "unverified app" warning, which
      is got past with **Advanced → Go to app**, once, by whoever re-runs the
      script. Consider moving the whole thing to a `vit.edu` account later, so
      the certificates do not live in one student's personal Drive.

- [ ] **Delete the old service account.** The private key of
      `cesac-761@cesac-508912` was printed into a Claude Code transcript on
      18 September while diagnosing the upload failure. Nothing was published
      and the file itself is gitignored, so this is caution rather than a known
      compromise. Nothing reads it any more, so it does not need rotating:
      delete the service account outright, and clear
      `GOOGLE_SERVICE_ACCOUNT_JSON` from `.env.local` and from the Vercel
      project settings. The code ignores that variable now.

- [ ] **Custom SMTP.** Supabase's built-in mailer sends two emails an hour for
      the whole project. Nobody needs email to sign in, so this is not blocking
      today, but the first wave of forgotten passwords will jam instantly.

- [ ] **Turn off public sign-up.** Everybody who belongs here already has an
      account. Leaving it open means anybody with any address can make one.

- [ ] **Leaked password protection.** A Supabase Auth switch. Refuses passwords
      that have turned up in a known breach.

---

## Notes

- The student console never unlocks anything and never verifies anything. Every
  rule that matters is a policy or a `security definer` function in Postgres,
  so a screen built here cannot be talked out of it by a crafted request.
- Adding a screen for anything marked *Ready in the database* is a page in
  `/admin` plus a server action, with no migration.

- **`/admin/entries` and `/admin/events` are two different things.** Entries is
  the two events actually on the public site, held in `public.dept_events`,
  entered by a pair of students against a slug. Event system is the newer
  arrangement in the `ems` schema, with teams of up to eight, invitations, its
  own payments and per-event organisers. Nothing is shared between them but the
  accounts. The nav says "Entries" and "Event system" rather than two Events.
- The certificate upload rides in on a server action, and Next.js caps those
  request bodies at 1MB by default. That cap is refused before any of our code
  runs, so an oversized file produced the error page and a reference number
  rather than a sentence. `src/lib/console/limits.ts` now holds the one number
  the form, the action and `next.config.ts` all read. It cannot go past 4.5MB
  while the upload goes through a server action, because that is where Vercel
  stops accepting request bodies.
