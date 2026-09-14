# Handover: what is done, and what is yours to do

Written 15 September 2026, at the end of the session that built the backend.

The site now has a real database behind it. Accounts, teams, the entry fee,
chapter hand-ins, grading, the leaderboard and the cut all exist and all work.
Everything was tested end to end against the live database before this was
written, including the parts that are meant to fail.

**Nothing below is optional busywork.** Items 1 and 2 are the difference between
a site that works for a hundred students and one that works for two.

---

## The project

| | |
| --- | --- |
| Supabase project | `cesac` |
| Project ref | `lgshgaltulbnjqfxjsme` |
| Region | `ap-south-1`, Mumbai |
| API URL | `https://lgshgaltulbnjqfxjsme.supabase.co` |
| Dashboard | https://supabase.com/dashboard/project/lgshgaltulbnjqfxjsme |
| Plan | Free. The whole build fits inside it. |
| Live site | https://cesac-azure.vercel.app |

The project URL and the publishable key are checked into
`src/lib/supabase/config.ts`. That is deliberate and safe: both are public by
design and end up in the browser bundle either way, and the publishable key
grants nothing that the database rules do not already allow.

**There is no service role key anywhere in this repository, and you should never
add one.** Organiser powers ride on the signed-in user's own role, checked by
Postgres. That means there is no all-access key that could leak.

---

## 1. Email confirmation will break registration. Fix it first.

**This is the single most important thing in this document.**

Supabase's built-in email sender is rate limited to a handful of messages per
hour. I hit the limit during testing after **three** sign-ups. With a hundred
students signing up in the same evening, almost none of them will get their
confirmation email, and none of those can sign in.

Pick one of these two. Either works.

### Option A, simplest: turn confirmation off

1. Open https://supabase.com/dashboard/project/lgshgaltulbnjqfxjsme/auth/providers
2. Under **Email**, turn off **Confirm email**.
3. Save.

Sign-ups then work immediately with no email at all. The trade-off is that
somebody can sign up with an address that is not theirs. For a college hackathon
where you verify people at the desk anyway, that is a fair trade, and it is what
I would choose.

### Option B, proper: use your own mail sender

1. Make a free account at Resend, Brevo or SendGrid. Resend's free tier is
   generous and takes about ten minutes.
2. Get the SMTP host, port, username and password.
3. Open https://supabase.com/dashboard/project/lgshgaltulbnjqfxjsme/settings/auth
4. Find **SMTP Settings**, enable custom SMTP, paste them in, save.
5. Raise the rate limit under **Rate Limits** once SMTP is set.

Do this if you want confirmed email addresses and working password resets at
scale. Note that **password reset does not work at all** until you do either
this or accept the built-in limit, because it is the same mailer.

---

## 2. Tell Supabase which URLs are allowed to receive a sign-in

Without this, Google, GitHub, Facebook and every email link will fail on the
live site. They will work on localhost and nowhere else.

1. Open https://supabase.com/dashboard/project/lgshgaltulbnjqfxjsme/auth/url-configuration
2. Set **Site URL** to `https://cesac-azure.vercel.app`
3. Under **Redirect URLs**, add each of these on its own line:

```
https://cesac-azure.vercel.app/auth/callback
https://cesac-azure.vercel.app/**
http://localhost:3000/auth/callback
http://localhost:3000/**
```

4. Save.

If you later put a real domain on the site, add that too, in both places.

---

## 3. Switch on the social logins

Each one is the same shape: create an app on their side, copy two values into
Supabase. The callback URL Supabase needs you to give them is always:

```
https://lgshgaltulbnjqfxjsme.supabase.co/auth/v1/callback
```

**The sign-in page shows only the providers that are actually switched on.** It
asks Supabase which those are, so right now there are no social buttons at all
and email is the only way in. Enable one in the dashboard and its button appears
on the site within a minute, with no deploy and nothing for me to change. Do them
in any order, or only the ones you want.

### Google, about 15 minutes, do this one first

