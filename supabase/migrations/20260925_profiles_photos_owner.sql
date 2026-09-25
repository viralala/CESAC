-- ===========================================================================
-- Profiles, photos, the owner, and dates you can put in a calendar.
--
-- Seven things, asked for together on 25 September 2026:
--
--   1. The owner. viral.1251070777@vit.edu runs the site and holds the one
--      role above organiser. Nobody can demote, narrow, repassword or delete
--      that account from the site.
--   2. An organiser can set anybody's password. Organisers set students' and
--      verifiers'; only the owner sets another organiser's.
--   3. Every student adds a photo before their console opens, and the photo
--      is what the boards print next to a name.
--   4. The whole standouts list, not only the top three, for /standouts.
--   5. A profile page for everybody on the roster, seeded from the committee's
--      own form responses.
--   6. A real start and end for each event, so the site can offer a calendar
--      entry and a countdown rather than a line of text.
--   7. Questions: nothing here. The form stopped asking for a topic and sends
--      'other', which the existing check already allows.
--
-- Additive on purpose. Every column is new, every function is new except
-- ranking_board, which gains one column at the end of what it returns, so the
-- deployment still running the previous code keeps working against this.
--
-- Idempotent: every statement can run twice. The seed only fills blanks, so a
-- second run never overwrites what the committee has since typed in.
-- ===========================================================================


-- ===========================================================================
-- 1. The owner
-- ===========================================================================

-- The role guard, rewritten with three rules where there was one.
--
-- auth.uid() is null for the SQL editor and for a migration: there is no
-- session and nobody to check, and that is how an owner is made or unmade on
-- purpose. It cannot be reached from the API, because profiles has no update
-- policy for an anonymous request, so row level security refuses the write
-- before this trigger ever runs.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.role is distinct from old.role then
    if not public.is_admin() then
      raise exception 'Only an organiser can change a role.' using errcode = '42501';
    end if;
    if old.role = 'owner' then
      raise exception 'The owner cannot be removed or demoted from the site.'
        using errcode = '42501';
    end if;
    if new.role = 'owner' then
      raise exception 'Nobody is made an owner from the site.' using errcode = '42501';
    end if;
  end if;

  -- Not the role alone. An organiser who holds People and access can update
  -- any profile, which would otherwise let one of them arm the password
  -- screen on the owner or rename them. The owner's row is the owner's.
  if old.role = 'owner' and old.id <> auth.uid() then
    raise exception 'The owner''s account can only be changed by the owner.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- Deleting the account is the other way to take somebody's access, and the
-- cascade from auth.users lands here first. From the SQL editor it still
-- works, for the day it is needed.
create or replace function public.guard_owner_delete()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if old.role = 'owner' and auth.uid() is not null then
    raise exception 'The owner''s account cannot be deleted from the site.'
      using errcode = '42501';
  end if;
  return old;
end;
$$;

drop trigger if exists profiles_guard_owner_delete on public.profiles;
create trigger profiles_guard_owner_delete
  before delete on public.profiles
  for each row execute function public.guard_owner_delete();

-- The one owner. admin_can() already never narrows an owner and
-- admin_set_grants() already refuses to, so this row is the whole grant.
update public.profiles
   set role = 'owner'
 where lower(email) = 'viral.1251070777@vit.edu'
   and role <> 'owner';

-- Any narrowing left over from when the account was an ordinary organiser
-- would be ignored for an owner anyway. Removed so the console does not show
-- a grant that means nothing.
delete from public.admin_grants g
 using public.profiles p
 where p.id = g.profile_id and p.role = 'owner';


-- ===========================================================================
-- 2. Setting somebody's password
--
-- admin_set_verifier_password() refused anybody but a verifier, and said why:
-- a function that could set any password would let one organiser take
-- another's account. That is still the risk, so this one is a ladder rather
-- than a free-for-all:
--
--   * an organiser holding People and access sets a student's or a
--     verifier's password;
--   * only the owner sets another organiser's, because an organiser narrowed
--     to People could otherwise reset an un-narrowed colleague and sign in as
--     them, which is every area of the console for the price of one;
--   * nobody sets the owner's but the owner, and nobody sets their own here:
--     /account/password does that, and checks the new one properly.
--
-- By default the account is also put back behind the change-password screen,
-- so a password an organiser read out over the phone lasts exactly one
-- sign-in. Every session the account holds is ended, so whoever had it open
-- is signed out on their next refresh.
-- ===========================================================================

create or replace function public.admin_set_password(
  p_email text,
  p_password text,
  p_must_change boolean default true
)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  clean_email text := lower(btrim(coalesce(p_email, '')));
  target public.profiles;
  caller_role public.app_role;
