# Admin console: what still has to be built

A shared list. Add anything you want built; I will do the same as things come
up. Tick a box when the feature is live on `cesac-azure.vercel.app`, not when
the code is written.

The student console is built. Most of what is below already exists as a column,
a policy or a function in the database, with no screen behind it yet, so
building each one is a page in `/admin` rather than a migration. Where that is
the case it says so.

---

## 1. Events

- [ ] **Unlock and lock an event.** *Asked for, and the reason this file
      exists.* Built on 19 September and waiting on the deploy. It is on the
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

- [ ] **Add an event, and edit one.** Built on 19 September, at the bottom of
      the Entries page. Name, kicker, the one line, the date label, the fee,
      solo or pairs, the order, and the page it links to. Putting in a slug
      that already exists edits that event instead of making a second one.

      A new event is always born `locked`, so it is safe to fill the form in
      early. The slug is deliberately not editable: `event_registrations`
      points at it, so moving it would orphan every entry.

- [ ] **See who has entered.** Built on 19 September. Each event on the
      Entries page carries its own list: both names of each pair, both
      addresses, class and PRN, and the payment state, newest first. Withdrawn
      entries stay in the list, greyed, rather than vanishing.

      PRN and class are on a separate type from the one the student side uses,
      on purpose. Widening the shared one would have handed every student their
      partner's PRN as a side effect, and the profiles policy allows that read,
      so nothing would have stopped it.

- [ ] **Verify an entry fee.** Built on 19 September. The reference the
      student recorded is shown next to the entry, with the method, and two
      controls: verify it, or send it back.

      Sending it back puts the entry at `pending` rather than `rejected`.
      `rejected` is on the enum and has no screen that clears it, so an entry
      parked there would strand the student with no way to record a corrected
      reference. The reason goes in the audit row instead.

- [ ] **Withdraw an entry.** Built on 19 September, with the bug that came
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

- [ ] **Verify a certificate.** Every upload lands with `verified = false` and
      the board counts it anyway, which is stated plainly on the ranking page
      but is not a good long-term answer. A queue of unverified certificates,
      each with its Drive link and an approve or reject, is what makes the
      ranking mean something.
      *Ready in the database: `certificates.verified`, `verified_by`,
      `verified_at`, and an admin update policy.*

- [ ] **Reject or delete a certificate.** A duplicate, a file for somebody
      else's event, a screenshot of nothing. Deleting the row is easy; it also
      has to delete the file from Drive, or the folder fills with orphans.

- [ ] **Decide whether unverified certificates count.** A switch, defaulting to
      counting them, so the board can be tightened up once there are enough
      organisers to check them. Today it is baked into `ranking_board()`.

- [ ] **Bulk-issue certificates for our own events.** After Attack on Token we
      will know exactly who participated and who placed. Typing that back in
      one student at a time is the wrong shape; issuing them from the entry
      list is the right one.

- [ ] **Export.** The board and the whole certificate table as CSV, for the
      department's own records and for anything that has to go to the office.

---

## 3. Questions

- [ ] **Answer a question.** The table, the policies and the student's side of
      it are all live, and there is no screen for the committee. An organiser
      currently has to write the answer into the `queries` table by hand.
      *Ready in the database: `queries.answer`, `answered_by`, `answered_at`,
      `status`, and an admin update policy.*

- [ ] **A queue, oldest first, with a count.** Five open questions per student
      is the ceiling, so an unanswered queue quietly stops people asking.

- [ ] **Canned answers.** The same six questions will arrive two hundred times
      in the week after the roster announcement.

---

## 4. Students

- [ ] **Find a student.** By name, email, PRN or class. There are 1,871
      accounts and no way to look one up.

- [ ] **Change a student's email.** The one field a student cannot edit
      themselves, deliberately: it is what the account signs in with, and the
      database reverts a change made anywhere but through auth. When a roster
      address turns out to be wrong, only an organiser can fix it, and today
      only through the Supabase dashboard.

- [ ] **Add the five students the import could not take.** Two pairs share an
      address between them and one address is truncated in the spreadsheet.
      They are in `import-report.csv`, which is gitignored because it has real
      names and addresses in it.

- [ ] **See whether a student has set their own password.** 1,868 accounts were
      created with the student's own email as the password and are held at the
      change-password screen until they set a real one. 1,866 are still waiting
      as of 18 September. A count on the console tells the committee when that
      window is actually shut.
      *Ready in the database: `profiles.must_change_password`.*

- [ ] **Send a password reset for one student.** Needs custom SMTP first, see
      below.

- [ ] **Clear out `you@vit.edu`.** A placeholder account from an early build,
      created 15 September, never confirmed and never signed in. Its password
      is its own email and it is not held at the change-password screen,
      because it predates that check. Harmless as it stands, and still one
      account nobody owns.

---

## 5. Things that broke

- [ ] **The organiser console threw on `/admin/events`.** Fixed 19 September,
      waiting on the deploy. This is the one that was reported: the page was
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

## 6. Things that are not features

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