1. Go to https://console.cloud.google.com/apis/credentials
2. Create a project if you have none. Name it anything.
3. **OAuth consent screen**: choose **External**, fill in the app name
   (`Attack on Token`), your support email and a developer email. Save.
   You do **not** need Google's verification review for this: an unverified app
   can still sign in up to 100 users, and you will show a "Google hasn't
   verified this app" interstitial. If you expect more than 100, submit it for
   verification now, because it takes days.
4. **Credentials → Create credentials → OAuth client ID → Web application**.
5. Under **Authorised redirect URIs** add
   `https://lgshgaltulbnjqfxjsme.supabase.co/auth/v1/callback`
6. Copy the **Client ID** and **Client secret**.
7. In Supabase → Authentication → Providers → **Google**: enable it, paste both,
   save.

### GitHub, about 5 minutes, the easiest

1. Go to https://github.com/settings/developers → **New OAuth App**.
2. Application name: `Attack on Token`. Homepage URL:
   `https://cesac-azure.vercel.app`.
3. Authorisation callback URL:
   `https://lgshgaltulbnjqfxjsme.supabase.co/auth/v1/callback`
4. Register, then **Generate a new client secret**.
5. In Supabase → Providers → **GitHub**: enable, paste the Client ID and secret,
   save.

### Facebook, slowest, and it may not land in time

Be warned before you start: Facebook now requires **business verification** and
an **app review** before a Facebook login works for anyone outside your own
developer account. That review can take days and is sometimes refused for
student projects without a business entity.

1. Go to https://developers.facebook.com/apps → **Create App** →
   **Authenticate and request data from users with Facebook Login**.
2. Add the **Facebook Login** product.
3. Under Facebook Login → Settings → **Valid OAuth Redirect URIs** add
   `https://lgshgaltulbnjqfxjsme.supabase.co/auth/v1/callback`
4. From **App settings → Basic**, copy the **App ID** and **App Secret**.
5. In Supabase → Providers → **Facebook**: enable, paste both, save.
6. Then go through **App Review** and request the `email` permission. Until this
   is approved, only accounts listed as developers or testers on the app can
   sign in.

**If the review stalls, leave the Facebook provider switched off in Supabase.**
The button then returns "That sign-in method is not switched on yet" instead of
a dead end, and Google, GitHub and email still cover everyone.

---

## 4. Make yourself an organiser

Already set up: `viral.1251070777@vit.edu` is on the organiser allowlist.

1. Go to https://cesac-azure.vercel.app/signup
2. Sign up with **that exact address**, through any method.
3. You will land on `/admin` instead of `/dashboard`.

That is the only account that can get in initially. From the console you add the
rest of the committee, either by promoting an existing account or by adding
their email to the allowlist so they become an organiser the moment they sign in.

If you want to use a different address, tell me, or run this in the Supabase SQL
editor before signing up:

```sql
insert into public.admin_emails (email, note)
values ('your.address@vit.edu', 'Organiser');
```

---

## 5. Set the event up from the console

Everything here is on `/admin`, under **Event controls**. No deploy needed for
any of it.

- **Registration open.** I left this **on** so the site is usable the moment it
  deploys. If you would rather nobody registers before the date is announced,
  turn it off; the public page then says so and invites people to make an
  account and wait.
- **Seat cap.** 50 teams, from the deck. Seats are handed out in the order teams
  complete, and a team past the cap registers without a seat number.
- **Entry fee.** ₹200.
- **UPI ID and payee name.** **Currently empty.** Until you fill these in, a
  team is told to pay at the desk instead. Fill them in and the panel shows the
  UPI ID to pay into.
- **Announcement.** Shows across the top of every participant console. Use it
  for the date announcement and for anything urgent on the day.
- **Leaderboard published.** Off. Off means each team sees only its own score.
  On means everybody sees the whole board. Turn it on when you want the room to
  see it.
- **Razorpay checkout.** Off, and it does nothing until item 6 is done.

---

## 6. Razorpay, optional

The online payment path is fully built and inert until you add keys. Teams can
pay by UPI and record the reference regardless, which is why this is optional.

1. Sign up at https://razorpay.com and complete KYC. This needs a real entity
   and a bank account: a college committee usually needs the department or the
   student council to do it. **This is the slow part**, allow several days.