begin
  if not public.admin_can('people') then
    raise exception 'Only an organiser who holds People and access can set a password.'
      using errcode = '42501';
  end if;

  if p_password is null or length(p_password) < 8 then
    raise exception 'A password has to be at least 8 characters.' using errcode = 'P0001';
  end if;
  if length(p_password) > 72 then
    -- bcrypt reads 72 bytes and ignores the rest, so a longer one would be a
    -- password whose tail does nothing.
    raise exception 'Keep it to 72 characters or fewer.' using errcode = 'P0001';
  end if;

  select * into target from public.profiles p where lower(p.email) = clean_email;
  if target.id is null then
    raise exception 'There is no account on %.', clean_email using errcode = 'P0001';
  end if;

  if target.id = auth.uid() then
    raise exception 'Change your own from Account, password, where it is checked properly.'
      using errcode = 'P0001';
  end if;

  select p.role into caller_role from public.profiles p where p.id = auth.uid();

  if target.role = 'owner' then
    raise exception 'Nobody sets the owner''s password but the owner.' using errcode = '42501';
  end if;
  if target.role = 'admin' and caller_role is distinct from 'owner' then
    raise exception 'Only the owner can set another organiser''s password.'
      using errcode = '42501';
  end if;

  update auth.users
     set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
         -- An organiser handing somebody a password is vouching for the
         -- address; an unconfirmed one would refuse the very sign-in this is
         -- for, with a message that does not say why.
         email_confirmed_at = coalesce(email_confirmed_at, now()),
         updated_at = now()
   where id = target.id;

  update public.profiles
     set must_change_password = coalesce(p_must_change, true)
   where id = target.id;

  delete from auth.sessions where user_id = target.id;

  perform public.audit('account.password.set', 'profile', target.id::text,
    jsonb_build_object('email', target.email, 'role', target.role,
                       'must_change', coalesce(p_must_change, true)));

  return target.email;
end;
$$;


-- ===========================================================================
-- 3. Student photos
--
-- A public bucket, because the photo is printed on public pages and a signed
-- URL that expires would break the front page every hour. Each student writes
-- only inside their own folder, named by their id, which is the same shape the
-- submissions bucket has always used.
--
-- The path is on the profile rather than a URL, so the project address lives
-- in one place (the app) and a path pointing into somebody else's folder is
-- refused by the check below.
-- ===========================================================================

alter table public.profiles
  add column if not exists photo_path text;

alter table public.profiles drop constraint if exists profiles_photo_path_own;
alter table public.profiles add constraint profiles_photo_path_own check (
  photo_path is null
  or (photo_path like id::text || '/%' and length(photo_path) <= 200)
);

comment on column public.profiles.photo_path is
  'Where this account''s photo sits in the public avatars bucket, always inside a folder named by the account id. Null until the student adds one, and the student console does not open until they have.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Reading is the public URL and needs no policy. Select is here because