2. From the Razorpay dashboard, **Settings → API Keys → Generate Key**.
3. In Vercel, open the `cesac` project → **Settings → Environment Variables**,
   and add both for Production:

| Name | Value |
| --- | --- |
| `RAZORPAY_KEY_ID` | `rzp_live_…` or `rzp_test_…` |
| `RAZORPAY_KEY_SECRET` | the secret half |

4. Redeploy.
5. Turn **Razorpay checkout** on in the organiser console.

Test it with the test keys first. `rzp_test_…` keys take Razorpay's test cards
and move no real money.

Worth knowing: even a successful Razorpay payment is marked **submitted**, not
verified. An organiser still confirms it against the Razorpay dashboard. That is
what you asked for, and it is also the honest thing to do, because the
confirmation currently comes back through the browser rather than through a
Razorpay webhook. If you want that to become automatic later, the missing piece
is a webhook endpoint and a webhook secret.

---

## 7. Before you let real students in

- **Read `/privacy`.** I rewrote it in the same commit, because the old one said
  the site set no cookies and had no backend, and both became false. It now
  names Supabase, the three login providers and Razorpay. Check that you are
  comfortable with what it says, and get the department to look at it.
- **Decide about the music track.** Still not cleared for public performance.
  That was already on the list and has not changed.
- **Try the whole flow yourself once**, with two accounts, on the live site.
  Make a team, join it with the code from a second account, record a payment,
  verify it from the organiser console. It takes five minutes and it is worth
  doing before a hundred people do it at once.

---

## How the day actually runs

This is the order the console expects, and is worth reading once before the
event rather than on the morning.

1. **Before**: registration open, teams register, you verify payments as they
   come in on `/admin/teams`. A team goes green once it has two people and a
   verified payment.
2. **Chapter I**: press **Open** on Vision Forge. Teams now see an upload form.
   When time is up, press **Close**, which locks every hand-in in it.
3. **Grade it**: `/admin/grade/vision-forge`. Each team's files open through a
   link that expires in an hour. Enter a score out of 100. Press **Mark graded**
   when you are done.
4. **The cut**: press **Cut to 20 teams**. It ranks by that chapter's score and
   marks the rest eliminated. It asks you to confirm first. If a cut is
   disputed, **Put this team back in** on `/admin/teams` reverses it for one
   team.
5. **Chapter II**: same, but handing in **locks immediately and permanently**
   for the team. That is the hard lock from the deck. Warn the room.
6. **Chapter III**: same as Chapter I.
7. **Publish the leaderboard** whenever you want the room to see the standings.
   The total is weighted 20 / 35 / 45 exactly as the deck specifies.

Everything an organiser does is written to an audit log with their name on it,
visible at the bottom of `/admin`.

---

## What is deliberately not built

Said plainly so nobody discovers it on the day.

- **The Chapter II adversarial test runner.** The deck describes a live
  leaderboard driven by hidden tests run against each locked system prompt.
  Nothing runs those tests. Organisers score Chapter II by hand like the other
  two, and the leaderboard updates from those scores. Building the runner is a
  separate project.
- **Automatic Razorpay confirmation.** Covered in item 6.
- **Email notifications.** Nobody is emailed when their payment is verified or a
  chapter opens. They see it when they next load the console. Use the
  announcement banner for anything time-critical.
- **The audience vote** for the Audience Favourite award. Not built; run it in
  the room.
- **Editing a team name after registration.** Captains can change it while the
  team is still forming. After that an organiser has to do it in the database.

None of these block running the event. All of them are things I would rather you
heard from me now than found out at 9am.

---

## If something goes wrong

**Nobody can sign in.** Check items 1 and 2. Nine times in ten it is the
redirect URLs or the mail limit.

**A team says they paid but the console shows nothing.** They may have paid
without recording the reference. Use **Mark as paid** on their card in
`/admin/teams` and enter the reference yourself.

**Somebody needs to be in a team they cannot join.** The join code is on the
captain's console and on the team's card in `/admin/teams`.

**You need to look at the data directly.**
https://supabase.com/dashboard/project/lgshgaltulbnjqfxjsme/editor

**You locked yourself out of the organiser console.** Run the SQL in item 4
against your own address from the Supabase dashboard, which does not need the
site at all.