-- Storage asks for it before it will delete, and a student replacing their
-- photo deletes the old one.
drop policy if exists avatars_select_own on storage.objects;
create policy avatars_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- For the photo that should not be on the front page. Clearing it puts the
-- student back in front of the photo screen on their next visit, which is the
-- whole of the moderation: they choose a better one.
create or replace function public.admin_clear_photo(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.admin_can('people') then
    raise exception 'Only an organiser who holds People and access can do that.'
      using errcode = '42501';
  end if;

  update public.profiles set photo_path = null where id = p_profile_id;
  if not found then
    raise exception 'No such account.' using errcode = 'P0001';
  end if;

  perform public.audit('profile.photo.cleared', 'profile', p_profile_id::text, '{}'::jsonb);
end;
$$;


-- ===========================================================================
-- 4. The boards, with photos, and all of the standouts
-- ===========================================================================

-- The signed-in top ten. Same rows as before with the photo on the end, so a
-- caller that does not read it is unaffected. Dropped rather than replaced
-- because Postgres will not change what a function returns in place.
drop function if exists public.ranking_board(integer);
create function public.ranking_board(p_limit integer default 10)
returns table(place bigint, student_id uuid, name text, year text,
              points bigint, certificates bigint, photo text)
language sql
stable
security definer
set search_path to 'public'
as $$
  with tally as (
    select
      p.id,
      coalesce(nullif(btrim(p.full_name), ''), split_part(p.email, '@', 1)) as name,
      p.year,
      p.photo_path,
      coalesce(sum(public.achievement_points(c.kind, c.contribution, c.level)), 0)::bigint as points,
      count(c.id)::bigint as certificates
    from public.profiles p
    left join public.certificates c on c.owner_id = p.id
    where p.role = 'participant'
    group by p.id, p.full_name, p.email, p.year, p.photo_path
  )
  select
    rank() over (order by points desc, certificates desc, name asc),
    id, name, year, points, certificates, photo_path
  from tally
  where certificates > 0
  order by 1, name
  limit greatest(1, least(coalesce(p_limit, 10), 100));
$$;

-- Every category, every student in it, with a photo.
--
-- showcase_board() is the front page's top three and is left exactly as it
-- was, because the deployment before this one reads it. This is the same
-- counting without the cut, for /standouts, and the front page takes its top
-- three off the top of this instead. Two numbers for position: `place` is the
-- rank, so two students on the same score share it, and `seq` is the order,
-- which is what the front page cuts at so it never shows four people in
-- three slots.
--
-- Same thin shape as the showcase: a name, a year, a number, the committee's
-- note and the photo. Nobody who has asked not to be named is in it.
create or replace function public.standouts_board()
returns table(
  category_id text, category_title text, category_blurb text,
  category_position integer, metric text, slots integer,
  place integer, seq integer,
  student_id uuid, name text, year text, value bigint, note text, photo text
)
language sql
stable
security definer
set search_path to 'public'
as $$
  with live as (
    select * from public.showcase_categories where visible
  ),
  people as (
    select
      p.id,
      coalesce(nullif(btrim(p.full_name), ''), split_part(p.email, '@', 1)) as name,
      p.year,
      p.photo_path,
      coalesce(sum(public.achievement_points(c.kind, c.contribution, c.level)), 0)::bigint as points,
      count(c.id) filter (
        where c.kind = 'event' and c.contribution in ('first', 'second', 'third')
      )::bigint as wins,
      count(c.id) filter (where c.kind <> 'event')::bigint as publications,
      coalesce(sum(c.prize_amount_inr), 0)::bigint as prize_money,
      count(c.id) filter (where c.level = 'international')::bigint as international,
      count(c.id)::bigint as records
    from public.profiles p
    left join public.certificates c on c.owner_id = p.id
    where p.role = 'participant' and p.showcase_opt_out = false
    group by p.id, p.full_name, p.email, p.year, p.photo_path
  ),
  counted as (
    select
      l.id as category_id, l.title, l.blurb, l.position, l.metric, l.slots,
      pk.note, pk.position as pick_position,
      pe.id, pe.name, pe.year, pe.photo_path,
      case l.metric
        when 'points'        then pe.points
        when 'wins'          then pe.wins
        when 'publications'  then pe.publications
        when 'prize_money'   then pe.prize_money
        when 'international' then pe.international
        when 'records'       then pe.records
        else pe.points
      end as value
    from live l
    left join public.showcase_picks pk
      on pk.category_id = l.id and l.metric = 'manual'
    join people pe
      on (l.metric = 'manual' and pe.id = pk.student_id)
      or (l.metric <> 'manual')
  ),
  ordered as (
    select
      c.*,
      row_number() over (
        partition by c.category_id
        order by
          case when c.metric = 'manual' then c.pick_position else 0 end,
          case when c.metric = 'manual' then 0 else c.value end desc,
          c.name asc
      )::integer as seq,
      rank() over (
        partition by c.category_id
        order by
          case when c.metric = 'manual' then c.pick_position else 0 end,
          case when c.metric = 'manual' then 0 else c.value end desc
      )::integer as tied
    from counted c
    where c.metric = 'manual' or c.value > 0
  )
  select
    o.category_id, o.title, o.blurb, o.position, o.metric, o.slots,
    case when o.metric = 'manual' then o.seq else o.tied end,
    o.seq,
    o.id, o.name, o.year, o.value, o.note, o.photo_path
  from ordered o
  -- A ceiling, not a design: the page is a list somebody scrolls, and five
  -- hundred names in one category is past the point of being read.
  where o.seq <= 500
  order by o.position, o.seq;
$$;


-- ===========================================================================
-- 5. Profile pages for the roster
--
-- The public half goes on roster_people, which anybody can already read. The
-- address that links a roster name to an account goes in a table of its own
-- with no public policy at all, because an email is not something the roster
-- page should be able to print by accident. Phone numbers from the form are
-- not stored anywhere.
-- ===========================================================================

alter table public.roster_people
  add column if not exists slug text,
  add column if not exists preferred_name text,
  add column if not exists year_branch text,
  add column if not exists tagline text,
  add column if not exists about text,
  add column if not exists hobbies text,
  add column if not exists fun_fact text,
  add column if not exists photo_url text,
  add column if not exists instagram text,
  add column if not exists linkedin text,
  add column if not exists github text,
  add column if not exists tenure text;

alter table public.roster_people drop constraint if exists roster_people_profile_sane;
alter table public.roster_people add constraint roster_people_profile_sane check (
      (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80)
  and (preferred_name is null or length(preferred_name) <= 80)
  and (year_branch is null or length(year_branch) <= 80)
  and (tagline is null or length(tagline) <= 240)
  and (about is null or length(about) <= 2000)
  and (hobbies is null or length(hobbies) <= 400)
  and (fun_fact is null or length(fun_fact) <= 500)
  and (tenure is null or length(tenure) <= 80)
  and (photo_url is null or (photo_url ~ '^https://' and length(photo_url) <= 400))
  and (instagram is null or (instagram ~ '^https://' and length(instagram) <= 300))
  and (linkedin is null or (linkedin ~ '^https://' and length(linkedin) <= 300))
  and (github is null or (github ~ '^https://' and length(github) <= 300))
);

comment on column public.roster_people.slug is
  'The address of this person''s page, /people/<slug>. Filled in from the name when a person is added and never changed by a rename, so a link somebody shared keeps working.';
comment on column public.roster_people.tenure is
  'Free text, for the history the roster keeps: "2026-27", or "Technical lead, 2026-27". Left empty rather than guessed.';

create or replace function public.roster_slugify(p text)
returns text
language sql
immutable
set search_path to 'public'
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(p, '')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.roster_people_slug()
returns trigger
language plpgsql
set search_path to 'public'
as $$
declare
  base text;
  candidate text;
  n integer := 1;
begin
  if new.slug is not null then
    new.slug := nullif(public.roster_slugify(new.slug), '');
  end if;

  if new.slug is null then
    base := coalesce(nullif(public.roster_slugify(new.name), ''), 'member');
    candidate := base;
    while exists (
      select 1 from public.roster_people r where r.slug = candidate and r.id <> new.id
    ) loop
      n := n + 1;
      candidate := base || '-' || n;
    end loop;
    new.slug := candidate;
  end if;

  return new;
end;
$$;

drop trigger if exists roster_people_slug on public.roster_people;
create trigger roster_people_slug
  before insert or update on public.roster_people
  for each row execute function public.roster_people_slug();

-- One row at a time, so each slug is checked against the ones already given.
do $$
declare r record;
begin
  for r in select id from public.roster_people where slug is null order by position, name loop
    update public.roster_people set slug = null where id = r.id;
  end loop;
end $$;

create unique index if not exists roster_people_slug_key on public.roster_people (slug);

create table if not exists public.roster_private (
  person_id uuid primary key references public.roster_people(id) on delete cascade,
  email text check (email is null or email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'),
  updated_at timestamptz not null default now()
);

comment on table public.roster_private is
  'The half of a roster entry the public page must never read: the address that ties the name to an account, which is how the account''s photo reaches the roster. No policy for anyone but organisers.';

alter table public.roster_private enable row level security;

drop policy if exists roster_private_read_admin on public.roster_private;
create policy roster_private_read_admin on public.roster_private
  for select to authenticated using (public.is_admin());

-- The account photo of everybody on the roster who has one, by roster id.
-- What the roster page shows when the committee has not set a photo of their
-- own, which after the photo step is everybody who has signed in.
create or replace function public.roster_photos()
returns table(person_id uuid, photo text)
language sql
stable
security definer
set search_path to 'public'
as $$
  select rp.person_id, p.photo_path
    from public.roster_private rp
    join public.roster_people r on r.id = rp.person_id and r.visible
    join public.profiles p on lower(p.email) = lower(rp.email)
   where p.photo_path is not null;
$$;

create or replace function public.admin_save_roster_profile(
  p_id uuid,
  p_slug text default null,
  p_preferred_name text default null,
  p_year_branch text default null,
  p_tagline text default null,
  p_about text default null,
  p_hobbies text default null,
  p_fun_fact text default null,
  p_photo_url text default null,
  p_instagram text default null,
  p_linkedin text default null,
  p_github text default null,
  p_tenure text default null,
  p_email text default null
)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_slug text := nullif(public.roster_slugify(p_slug), '');
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_name text;
  saved text;
begin
  if not public.admin_can('content') then
    raise exception 'You do not have access to the roster.' using errcode = '42501';
  end if;

  select name into v_name from public.roster_people where id = p_id;
  if v_name is null then
    raise exception 'That person is not on the roster any more.' using errcode = 'P0001';
  end if;

  if v_slug is not null and exists (
    select 1 from public.roster_people where slug = v_slug and id <> p_id
  ) then
    raise exception 'Somebody else''s page is already at /people/%.', v_slug using errcode = 'P0001';
  end if;

  update public.roster_people
     set slug           = coalesce(v_slug, slug),
         preferred_name = nullif(btrim(coalesce(p_preferred_name, '')), ''),
         year_branch    = nullif(btrim(coalesce(p_year_branch, '')), ''),
         tagline        = nullif(btrim(coalesce(p_tagline, '')), ''),
         about          = nullif(btrim(coalesce(p_about, '')), ''),
         hobbies        = nullif(btrim(coalesce(p_hobbies, '')), ''),
         fun_fact       = nullif(btrim(coalesce(p_fun_fact, '')), ''),
         photo_url      = nullif(btrim(coalesce(p_photo_url, '')), ''),
         instagram      = nullif(btrim(coalesce(p_instagram, '')), ''),
         linkedin       = nullif(btrim(coalesce(p_linkedin, '')), ''),
         github         = nullif(btrim(coalesce(p_github, '')), ''),
         tenure         = nullif(btrim(coalesce(p_tenure, '')), ''),
         updated_at     = now()
   where id = p_id
  returning slug into saved;

  if v_email is null then
    delete from public.roster_private where person_id = p_id;
  else
    insert into public.roster_private (person_id, email, updated_at)
    values (p_id, v_email, now())
    on conflict (person_id) do update set email = excluded.email, updated_at = now();
  end if;

  perform public.audit('roster.profile.saved', 'roster_person', p_id::text,
    jsonb_build_object('name', v_name, 'slug', saved));

  return saved;
end;
$$;


-- ===========================================================================
-- Seed: the committee's own answers
--
-- From "CESAC Roster (Form Responses)", the form the committee filled in
-- between 15 and 25 September 2026. Every one of the 25 said yes to
-- "show this info on the CESAC website". Transcribed with three kinds of
-- tidying and nothing else: whitespace, social links reduced to the profile
-- address without tracking parameters, and Drive share links reduced to the
-- file. A Drive folder, or a LinkedIn page given as a photo, is not a photo
-- and was left out. Phone numbers were not transcribed at all.
--
-- Matched on the roster's own spelling of the name, and only into empty
-- columns, so anything the committee has typed since stays as they typed it.
-- Kept in step with ROSTER_PROFILES in src/lib/data/roster-profiles.ts, which
-- is what the site shows when the database cannot be reached.
-- ===========================================================================

update public.roster_people rp
   set
       preferred_name = coalesce(rp.preferred_name, v.preferred_name),
       year_branch = coalesce(rp.year_branch, v.year_branch),
       tagline = coalesce(rp.tagline, v.tagline),
       about = coalesce(rp.about, v.about),
       hobbies = coalesce(rp.hobbies, v.hobbies),
       fun_fact = coalesce(rp.fun_fact, v.fun_fact),
       photo_url = coalesce(rp.photo_url, v.photo_url),
       instagram = coalesce(rp.instagram, v.instagram),
       linkedin = coalesce(rp.linkedin, v.linkedin),
       github = coalesce(rp.github, v.github),
       updated_at = now()
  from (values
  ('Rutuja Hadke', null, 'SY, Computer Engineering', '“A curious mind, a creative soul, and always up for something new.” 🌙', 'I am into media and content.. I am good at cinematics and quite good edits.
Mind be not good at word but good in edited videos', 'Photography, cinematography, travelling', null, null, 'https://www.instagram.com/its_ruttzz_/', 'https://www.linkedin.com/in/rutuja-hadke-902721385', null),
  ('Vedant Chavhan', null, 'SY, Computer Engineering', 'Tech innovator, esports lead, and proactive project manager bridging code, athletic focus, and community.', 'I work in event and coordination at CESAC, will be bringing ideas to life by overseeing end-to-end logistics and team workflows. I’m passionate about building memorable, seamless events that bring people together effectively. In my free time, I enjoy creative design, organizing gatherings, and keeping up with live production tech.', 'Sports, adventure.', null, 'https://drive.google.com/file/d/1mDSvxzXTOERTE4i-Xj-n2tNna2o5hjVG/view', 'https://www.instagram.com/vedantchavan_02/', 'https://www.linkedin.com/in/vedant-chavan-a3855b373', null),
  ('Prathmesh Mante', 'Pratham', 'SY, Computer Engineering', 'Turning ideas into things worth talking about.', 'I’m someone who enjoys turning ideas into real projects, whether it’s building something, planning an event, or figuring out how to make an idea better. At CESAC, I love being involved in the creative and technical side of things and working with people who are just as driven to build and experiment. Always curious, always learning, and usually working on something new.', 'Technology, AI, building projects, hackathons, film making, music, exploring new ideas.', 'I can turn a random idea at 2 AM into a full-blown project by morning.', 'https://drive.google.com/file/d/12ej4KaZgg51vtHT9-jzI_4_bfTkzSr8b/view', 'https://www.instagram.com/prathmesh_mante/', 'https://www.linkedin.com/in/prathmesh-mante-989aa7384', 'https://github.com/prathmeshmante-glitch'),
  ('Kadambari Dhaygude', null, 'TY, Computer Engineering', null, null, 'Singing', null, null, null, null, null),
  ('Shreya Kiran Kothawade', null, 'SY, Computer Engineering', 'Always learning. Always building. Never Settling.', 'I’m a part of the Technical Team at CESAC, where I work on exploring technology and building innovative projects. I’m particularly interested in AI, software development, and learning new technologies by turning ideas into practical solutions. Still learning. Still building. Never settling.', null, 'I like turning thoughts and feelings into poetry—sometimes a simple moment is enough to inspire a few lines.', null, null, null, null),
  ('Suhani Avinash Gawade', null, 'TY, Computer Engineering', null, null, 'Travelling, Crafting', null, null, null, null, null),
  ('Aditya Kale', null, 'SY, Computer Engineering', 'Somewhere between sorted and spontaneous', 'I work behind the scenes at CESAC, where plans, people, and last-minute changes somehow have to come together. I enjoy the process of taking an idea and giving it a shape, a space, and a little personality. I’m drawn to things that look simple on the outside but have a lot going on behind them.', 'Curiosity, reading, writing, poetry, music, visual aesthetics, creative ideas, spontaneous plans, photography', 'I notice what’s missing between good and great.', null, 'https://www.instagram.com/adityakale__7/', 'https://www.linkedin.com/in/aditya-kale-6aa978314', 'https://github.com/Aditya-Kale018'),
  ('Chaitanya Yemul', null, 'SY, Computer Engineering', 'Curious Beyond Measure', 'Technical Team Member at CESAC, focused on Backend Development.
Working with Python and FastAPI for backend development.', 'Anime, Listening Songs, Travelling', 'Anime addict with an unhealthy curiosity for discovering new AI tools.', 'https://drive.google.com/file/d/1uFOIgAiCalTrzJqk3Igb__o2rzD9itO5/view', 'https://www.instagram.com/chaitanya_yemul/', 'https://www.linkedin.com/in/chaitanya-yemul-831b15330', 'https://github.com/ChaitanyaYemul'),
  ('Harsh Manjramkar', null, 'TY, Computer Engineering', 'Thinking deeper. Leading stronger. Winning together', 'I work as the tech lead at CESAC. My main interests are to critically analyse problems or projects such that no flaws or limitations occur while or after execution, i am also into system design and believe in designing systems using own thoughts before distributing the work to ai', 'Badminton, Table tennis, anime', null, null, 'https://www.instagram.com/harsh_manjramkar/', null, null),
  ('Ansh Singh Gurdatta', null, 'SY, Computer Engineering', 'Building, learning and turning ideas into impact', 'I’m part of the Events and Coordination team at CESAC, where I help plan, organize, and execute engaging events. I enjoy working with people, coordinating teams, and making sure things run smoothly from planning to execution.', 'Dancing, playing sports and travelling', null, null, 'https://www.instagram.com/ansh_gurdatta/', 'https://www.linkedin.com/in/ansh-singh-gurdatta-161681379', 'https://github.com/Ansh-Singh-Gurdatta'),
  ('Manthan Mahesh Devi', 'Manthan Devi', 'SY, Computer Engineering', 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥', 'Second-year computer engineering undergrad contributing to technical initiatives and events at CESAC. I’m deep into data structures, algorithms, and exploring machine learning and neural networks, with an eye toward fintech down the line. Outside the terminal, you’ll find me training taekwondo on the mats or playing guitar.', 'DSA, Chess, badminton, taekwondo 🥋, guitar, reading.', 'I am a world class taekwondo player who recently represented India in world taekwondo olympics at South Korea and won 1 gold and 3 silver on the international stage✨', null, 'https://www.instagram.com/devimanthan/', 'https://www.linkedin.com/in/manthan-devi-8764a3386', 'https://github.com/coder-manthan-007'),
  ('Aditi Parmeshwar Shingare', null, 'SY, Computer Engineering', 'Believing me blindly', 'A core team member involved in interacting and coordinating between fellow members. Involved in planning and conduction of all our events. Handles the people''s side of the committee.', 'Learning new Technologies, Debating, Public Speaking, Interacting with new people', 'I do Sing', 'https://drive.google.com/file/d/1PRlWDJTd0jCl8EyepHdnkAIkLj_gMnlq/view', 'https://www.instagram.com/jiyaaa_1951/', 'https://www.linkedin.com/in/aditi-shingare-726820385', 'https://github.com/aditi1251070842-ui'),
  ('Shruti Vishwanath Chandolkar', null, 'SY, Computer Science', 'Taking responsibility seriously, but never taking life too seriously.', 'I’m a Computer Science Engineering student who loves learning new things and trying new experiences. I’m responsible when it comes to work, but I also believe that a little fun makes everything better. I’m looking forward to learning, contributing, and meeting new people through CESAC.', 'Music, dancing, badminton, travelling, technology, learning new things', 'I may take time to open up, but once I’m comfortable, I can turn into the most talkative and fun person in the room!', null, 'https://www.instagram.com/__shruti_2008__/', 'https://www.linkedin.com/in/shruti-chandolkar-32b6bb3ba', null),
  ('Rajvardhan Patil', null, 'SY, Computer Engineering', 'Curiosity is my starting point. Creation is my answer.', 'I’m part of the Media domain at CESAC, where I contribute to shaping how the association communicates and connects with students. I enjoy turning ideas into engaging content and finding creative ways to make information stand out. I’m always keen to experiment, take on new challenges, and bring a fresh perspective to the team.', 'Sketching, video editing, hiking, fitness, playing guitar and flute, exploring technology, creative problem-solving, and building practical solutions.', 'I can get ridiculously invested in an idea at 2 AM and somehow turn it into a project by morning.', null, 'https://www.instagram.com/https.rajvardhan/', 'https://www.linkedin.com/in/rajvardhan-patil-b354423a8', 'https://github.com/RajvardhanS-Patil'),
  ('Nandita Kharade', null, 'TY, Computer Engineering', 'Making connections, creating opportunities.', 'As CESAC’s Industry & Outreach Lead, I build meaningful connections, explore opportunities, and turn conversations into collaborations', null, null, 'https://drive.google.com/file/d/1FDAVFnaTwRya7_5TVx8yho1vpuhH4zMK/view', 'https://www.instagram.com/nandita_1415/', 'https://www.linkedin.com/in/nandita-kharade-395084332', null),
  ('Roshani Khankure', null, 'TY, Computer Engineering', 'Quietly ambitious, casually chaotic. 😌', 'I bring out ideas and event management tips to the team. Currently looking forward as a POC for alumni connect to the students looking for companies, startups, entrepreneurs, etc. I joined CESAC so that the dream of getting placed expands to a dream of a happy career.', 'Writing, Organizing, Dance.', 'Making last-minute plans somehow work.', 'https://drive.google.com/file/d/1KFfb8oV5v59PgvppX39Q2LV6WJmUdCW3/view', 'https://www.instagram.com/rosh.1149/', null, 'https://github.com/rosh1149'),
  ('Pranav Sable', null, 'TY, Computer Engineering', 'I do whatever makes sense to me', 'The lead of media and content. I handle the socials of CESAC.', 'Sketching, gaming, cooking, coding, editing, travelling', 'I can crochet', 'https://drive.google.com/file/d/1lfDbOgt2GMGZVR7r8WTXKJ0_dU4P1QHC/view', 'https://www.instagram.com/pranavss730/', 'https://www.linkedin.com/in/pranavss73', 'https://github.com/pranavss73'),
  ('Ayush Khatal', null, 'TY, Computer Engineering', 'Thoda overthink, phir overdeliver.', 'I’m on the CESAC Board of Executives, helping handle everything from planning and executing events to making sure the team stays on track. I’m into tech, creative ideas, and turning ambitious plans into things that actually happen.', 'Badminton, Piano, Cricket, Music, Chilling with friends', null, null, 'https://www.instagram.com/ayush.k_136/', 'https://www.linkedin.com/in/ayushkhatal', 'https://github.com/Ayush136-devops'),
  ('Shraddha Khetmalis', null, 'TY, Computer Engineering', 'Making connections, chasing opportunities, and collecting a little tea along the way.', 'I’m part of CESAC’s Industry & Outreach team, where I focus on identifying potential industry partners, reaching out to companies and professionals, and building collaborations for CESAC’s events and initiatives. I enjoy networking, communicating with new people, and finding opportunities that can create value for both the committee and our partners', 'Books, paint & journals, harmonica, cooking, cinema, travel, food, makeup & tech', 'I’m always ready for some tea and probably have some gyaan to add to it.🦖', 'https://drive.google.com/file/d/1C2AFkPirleRtyzSf623ZFNlW7-lFRFWq/view', 'https://www.instagram.com/shraddha__0_9/', 'https://www.linkedin.com/in/shraddha-khetmalis-75b05b410', 'https://github.com/shraddhaa09'),
  ('Kanak Agrawal', null, 'TY, Computer Engineering', 'Think beyond. Build forward.', 'I’m Kanak, a Core Member at CESAC, where I help plan and execute initiatives for the Computer Engineering community. I enjoy working with people to turn ideas into action.', 'Trekking, Painting, Reading', 'I get way too excited whenever a new idea pops into my head.', null, 'https://shorturl.at/fnDCx', 'https://shorturl.at/mo5md', 'https://github.com/Kanak-Agrawal-3008'),
  ('Harshada Bhapkar', 'Harsha', 'TY, Computer Engineering', null, null, null, null, null, null, null, null),
  ('Aditya Krushna Chavan', null, 'SY, Computer Engineering', 'Too distracted too distract', 'Do suggest ideas, makes things work out and execute the task ( sach bolu to sirf mauj masti)', 'Take a nap which last longs in hours', 'I can touch my nose with my tongue', 'https://drive.google.com/file/d/15tAjm9yfhrpr0teAmHtdUvdg035DLJX3/view', 'https://www.instagram.com/aditya_chavan_0704/', 'https://www.linkedin.com/in/adityachavan0704', 'https://github.com/adityachavan0704-web'),
  ('Vedant Gaidhani', null, 'TY, Computer Engineering', 'Code, creativity, and a little bit of chaos', 'Tech Lead at CESAC who loves building things that push the boundaries of technology and creativity. I work with AI, web development, and emerging tech. At CESAC, I focus on the technical side while helping the team experiment, build, and bring ambitious ideas to life.', 'Sports, AI, Hackathons, Web Development, 3D & Creative Tech', null, null, null, null, null),
  ('Jasleen Kaur Multani', null, 'TY, Computer Engineering', 'Turning technical possibilities into practical outcomes.', 'As the Technical Lead at CESAC, I work on driving the technical direction of the club and turning ideas into practical, impactful projects. I’m particularly interested in emerging technologies, AI/ML, software development, and building solutions that combine innovation with real-world applications.', 'Hand made crafts', 'I play harmonium', null, 'https://www.instagram.com/jasleeeen.kaur_/', 'https://www.linkedin.com/in/jasleen-multani-74a9b0333', 'https://github.com/jasleenk8999'),
  ('Viral Dhoka', 'Viral/Viralala', 'SY, Computer Engineering', 'Death is the fear', 'I am Viral Dhoka, Core member of CESAC and studying in VIT right now. I am the creator of this website', 'WebDev, Valorant, Every sport', 'I love competition and I am a professional Valorant Player', null, 'https://www.instagram.com/viraldrafts/', 'https://www.linkedin.com/in/viral-dhoka-1aa3b4318', 'https://github.com/viralala')
  ) as v(name, preferred_name, year_branch, tagline, about, hobbies, fun_fact, photo_url, instagram, linkedin, github)
 where rp.name = v.name;

-- The address each answer came from, which is how the roster finds the
-- account's photo. One form was filled in from a personal address; the
-- account it belongs to is the college one, and that is what is linked.
insert into public.roster_private (person_id, email)
select rp.id, v.email
  from (values
  ('Rutuja Hadke', 'rutuja.1251071023@vit.edu'),
  ('Vedant Chavhan', 'vedant.1251070273@vit.edu'),
  ('Prathmesh Mante', 'prathmesh.1251070807@vit.edu'),
  ('Kadambari Dhaygude', 'kadambari.dhaygude25@vit.edu'),
  ('Shreya Kiran Kothawade', 'shreya.1251070146@vit.edu'),
  ('Suhani Avinash Gawade', 'suhani.gawade25@vit.edu'),
  ('Aditya Kale', 'aditya.1251070575@vit.edu'),
  ('Chaitanya Yemul', 'chaitanya.1251070141@vit.edu'),
  ('Harsh Manjramkar', 'harsh.manjramkar24@vit.edu'),
  ('Ansh Singh Gurdatta', 'ansh.1251070734@vit.edu'),
  ('Manthan Mahesh Devi', 'manthan.1251070654@vit.edu'),
  ('Aditi Parmeshwar Shingare', 'aditi.1251070842@vit.edu'),
  ('Shruti Vishwanath Chandolkar', 'shruti.1251070232@vit.edu'),
  ('Rajvardhan Patil', 'rajvardhan.1251070544@vit.edu'),
  ('Nandita Kharade', 'nandita.kharade24@vit.edu'),
  ('Roshani Khankure', 'roshani.khankure24@vit.edu'),
  ('Pranav Sable', 'pranav.sable24@vit.edu'),
  ('Ayush Khatal', 'ayush.khatal24@vit.edu'),
  ('Shraddha Khetmalis', 'shraddha.khetmalis24@vit.edu'),
  ('Kanak Agrawal', 'kanak.agrawal241@vit.edu'),
  ('Harshada Bhapkar', 'harshada.bhapkar25@vit.edu'),
  ('Aditya Krushna Chavan', 'aditya.1251070169@vit.edu'),
  ('Vedant Gaidhani', 'vedant.gaidhani242@vit.edu'),
  ('Jasleen Kaur Multani', 'jasleen.multani24@vit.edu'),
  ('Viral Dhoka', 'viral.1251070777@vit.edu')
  ) as v(name, email)
  join public.roster_people rp on rp.name = v.name
on conflict (person_id) do nothing;


-- ===========================================================================
-- 6. When an event actually is
--
-- when_label stays: it is the sentence the cards print, and "3-4 October 2026,
-- venue TBA" says more than a pair of timestamps. These are what a calendar
-- entry and a countdown need, and they stay empty until the date is real,
-- which is the signal for the site to say so instead of counting down to a
-- guess. An all-day event counts its days in India time: starts_at is the
-- first day and ends_at the last one, both inclusive.
-- ===========================================================================

alter table public.dept_events
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists all_day boolean not null default false,
  add column if not exists venue text;

alter table public.dept_events drop constraint if exists dept_events_schedule_sane;
alter table public.dept_events add constraint dept_events_schedule_sane check (
      (ends_at is null or starts_at is not null)
  and (ends_at is null or ends_at >= starts_at)
  and (venue is null or length(venue) <= 160)
);

-- Public, because the event pages run for signed-out visitors and
-- dept_events is closed to them: it carries updated_by, an organiser's id.
create or replace function public.event_schedule()
returns table(slug text, starts_at timestamptz, ends_at timestamptz, all_day boolean, venue text)
language sql
stable
security definer
set search_path to 'public'
as $$
  select d.slug, d.starts_at, d.ends_at, d.all_day, d.venue
    from public.dept_events d
   order by d.position, d.name;
$$;

create or replace function public.admin_set_event_schedule(
  p_slug text,
  p_starts_at timestamptz default null,
  p_ends_at timestamptz default null,
  p_all_day boolean default false,
  p_venue text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.admin_can('events') then
    raise exception 'Organisers only.' using errcode = '42501';
  end if;
  if p_ends_at is not null and p_starts_at is null then
    raise exception 'An event with an end needs a start.' using errcode = 'P0001';
  end if;
  if p_ends_at is not null and p_ends_at < p_starts_at then
    raise exception 'The event cannot end before it starts.' using errcode = 'P0001';
  end if;

  update public.dept_events
     set starts_at  = p_starts_at,
         ends_at    = p_ends_at,
         all_day    = coalesce(p_all_day, false),
         venue      = nullif(btrim(coalesce(p_venue, '')), ''),
         updated_by = auth.uid(),
         updated_at = now()
   where slug = p_slug;

  if not found then
    raise exception 'There is no event %.', p_slug using errcode = 'P0001';
  end if;

  perform public.audit('event.schedule', 'dept_event', p_slug,
    jsonb_build_object('starts_at', p_starts_at, 'ends_at', p_ends_at,
                       'all_day', coalesce(p_all_day, false)));
end;
$$;

-- The one date that has been announced: Attack on Token, 3 and 4 October
-- 2026, from the sponsorship deck. Hours and venue are not set, so it is an
-- all-day entry. Only into an empty row, so a date the committee has since
-- corrected stays corrected.
update public.dept_events
   set starts_at = '2026-10-03 00:00:00+05:30',
       ends_at   = '2026-10-04 00:00:00+05:30',
       all_day   = true
 where slug = 'attack-on-token'
   and starts_at is null;


-- ===========================================================================
-- Grants
--
-- Granting to a role does not remove Postgres's default grant to PUBLIC, so
-- each of these is revoked by name before it is handed out. The two trigger
-- functions are left alone: nothing can call a trigger function directly,
-- and a revoke there would only be one more thing that could get in the way
-- of the auth service's own cascades.
-- ===========================================================================

do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure::text as sig, p.proname
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in (
         'admin_set_password', 'admin_clear_photo', 'ranking_board',
         'standouts_board', 'roster_photos', 'admin_save_roster_profile',
         'event_schedule', 'admin_set_event_schedule')
  loop
    execute format('revoke all on function %s from public, anon', fn.sig);
    if fn.proname in ('standouts_board', 'roster_photos', 'event_schedule') then
      execute format('grant execute on function %s to anon, authenticated', fn.sig);
    else
      execute format('grant execute on function %s to authenticated', fn.sig);
    end if;
  end loop;
end $$;
