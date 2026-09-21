-- ---------------------------------------------------------------------------
-- Student records, the points scale, the front page showcase, an editable
-- roster and site copy, and organiser roles that Postgres actually enforces.
--
-- 21 September 2026.
--
-- Applied to the live project as seven migrations, in this order:
--
--   20260921135358  student_records_kinds_levels_and_files
--   20260921135411  scoring_table_and_ranking_rewrite
--   20260921135445  editable_roster_site_text_and_showcase
--   20260921135509  admin_capabilities_and_console_controls
--   20260921135536  console_content_controls
--   20260921141809  new_author_columns_release_a_deleted_profile
--   20260921141843  close_anon_access_to_the_new_functions
--
-- This file is the whole of that, in one piece, idempotent and re-runnable.
-- It is the same arrangement 20260918_ems_schema.sql uses, and for the same
-- reason: the pieces were applied separately so a failure would be localised,
-- and they are kept together so somebody rebuilding the project runs one file.
--
-- WHAT IT IS FOR
--
-- The department files its publications on "Formats.xlsx", which carries four
-- layouts: journal, conference, book, book chapter. Students had nowhere to
-- put any of them, and nowhere to record how far a hackathon reached or when
-- it happened. All of it lands on public.certificates rather than a new table,
-- because a row there has always been a claim about something a student did
-- with a file to back it up, and a publication is the same claim with
-- different fields and usually no file at all. Two tables would have meant two
-- ranking functions, two review queues, two exports and two sets of row level
-- security, kept in step by hand.
--
-- Three of the sheet's columns are deliberately never asked of a student,
-- because the site already knows them: the department (this is the Computer
-- Engineering department's site), the serial number (generated on export) and
-- "Data entered by" (the signed-in account).
-- ---------------------------------------------------------------------------


-- ===========================================================================
-- 1. Kinds, levels, and the columns each layout needs
-- ===========================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'achievement_kind') then
    create type public.achievement_kind as enum
      ('event', 'journal', 'conference', 'book', 'book_chapter');
  end if;
  if not exists (select 1 from pg_type where typname = 'achievement_level') then
    create type public.achievement_level as enum
      ('international', 'national', 'state', 'zonal', 'institute', 'other');
  end if;
end$$;

-- A journal paper has no certificate. Every file column was NOT NULL because
-- the table only ever held certificates, and the whole point of this change is
-- that it no longer does. drive_file_id keeps its unique index: Postgres
-- allows any number of nulls in one.
alter table public.certificates
  alter column file_name     drop not null,
  alter column mime_type     drop not null,
  alter column size_bytes    drop not null,
  alter column drive_file_id drop not null,
  alter column drive_link    drop not null;

-- Named for what they hold rather than for the sheet's wording, because four
-- of the five layouts want the same field under a different heading. The
-- COMMENT on each says which sheet column it is.
alter table public.certificates
  add column if not exists kind public.achievement_kind not null default 'event',
  add column if not exists level public.achievement_level,
  add column if not exists happened_on date,
  add column if not exists primary_author text,
  add column if not exists secondary_authors text,
  add column if not exists venue_name text,
  add column if not exists indexing text,
  add column if not exists quartile text,
  add column if not exists impact_factor numeric(7,3),
  add column if not exists peer_reviewed boolean,
  add column if not exists e_journal boolean,
  add column if not exists specialization text,
  add column if not exists volume text,
  add column if not exists edition text,
  add column if not exists isbn_issn text,
  add column if not exists location text,
  add column if not exists page_numbers text,
  add column if not exists place_of_publication text,
  add column if not exists publisher text,
  add column if not exists publication_year integer,
  add column if not exists is_edited boolean,
  add column if not exists chapter_name text,
  add column if not exists entered_by uuid references public.profiles(id) on delete set null;

comment on column public.certificates.kind is
  'Which of the five layouts this row is. event covers hackathons and competitions; the other four are the publication formats from Formats.xlsx.';
comment on column public.certificates.level is
  'International, national, state, zonal or institute. Asked of hackathons and publications alike, and it is part of the score.';
comment on column public.certificates.happened_on is
  'The date of the event, the conference, or the publication.';
comment on column public.certificates.venue_name is
  'Sheet: "Name of the Journal" or "Name of the Conference". One column, because no row is both.';
comment on column public.certificates.chapter_name is
  'Sheet: "Chapter number and Name". Book chapters only; the book''s own title is in event_name.';
comment on column public.certificates.entered_by is
  'Sheet: "Data entered by". The account that typed it.';
comment on column public.certificates.event_name is
  'The title of the thing: the event name for a hackathon, the paper title for a journal or conference, the book title for a book or a book chapter.';

alter table public.certificates drop constraint if exists certificates_publication_year_sane;
alter table public.certificates add constraint certificates_publication_year_sane
  check (publication_year is null or publication_year between 1900 and 2100);

alter table public.certificates drop constraint if exists certificates_impact_factor_sane;
alter table public.certificates add constraint certificates_impact_factor_sane
  check (impact_factor is null or (impact_factor >= 0 and impact_factor <= 1000));

-- Either the five file columns are all set or all null, which is what makes
-- "has a file" a single readable test everywhere else.
alter table public.certificates drop constraint if exists certificates_file_all_or_nothing;
alter table public.certificates add constraint certificates_file_all_or_nothing check (
  (drive_file_id is null and drive_link is null and file_name is null
    and mime_type is null and size_bytes is null)
  or
  (drive_file_id is not null and drive_link is not null and file_name is not null
    and mime_type is not null and size_bytes is not null)
);

-- Rows that predate all of this are hackathon certificates with a file and no
-- level or date recorded. They are left honestly blank rather than guessed at.
update public.certificates set entered_by = coalesce(entered_by, owner_id)
 where entered_by is null;

create index if not exists certificates_kind_idx on public.certificates (kind);
create index if not exists certificates_owner_created_idx
  on public.certificates (owner_id, created_at desc);


-- ===========================================================================
-- 2. The three optional photos
--
-- "the photo of the prize, their photo at the event or photo they clicked with
-- the HOD (everything optional)". A separate table rather than three more file
-- columns: the slots will grow, a row per file keeps the Drive id unique
-- without three partial indexes, and deleting the record takes the files with
-- it. The certificate itself stays on certificates.drive_* where it has always
-- been, so there is one copy of each fact and not two.
-- ===========================================================================

create table if not exists public.certificate_files (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null references public.certificates(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slot text not null check (slot in ('prize', 'event', 'hod', 'other')),
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  drive_file_id text not null unique,
  drive_link text not null,
  created_at timestamptz not null default now()
);

comment on table public.certificate_files is
  'The optional extras against one record: the prize, the student at the event, the student with the HOD. The certificate itself is on certificates.drive_link.';

-- One photo per slot per record. A second prize photo replaces the first
-- rather than stacking, which is what a control labelled "Prize photo" reads
-- as.
create unique index if not exists certificate_files_one_per_slot
  on public.certificate_files (certificate_id, slot);
create index if not exists certificate_files_owner_idx
  on public.certificate_files (owner_id);

alter table public.certificate_files enable row level security;

drop policy if exists certificate_files_read on public.certificate_files;
create policy certificate_files_read on public.certificate_files
  for select using (owner_id = auth.uid() or public.is_admin());

-- The owner check is not enough on its own: without the EXISTS, a crafted
-- insert could hang a file off somebody else's record while still naming
-- itself as the owner.
drop policy if exists certificate_files_insert_own on public.certificate_files;
create policy certificate_files_insert_own on public.certificate_files
  for insert with check (
    owner_id = auth.uid()
    and exists (select 1 from public.certificates c
                 where c.id = certificate_id and c.owner_id = auth.uid())
  );

drop policy if exists certificate_files_delete on public.certificate_files;
create policy certificate_files_delete on public.certificate_files
  for delete using (owner_id = auth.uid() or public.is_admin());


-- ===========================================================================
-- 3. A student may correct their own record
--
-- There was no update policy and no delete policy, so a typo in an event name
-- was permanent and a duplicate could only be removed from the dashboard. Both
-- stop the moment an organiser has verified the row: a record somebody has
-- checked and agreed with is not one its owner may quietly rewrite.
-- ===========================================================================

drop policy if exists certificates_update_own on public.certificates;
create policy certificates_update_own on public.certificates
  for update to authenticated
  using (owner_id = auth.uid() and verified = false)
  with check (owner_id = auth.uid() and verified = false);

drop policy if exists certificates_delete on public.certificates;
create policy certificates_delete on public.certificates
  for delete to authenticated
  using ((owner_id = auth.uid() and verified = false) or public.is_admin());

-- The update policy above allows the write; this refuses the columns that are
-- not the owner's to set. Without it a student could hand themselves the
-- verified mark on their own row.
create or replace function public.guard_certificate_verification()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if public.is_admin() then return new; end if;

  if new.verified is distinct from old.verified
     or new.verified_by is distinct from old.verified_by
     or new.verified_at is distinct from old.verified_at then
    raise exception 'Only an organiser can verify a record.' using errcode = '42501';
  end if;

  -- Moving a row to another account is not an edit, it is a transfer.
  if new.owner_id is distinct from old.owner_id then
    raise exception 'A record cannot change hands.' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists certificates_guard_verification on public.certificates;
create trigger certificates_guard_verification
  before update on public.certificates
  for each row execute function public.guard_certificate_verification();


-- ===========================================================================
-- 4. The points scale, out of the code and into a table
--
-- Participation was worth 10 against a first prize's 100, which reads as "your
-- turning up is a rounding error" and is the opposite of what the committee
-- wants the board to say. It is 40 now, and the level reached is added on top,
-- so a national hackathon somebody entered and did not place in scores 70.
--
-- Every number is a row rather than a constant, so the committee can move them
-- without a deploy. certificate_points() is left exactly as it was: the ems
-- analytics views read it, and nothing here needs it.
-- ===========================================================================

create table if not exists public.scoring (
  key text primary key,
  band text not null check (band in ('contribution', 'level', 'kind')),
  label text not null,
  hint text,
  points integer not null default 0 check (points between 0 and 10000),
  position integer not null default 0,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

comment on table public.scoring is
  'What each part of a record is worth. A record scores its base (its contribution for an event, its kind for a publication) plus its level. Edited from the organiser console, never from the code.';

insert into public.scoring (key, band, label, hint, points, position) values
  ('contribution:participation', 'contribution', 'Participation',
   'Entered and took part. Deliberately generous: the board is meant to move people to enter things.', 40, 1),
  ('contribution:third', 'contribution', 'Third prize', null, 70, 2),
  ('contribution:second', 'contribution', 'Second prize', null, 85, 3),
  ('contribution:first', 'contribution', 'First prize', null, 100, 4),
  ('kind:journal', 'kind', 'Journal publication', 'The base for a paper in a journal, before the level is added.', 90, 1),
  ('kind:conference', 'kind', 'Conference publication', null, 70, 2),
  ('kind:book', 'kind', 'Book', null, 120, 3),
  ('kind:book_chapter', 'kind', 'Book chapter', null, 80, 4),
  ('level:international', 'level', 'International', 'Added on top of the base, for every kind of record.', 50, 1),
  ('level:national', 'level', 'National', null, 30, 2),
  ('level:state', 'level', 'State', null, 20, 3),
  ('level:zonal', 'level', 'Zonal', null, 12, 4),
  ('level:institute', 'level', 'Institute', null, 6, 5),
  ('level:other', 'level', 'Not stated', 'What a record scores when nobody said how far it reached.', 0, 6)
on conflict (key) do nothing;

alter table public.scoring enable row level security;

-- Readable by anyone, because the public showcase and the student console both
-- print the scale, and a scale nobody can read is a score nobody can check.
-- Writes go through admin_set_points(); no policy here grants an UPDATE.
drop policy if exists scoring_read_all on public.scoring;
create policy scoring_read_all on public.scoring
  for select to anon, authenticated using (true);

-- Base plus level. An event's base is what the student came away with; a
-- publication's base is the kind of publication it is, because there is no
-- first or second place in a journal. A missing level scores the 'other' row
-- rather than nothing, so the number is always the sum of two named rows and
-- can always be explained to the student who asks.
create or replace function public.achievement_points(
  p_kind public.achievement_kind,
  p_contribution public.certificate_contribution,
  p_level public.achievement_level
)
returns integer language sql stable set search_path to 'public' as $$
  select
    coalesce((select s.points from public.scoring s
               where s.key = case
                 when p_kind = 'event'
                   then 'contribution:' || coalesce(p_contribution::text, 'participation')
                 else 'kind:' || p_kind::text
               end), 0)
    +
    coalesce((select s.points from public.scoring s
               where s.key = 'level:' || coalesce(p_level::text, 'other')), 0);
$$;

-- The board and the standing, rebuilt on the new scale. Same shape as before,
-- so nothing calling them has to change.
create or replace function public.ranking_board(p_limit integer default 10)
returns table(place bigint, student_id uuid, name text, year text,
              points bigint, certificates bigint)
language sql stable security definer set search_path to 'public' as $$
  with tally as (
    select
      p.id,
      coalesce(nullif(btrim(p.full_name), ''), split_part(p.email, '@', 1)) as name,
      p.year,
      coalesce(sum(public.achievement_points(c.kind, c.contribution, c.level)), 0)::bigint as points,
      count(c.id)::bigint as certificates
    from public.profiles p
    left join public.certificates c on c.owner_id = p.id
    where p.role = 'participant'
    group by p.id, p.full_name, p.email, p.year
  )
  select rank() over (order by points desc, certificates desc, name asc),
         id, name, year, points, certificates
  from tally
  where certificates > 0
  order by 1, name
  limit greatest(1, least(coalesce(p_limit, 10), 100));
$$;

create or replace function public.my_standing()
returns table(place bigint, points bigint, certificates bigint,
              ranked_students bigint, prize_total_inr bigint)
language sql stable security definer set search_path to 'public' as $$
  with tally as (
    select
      p.id,
      coalesce(nullif(btrim(p.full_name), ''), split_part(p.email, '@', 1)) as name,
      coalesce(sum(public.achievement_points(c.kind, c.contribution, c.level)), 0)::bigint as points,
      count(c.id)::bigint as certificates,
      coalesce(sum(c.prize_amount_inr), 0)::bigint as prize_total
    from public.profiles p
    left join public.certificates c on c.owner_id = p.id
    where p.role = 'participant'
    group by p.id, p.full_name, p.email
  ),
  ranked as (
    select id, rank() over (order by points desc, certificates desc, name asc) as place,
           points, certificates, prize_total
    from tally where certificates > 0
  )
  select r.place, r.points, r.certificates, (select count(*) from ranked), r.prize_total
  from ranked r where r.id = auth.uid();
$$;


-- ===========================================================================
-- 5. The roster, out of the source file and into the database
--
-- Correcting a lecturer's title used to be a commit, a build and a deploy.
-- src/lib/data/committee.ts still carries the same names and is still what
-- renders when the database cannot be reached; getRoster() decides between
-- them.
-- ===========================================================================

create table if not exists public.roster_groups (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  kind text not null check (kind in ('people', 'names', 'vertical')),
  title text not null,
  jp text,
  remit text,
  index_label text,
  accent text,
  position integer not null default 0,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

comment on table public.roster_groups is
  'One block on the /people page. kind decides how it renders: people carry a title, names are pills, verticals carry a number, a remit and an accent colour.';

create table if not exists public.roster_people (
  id uuid primary key default gen_random_uuid(),
  group_id text not null references public.roster_groups(id) on delete cascade,
  name text not null check (btrim(name) <> '' and length(name) <= 120),
  role text check (role is null or length(role) <= 120),
  rank text check (rank is null or rank in ('lead', 'head')),
  position integer not null default 0,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists roster_people_group_idx
  on public.roster_people (group_id, position, name);

alter table public.roster_groups enable row level security;
alter table public.roster_people enable row level security;

drop policy if exists roster_groups_read_all on public.roster_groups;
create policy roster_groups_read_all on public.roster_groups
  for select to anon, authenticated using (true);

drop policy if exists roster_people_read_all on public.roster_people;
create policy roster_people_read_all on public.roster_people
  for select to anon, authenticated using (true);

insert into public.roster_groups (id, kind, title, jp, remit, index_label, accent, position) values
  ('faculty', 'people', 'Faculty leadership', null, null, null, null, 1),
  ('student-leadership', 'people', 'Student leadership', null, null, null, null, 2),
  ('board', 'names', 'Board of executives', null, null, null, null, 3),
  ('associates', 'names', 'Associate executives', null, null, null, null, 4),
  ('technical', 'vertical', 'Technical', '技術',
   'Platforms, tooling and anything the events run on.', '01', 'azure', 5),
  ('media', 'vertical', 'Media and Content', '広報',
   'Key art, copy, capture and the recap.', '02', 'violet', 6),
  ('events', 'vertical', 'Event and Coordination', '運営',
   'Run of show, venue, volunteers and logistics.', '03', 'lime', 7),
  ('outreach', 'vertical', 'Industry and Outreach', '渉外',
   'Sponsors, partners, judges and mentors.', '04', 'pink', 8)
on conflict (id) do nothing;

-- Transcribed from "CESAC TEAM.xlsx", with one correction the committee asked
-- for on 21 September: Dr. Aarti Agarkar is Asst Head-Admin Computer
-- Engineering, not Assistant HOD.
--
-- The guard at the end seeds only into an empty table. Re-running this file
-- against a roster the committee has since edited must not put deleted people
-- back or undo a title they changed.
insert into public.roster_people (group_id, name, role, rank, position)
select v.group_id, v.name, v.role, v.rank, v.position
from (values
  ('faculty', 'Dr. Sandeep Shinde', 'HOD, Computer Engineering', null, 1),
  ('faculty', 'Dr. Aarti Agarkar', 'Asst Head-Admin Computer Engineering', null, 2),
  ('faculty', 'Dr. Geeta Navale', 'Student Activity Co-Ordinator', null, 3),
  ('student-leadership', 'Yeshwant Kendre', 'Department Representative', null, 1),
  ('board', 'Aditya Raj Tripathi', null, null, 1),
  ('board', 'Ayush Khatal', null, null, 2),
  ('board', 'Samarth Khedkar', null, null, 3),
  ('board', 'Om Kharate', null, null, 4),
  ('board', 'Manas Kenjale', null, null, 5),
  ('board', 'Kanak Agrawal', null, null, 6),
  ('board', 'Roshani Khankure', null, null, 7),
  ('associates', 'Viral Dhoka', null, null, 1),
  ('associates', 'Aditi Parmeshwar Shingare', null, null, 2),
  ('technical', 'Harsh Manjramkar', null, 'lead', 1),
  ('technical', 'Vedant Gaidhani', null, 'lead', 2),
  ('technical', 'Jasleen Kaur Multani', null, 'lead', 3),
  ('technical', 'Chaitanya Yemul', null, 'head', 4),
  ('technical', 'Manthan Mahesh Devi', null, 'head', 5),
  ('technical', 'Shreya Kiran Kothawade', null, 'head', 6),
  ('technical', 'Aditya Krushna Chavan', null, 'head', 7),
  ('media', 'Pranav Sable', null, 'lead', 1),
  ('media', 'Harshada Bhapkar', null, 'lead', 2),
  ('media', 'Kadambari Dhaygude', null, 'lead', 3),
  ('media', 'Rajvardhan Patil', null, 'head', 4),
  ('media', 'Vishwajeet Gaikwad', null, 'head', 5),
  ('media', 'Rutuja Hadke', null, 'head', 6),
  ('events', 'Anvay Bahadur', null, 'lead', 1),
  ('events', 'Suhani Avinash Gawade', null, 'lead', 2),
  ('events', 'Om Chavhan', null, 'lead', 3),
  ('events', 'Aditya Kale', null, 'head', 4),
  ('events', 'Vedant Chavhan', null, 'head', 5),
  ('events', 'Shruti Vishwanath Chandolkar', null, 'head', 6),
  ('events', 'Ansh Singh Gurdatta', null, 'head', 7),
  ('outreach', 'Aarhan Goswami', null, 'lead', 1),
  ('outreach', 'Shraddha Khetmalis', null, 'lead', 2),
  ('outreach', 'Nandita Kharade', null, 'lead', 3),
  ('outreach', 'Bhoomi Baghele', null, 'head', 4),
  ('outreach', 'Prathmesh Mante', null, 'head', 5),
  ('outreach', 'Jayesh Vishwakarma', null, 'head', 6)
) as v(group_id, name, role, rank, position)
where not exists (select 1 from public.roster_people existing);


-- ===========================================================================
-- 6. Site copy an organiser can edit without a deploy
-- ===========================================================================

create table if not exists public.site_text (
  key text primary key,
  section text not null default 'general',
  label text not null,
  hint text,
  value text not null default '',
  multiline boolean not null default false,
  position integer not null default 0,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

comment on table public.site_text is
  'Sentences on the public site, editable from the organiser console. The code carries the same wording as a fallback, so an unreachable database renders the site rather than a page of blanks.';

alter table public.site_text enable row level security;

drop policy if exists site_text_read_all on public.site_text;
create policy site_text_read_all on public.site_text
  for select to anon, authenticated using (true);

-- These strings are duplicated in FALLBACK in src/lib/data/site.ts. That is on
-- purpose: this file is read by a build that may never reach the database.
insert into public.site_text (key, section, label, hint, value, multiline, position) values
  ('home.what', 'Home', 'What CESAC is',
   'The sentence under the identity plate on the front page.',
   'Not a club. A community built by the Computer Engineering department at VIT Pune, for the department. We run the department''s events, and students from across the department run us.',
   true, 1),
  ('home.structure', 'Home', 'How it is put together',
   'The line below the one above.',
   'CESAC sits under the department''s faculty leadership. A board of executives steers it, and four verticals carry the work.',
   true, 2),
  ('home.events.eyebrow', 'Home', 'Events section, eyebrow', null, 'What we run', false, 3),
  ('home.events.title', 'Home', 'Events section, heading', null, 'Events', false, 4),
  ('home.events.aside', 'Home', 'Events section, one line', null,
   'Competitions, workshops and department activities, planned and run by students.', true, 5),
  ('home.events.empty', 'Home', 'Events section, when there is nothing else', null,
   'Nothing else is on the calendar yet. New events are posted here as they are confirmed.', true, 6),
  ('home.showcase.eyebrow', 'Showcase', 'Showcase eyebrow', null, 'Who is doing it', false, 1),
  ('home.showcase.title', 'Showcase', 'Showcase heading', null, 'Standouts', false, 2),
  ('home.showcase.aside', 'Showcase', 'Showcase one line',
   'Printed under the heading on the front page.',
   'Students from across the department, ranked on what they have put on their record.', true, 3),
  ('home.showcase.foot', 'Showcase', 'Showcase footnote',
   'The honest caveat under the cards. Worth keeping.',
   'Worked out from what students have uploaded to their own record, so it is a picture of what the department has on file.',
   true, 4),
  ('people.kicker', 'People', 'Roster page, kicker', null, 'People', false, 1),
  ('people.title', 'People', 'Roster page, heading', null, 'The roster', false, 2),
  ('people.lede', 'People', 'Roster page, opening line',
   'The count is filled in for you where {total} appears.',
   'All {total} of us: faculty leadership, student leadership, the board of executives, associate executives and the four verticals that carry the work.',
   true, 3),
  ('contact.email', 'Contact', 'Committee inbox',
   'Left empty until there is an address somebody actually reads. The contact card only prints one when this is filled in.',
   '', false, 1),
  ('contact.note', 'Contact', 'What the contact card says instead', null,
   'The committee is reachable through the Computer Engineering department office at VIT Pune.', true, 2),
  ('console.ranking.note', 'Console', 'Ranking page, the caveat under the table', null,
   'This counts what people have uploaded. An organiser marks a record verified once they have seen it, and until then it still counts, so treat the board as a record of what the department has on file rather than a judgement about anybody.',
   true, 1),
  ('console.records.empty', 'Console', 'Student record, when it is empty', null,
   'Nothing on your record yet. Anything you add is visible to you and to the committee, and to nobody else on the site.',
   true, 2)
on conflict (key) do nothing;


-- ===========================================================================
-- 7. The front page showcase
--
-- A category is either counted or chosen. A counted one ranks students on
-- something the database can work out from their records; a chosen one is
-- whoever the committee names, which is the only way to say something like
-- best outgoing student.
-- ===========================================================================

alter table public.profiles
  add column if not exists showcase_opt_out boolean not null default false;

comment on column public.profiles.showcase_opt_out is
  'True when the student has asked not to be named on the public front page. They still appear on the signed-in ranking, which is not public.';

alter table public.settings
  add column if not exists showcase_public boolean not null default true;

create table if not exists public.showcase_categories (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  title text not null,
  blurb text not null default '',
  metric text not null check (metric in
    ('points', 'wins', 'publications', 'prize_money', 'international', 'records', 'manual')),
  slots integer not null default 3 check (slots between 1 and 12),
  position integer not null default 0,
  visible boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

comment on table public.showcase_categories is
  'One card group on the front page. Every metric but manual is counted from the records students have uploaded; manual is whoever the committee picked.';

create table if not exists public.showcase_picks (
  category_id text not null references public.showcase_categories(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  note text check (note is null or length(note) <= 160),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (category_id, student_id)
);

alter table public.showcase_categories enable row level security;
alter table public.showcase_picks enable row level security;

drop policy if exists showcase_categories_read_all on public.showcase_categories;
create policy showcase_categories_read_all on public.showcase_categories
  for select to anon, authenticated using (true);

-- Picks are never read directly by a page. showcase_board() joins them and is
-- SECURITY DEFINER, so this policy exists only for the organiser console.
drop policy if exists showcase_picks_read_admin on public.showcase_picks;
create policy showcase_picks_read_admin on public.showcase_picks
  for select to authenticated using (public.is_admin());

insert into public.showcase_categories (id, title, blurb, metric, slots, position, visible) values
  ('top-of-the-board', 'Top of the board',
   'Most points across everything on their record.', 'points', 3, 1, true),
  ('winners', 'Best winning student',
   'Most first, second and third places brought back.', 'wins', 3, 2, true),
  ('published', 'Most published',
   'Papers, books and chapters on record.', 'publications', 3, 3, true),
  ('outgoing', 'Best outgoing student',
   'Chosen by the committee.', 'manual', 3, 4, true)
on conflict (id) do nothing;

-- SECURITY DEFINER because it runs for signed-out visitors and profiles is
-- closed to them. It hands back a name, a year, a number and the committee's
-- own note, and nothing else: no address, no PRN, no phone, no record titles.
-- Anyone who has asked not to be named is left out of every category,
-- including a manual one they were picked for, so the opt-out is one switch
-- rather than a thing to remember in four places.
create or replace function public.showcase_board()
returns table(
  category_id text, category_title text, category_blurb text,
  category_position integer, metric text, place integer,
  student_id uuid, name text, year text, value bigint, note text
)
language sql stable security definer set search_path to 'public' as $$
  with live as (select * from public.showcase_categories where visible),
  people as (
    select
      p.id,
      coalesce(nullif(btrim(p.full_name), ''), split_part(p.email, '@', 1)) as name,
      p.year,
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
    group by p.id, p.full_name, p.email, p.year
  ),
  counted as (
    select
      l.id as category_id, l.title, l.blurb, l.position, l.metric, l.slots,
      pk.student_id as picked, pk.note, pk.position as pick_position,
      pe.id, pe.name, pe.year,
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
    left join public.showcase_picks pk on pk.category_id = l.id and l.metric = 'manual'
    join people pe
      on (l.metric = 'manual' and pe.id = pk.student_id)
      or (l.metric <> 'manual')
  ),
  ordered as (
    select c.*,
      row_number() over (
        partition by c.category_id
        order by
          case when c.metric = 'manual' then c.pick_position else 0 end,
          case when c.metric = 'manual' then 0 else c.value end desc,
          c.name asc
      )::integer as place
    from counted c
    where c.metric = 'manual' or c.value > 0
  )
  select o.category_id, o.title, o.blurb, o.position, o.metric,
         o.place, o.id, o.name, o.year, o.value, o.note
  from ordered o
  where o.place <= o.slots
  order by o.position, o.place;
$$;

grant execute on function public.showcase_board() to anon, authenticated;


-- ===========================================================================
-- 8. Organiser roles with something behind them
--
-- Until now there were two roles that meant anything, participant and
-- "everything", and a committee of seven all held "everything". A capability
-- is a named area of the console, and a grant row narrows one organiser to
-- some of them.
--
-- An organiser with NO grant row keeps every capability. That is what makes
-- this safe to apply to a live committee: nobody loses anything on the day it
-- runs, and a grant row is how you take something away afterwards. An owner is
-- never narrowed, so the site cannot be locked out of its own settings.
--
-- public.is_admin() is untouched and still means "may open the console at
-- all". 26 row level security policies depend on it.
-- ===========================================================================

create table if not exists public.admin_grants (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  caps text[] not null default '{}',
  note text,
  granted_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

comment on table public.admin_grants is
  'Which areas of the console one organiser may write in. No row means all of them, so adding a row is always a narrowing and never a widening.';

alter table public.admin_grants enable row level security;

drop policy if exists admin_grants_read on public.admin_grants;
create policy admin_grants_read on public.admin_grants
  for select to authenticated using (public.is_admin() or profile_id = auth.uid());

create or replace function public.admin_caps_all()
returns text[] language sql immutable set search_path to 'public' as $$
  select array['events', 'payments', 'records', 'queries', 'people', 'content', 'settings']::text[];
$$;

create or replace function public.admin_can(p_cap text)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1
    from public.profiles p
    left join public.admin_grants g on g.profile_id = p.id
    where p.id = auth.uid()
      and p.role in ('admin', 'owner')
      and (p.role = 'owner' or g.profile_id is null or p_cap = any(g.caps))
  );
$$;

-- What the console should show this organiser. Never a lock, only a menu.
create or replace function public.my_admin_caps()
returns text[] language sql stable security definer set search_path to 'public' as $$
  select case
    when not public.is_admin() then '{}'::text[]
    else coalesce(
      (select case when p.role = 'owner' then public.admin_caps_all()
                   else coalesce(g.caps, public.admin_caps_all()) end
         from public.profiles p
         left join public.admin_grants g on g.profile_id = p.id
        where p.id = auth.uid()),
      '{}'::text[])
  end;
$$;

-- Retrofit the eleven functions that already existed. Each opens with
-- `if not public.is_admin() then raise ... end if;` and each mentions is_admin
-- exactly once, so swapping that one call for the capability its area needs is
-- the whole change. The definition is read back out of the catalogue rather
-- than retyped, so nothing else about the function can drift, and a function
-- whose text does not match raises instead of being quietly left ungated.
do $$
declare
  target record;
  body text;
begin
  for target in
    select * from (values
      ('admin_apply_cut',            'events'),
      ('admin_mark_paid_offline',    'payments'),
      ('admin_restore_team',         'events'),
      ('admin_score_team',           'events'),
      ('admin_set_chapter_state',    'events'),
      ('admin_set_entry_status',     'events'),
      ('admin_set_event_state',      'events'),
      ('admin_set_role',             'people'),
      ('admin_upsert_dept_event',    'events'),
      ('admin_verify_event_payment', 'payments'),
      ('admin_verify_payment',       'payments')
    ) as t(fn, cap)
  loop
    select pg_get_functiondef(p.oid) into body
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = target.fn;

    if body is null then
      raise exception 'public.% is not there to retrofit.', target.fn;
    end if;

    if position('public.admin_can(' in body) > 0 then
      continue;  -- already done, on a re-run
    end if;

    if (length(body) - length(replace(body, 'public.is_admin()', '')))
       / length('public.is_admin()') <> 1 then
      raise exception 'public.% does not mention public.is_admin() exactly once, so the swap is not safe.', target.fn;
    end if;

    execute replace(body, 'public.is_admin()', format('public.admin_can(%L)', target.cap));
  end loop;
end$$;

-- The write policies, the same way. A read stays on is_admin: seeing the
-- console is one decision and writing in it is another.
drop policy if exists admin_emails_admin_all on public.admin_emails;
create policy admin_emails_admin_all on public.admin_emails
  for all to authenticated using (public.admin_can('people')) with check (public.admin_can('people'));

drop policy if exists certificates_update_admin on public.certificates;
create policy certificates_update_admin on public.certificates
  for update to authenticated using (public.admin_can('records')) with check (public.admin_can('records'));

drop policy if exists chapters_admin_write on public.chapters;
create policy chapters_admin_write on public.chapters
  for update to authenticated using (public.admin_can('events')) with check (public.admin_can('events'));

drop policy if exists dept_events_write_admin on public.dept_events;
create policy dept_events_write_admin on public.dept_events
  for all to authenticated using (public.admin_can('events')) with check (public.admin_can('events'));

drop policy if exists registrations_write_admin on public.event_registrations;
create policy registrations_write_admin on public.event_registrations
  for all to authenticated using (public.admin_can('events')) with check (public.admin_can('events'));

drop policy if exists payments_admin_write on public.payments;
create policy payments_admin_write on public.payments
  for all to authenticated using (public.admin_can('payments')) with check (public.admin_can('payments'));

drop policy if exists queries_update_admin on public.queries;
create policy queries_update_admin on public.queries
  for update to authenticated using (public.admin_can('queries')) with check (public.admin_can('queries'));

drop policy if exists scores_admin_write on public.scores;
create policy scores_admin_write on public.scores
  for all to authenticated using (public.admin_can('events')) with check (public.admin_can('events'));

drop policy if exists settings_admin_write on public.settings;
create policy settings_admin_write on public.settings
  for update to authenticated using (public.admin_can('settings')) with check (public.admin_can('settings'));

drop policy if exists teams_admin_write on public.teams;
create policy teams_admin_write on public.teams
  for update to authenticated using (public.admin_can('events')) with check (public.admin_can('events'));

drop policy if exists teams_admin_delete on public.teams;
create policy teams_admin_delete on public.teams
  for delete to authenticated using (public.admin_can('events'));

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.admin_can('people'))
  with check (id = auth.uid() or public.admin_can('people'));

-- Not your own, for the same reason admin_set_role refuses to change your own
-- role: the one move nobody should be able to make alone is the one that locks
-- everybody else out.
create or replace function public.admin_set_grants(
  p_profile_id uuid, p_caps text[], p_note text default null
)
returns void language plpgsql security definer set search_path to 'public' as $$
declare
  bad text;
  target public.profiles;
begin
  if not public.admin_can('people') then
    raise exception 'You do not have access to organiser roles.' using errcode = '42501';
  end if;
  if p_profile_id = auth.uid() then
    raise exception 'You cannot change your own access.' using errcode = '42501';
  end if;

  select * into target from public.profiles where id = p_profile_id;
  if target.id is null then
    raise exception 'No such account.' using errcode = 'P0001';
  end if;
  if target.role = 'owner' then
    raise exception 'An owner is never narrowed.' using errcode = '42501';
  end if;
  if target.role = 'participant' then
    raise exception 'Make them an organiser first.' using errcode = 'P0001';
  end if;

  select c into bad from unnest(coalesce(p_caps, '{}'::text[])) as c
   where c <> all(public.admin_caps_all()) limit 1;
  if bad is not null then
    raise exception 'There is no % area of the console.', bad using errcode = 'P0001';
  end if;

  insert into public.admin_grants (profile_id, caps, note, granted_by, updated_at)
  values (p_profile_id, coalesce(p_caps, '{}'::text[]),
          nullif(btrim(coalesce(p_note, '')), ''), auth.uid(), now())
  on conflict (profile_id) do update
    set caps = excluded.caps, note = excluded.note,
        granted_by = auth.uid(), updated_at = now();

  perform public.audit('admin.grants.set', 'profile', p_profile_id::text,
    jsonb_build_object('caps', p_caps));
end;
$$;

-- Back to unrestricted. Deleting the row is what "everything" looks like.
create or replace function public.admin_clear_grants(p_profile_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.admin_can('people') then
    raise exception 'You do not have access to organiser roles.' using errcode = '42501';
  end if;
  delete from public.admin_grants where profile_id = p_profile_id;
  perform public.audit('admin.grants.cleared', 'profile', p_profile_id::text, '{}'::jsonb);
end;
$$;


-- ===========================================================================
-- 9. The writes behind the new console pages
--
-- Every one of these is the only way its table can be written: the tables
-- carry a read policy and no write policy at all, so nothing reaches them
-- except through a function that has checked the capability first.
-- ===========================================================================

create or replace function public.admin_set_points(p_key text, p_points integer)
returns void language plpgsql security definer set search_path to 'public' as $$
declare was integer;
begin
  if not public.admin_can('content') then
    raise exception 'You do not have access to the points scale.' using errcode = '42501';
  end if;
  if p_points is null or p_points < 0 or p_points > 10000 then
    raise exception 'A score is a whole number between 0 and 10000.' using errcode = 'P0001';
  end if;

  select points into was from public.scoring where key = p_key;
  if was is null then
    raise exception 'There is no % on the scale.', p_key using errcode = 'P0001';
  end if;

  update public.scoring set points = p_points, updated_by = auth.uid(), updated_at = now()
   where key = p_key;

  perform public.audit('scoring.set', 'scoring', p_key,
    jsonb_build_object('from', was, 'to', p_points));
end;
$$;

create or replace function public.admin_set_site_text(p_key text, p_value text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.admin_can('content') then
    raise exception 'You do not have access to the site copy.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.site_text where key = p_key) then
    raise exception 'There is no % on the site.', p_key using errcode = 'P0001';
  end if;
  if length(coalesce(p_value, '')) > 2000 then
    raise exception 'That is longer than the page has room for.' using errcode = 'P0001';
  end if;

  update public.site_text
     set value = coalesce(p_value, ''), updated_by = auth.uid(), updated_at = now()
   where key = p_key;

  perform public.audit('site_text.set', 'site_text', p_key, '{}'::jsonb);
end;
$$;

create or replace function public.admin_upsert_roster_group(
  p_id text, p_kind text, p_title text, p_jp text default null,
  p_remit text default null, p_index_label text default null,
  p_accent text default null, p_position integer default 0,
  p_visible boolean default true
)
returns text language plpgsql security definer set search_path to 'public' as $$
declare v_id text := lower(btrim(coalesce(p_id, '')));
begin
  if not public.admin_can('content') then
    raise exception 'You do not have access to the roster.' using errcode = '42501';
  end if;
  if v_id !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'The id is lowercase letters, numbers and single hyphens.' using errcode = 'P0001';
  end if;
  if btrim(coalesce(p_title, '')) = '' then
    raise exception 'A block needs a heading.' using errcode = 'P0001';
  end if;
  if coalesce(p_kind, '') not in ('people', 'names', 'vertical') then
    raise exception 'A block lists people with titles, names alone, or a vertical.' using errcode = 'P0001';
  end if;

  insert into public.roster_groups
    (id, kind, title, jp, remit, index_label, accent, position, visible, updated_at)
  values
    (v_id, p_kind, btrim(p_title), nullif(btrim(coalesce(p_jp, '')), ''),
     nullif(btrim(coalesce(p_remit, '')), ''), nullif(btrim(coalesce(p_index_label, '')), ''),
     nullif(btrim(coalesce(p_accent, '')), ''), coalesce(p_position, 0),
     coalesce(p_visible, true), now())
  on conflict (id) do update
    set kind = excluded.kind, title = excluded.title, jp = excluded.jp,
        remit = excluded.remit, index_label = excluded.index_label,
        accent = excluded.accent, position = excluded.position,
        visible = excluded.visible, updated_at = now();

  perform public.audit('roster.group.saved', 'roster_group', v_id,
    jsonb_build_object('title', btrim(p_title)));
  return v_id;
end;
$$;

create or replace function public.admin_delete_roster_group(p_id text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.admin_can('content') then
    raise exception 'You do not have access to the roster.' using errcode = '42501';
  end if;
  delete from public.roster_groups where id = p_id;
  perform public.audit('roster.group.deleted', 'roster_group', p_id, '{}'::jsonb);
end;
$$;

create or replace function public.admin_upsert_roster_person(
  p_id uuid, p_group_id text, p_name text, p_role text default null,
  p_rank text default null, p_position integer default 0,
  p_visible boolean default true
)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_id uuid;
begin
  if not public.admin_can('content') then
    raise exception 'You do not have access to the roster.' using errcode = '42501';
  end if;
  if btrim(coalesce(p_name, '')) = '' then
    raise exception 'A person needs a name.' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.roster_groups where id = p_group_id) then
    raise exception 'There is no % block on the roster.', p_group_id using errcode = 'P0001';
  end if;
  if coalesce(p_rank, '') not in ('', 'lead', 'head') then
    raise exception 'Somebody is a lead, a head, or neither.' using errcode = 'P0001';
  end if;

  if p_id is null then
    insert into public.roster_people (group_id, name, role, rank, position, visible)
    values (p_group_id, btrim(p_name), nullif(btrim(coalesce(p_role, '')), ''),
            nullif(p_rank, ''), coalesce(p_position, 0), coalesce(p_visible, true))
    returning id into v_id;
  else
    update public.roster_people
       set group_id = p_group_id, name = btrim(p_name),
           role = nullif(btrim(coalesce(p_role, '')), ''),
           rank = nullif(p_rank, ''), position = coalesce(p_position, 0),
           visible = coalesce(p_visible, true), updated_at = now()
     where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'That person is not on the roster any more.' using errcode = 'P0001';
    end if;
  end if;

  perform public.audit('roster.person.saved', 'roster_person', v_id::text,
    jsonb_build_object('name', btrim(p_name), 'group', p_group_id));
  return v_id;
end;
$$;

create or replace function public.admin_delete_roster_person(p_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.admin_can('content') then
    raise exception 'You do not have access to the roster.' using errcode = '42501';
  end if;
  delete from public.roster_people where id = p_id;
  perform public.audit('roster.person.deleted', 'roster_person', p_id::text, '{}'::jsonb);
end;
$$;

create or replace function public.admin_upsert_showcase_category(
  p_id text, p_title text, p_blurb text, p_metric text,
  p_slots integer default 3, p_position integer default 0,
  p_visible boolean default true
)
returns text language plpgsql security definer set search_path to 'public' as $$
declare v_id text := lower(btrim(coalesce(p_id, '')));
begin
  if not public.admin_can('content') then
    raise exception 'You do not have access to the showcase.' using errcode = '42501';
  end if;
  if v_id !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'The id is lowercase letters, numbers and single hyphens.' using errcode = 'P0001';
  end if;
  if btrim(coalesce(p_title, '')) = '' then
    raise exception 'A category needs a heading.' using errcode = 'P0001';
  end if;
  if coalesce(p_metric, '') not in
     ('points', 'wins', 'publications', 'prize_money', 'international', 'records', 'manual') then
    raise exception 'That is not one of the things the showcase can rank on.' using errcode = 'P0001';
  end if;
  if coalesce(p_slots, 3) not between 1 and 12 then
    raise exception 'A category shows between one and twelve people.' using errcode = 'P0001';
  end if;

  insert into public.showcase_categories
    (id, title, blurb, metric, slots, position, visible, updated_by, updated_at)
  values
    (v_id, btrim(p_title), btrim(coalesce(p_blurb, '')), p_metric,
     coalesce(p_slots, 3), coalesce(p_position, 0), coalesce(p_visible, true), auth.uid(), now())
  on conflict (id) do update
    set title = excluded.title, blurb = excluded.blurb, metric = excluded.metric,
        slots = excluded.slots, position = excluded.position,
        visible = excluded.visible, updated_by = auth.uid(), updated_at = now();

  perform public.audit('showcase.category.saved', 'showcase_category', v_id,
    jsonb_build_object('title', btrim(p_title), 'metric', p_metric));
  return v_id;
end;
$$;

create or replace function public.admin_delete_showcase_category(p_id text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.admin_can('content') then
    raise exception 'You do not have access to the showcase.' using errcode = '42501';
  end if;
  delete from public.showcase_categories where id = p_id;
  perform public.audit('showcase.category.deleted', 'showcase_category', p_id, '{}'::jsonb);
end;
$$;

-- Name somebody for a category the numbers cannot work out on their own.
create or replace function public.admin_set_showcase_pick(
  p_category_id text, p_student_id uuid, p_note text default null,
  p_position integer default 0
)
returns void language plpgsql security definer set search_path to 'public' as $$
declare cat public.showcase_categories;
begin
  if not public.admin_can('content') then
    raise exception 'You do not have access to the showcase.' using errcode = '42501';
  end if;

  select * into cat from public.showcase_categories where id = p_category_id;
  if cat.id is null then
    raise exception 'There is no % category.', p_category_id using errcode = 'P0001';
  end if;
  if cat.metric <> 'manual' then
    raise exception 'The % category ranks itself. Change it to a chosen category first.', cat.title
      using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.profiles where id = p_student_id and role = 'participant') then
    raise exception 'That is not a student account.' using errcode = 'P0001';
  end if;

  insert into public.showcase_picks (category_id, student_id, note, position)
  values (p_category_id, p_student_id, nullif(btrim(coalesce(p_note, '')), ''), coalesce(p_position, 0))
  on conflict (category_id, student_id) do update
    set note = excluded.note, position = excluded.position;

  perform public.audit('showcase.pick.set', 'showcase_category', p_category_id,
    jsonb_build_object('student', p_student_id));
end;
$$;

create or replace function public.admin_remove_showcase_pick(p_category_id text, p_student_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.admin_can('content') then
    raise exception 'You do not have access to the showcase.' using errcode = '42501';
  end if;
  delete from public.showcase_picks
   where category_id = p_category_id and student_id = p_student_id;
  perform public.audit('showcase.pick.removed', 'showcase_category', p_category_id,
    jsonb_build_object('student', p_student_id));
end;
$$;

-- For the duplicate somebody uploaded twice and the screenshot of nothing.
-- The Drive file is NOT deleted here: this function runs inside Postgres,
-- which has no way to reach Google, so the server action that calls it trashes
-- the files first and only gets this far if that worked.
create or replace function public.admin_delete_certificate(p_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare row public.certificates;
begin
  if not public.admin_can('records') then
    raise exception 'You do not have access to student records.' using errcode = '42501';
  end if;

  select * into row from public.certificates where id = p_id;
  if row.id is null then
    raise exception 'That record is not there any more.' using errcode = 'P0001';
  end if;

  delete from public.certificates where id = p_id;

  perform public.audit('record.deleted', 'certificate', p_id::text,
    jsonb_build_object('owner', row.owner_id, 'title', row.event_name, 'kind', row.kind));
end;
$$;


-- ===========================================================================
-- 10. Shut the new functions to `anon`
--
-- Granting EXECUTE to `authenticated` does not remove Postgres's own default
-- grant to PUBLIC, so every function above was reachable unauthenticated at
-- /rest/v1/rpc/<name>. None of them would have done anything: admin_can()
-- answers false when auth.uid() is null and each one raises on that. But a
-- SECURITY DEFINER function an anonymous request can reach is one careless
-- line away from being a real hole, and the same trap caught this project once
-- already when the ems schema was exposed.
--
-- showcase_board is the deliberate exception: the front page runs it for
-- signed-out visitors, which is its entire purpose.
-- ===========================================================================

do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and (p.proname like 'admin\_%'
           or p.proname in ('my_admin_caps', 'guard_certificate_verification'))
  loop
    execute format('revoke all on function %s from public, anon', fn.sig);
    execute format('grant execute on function %s to authenticated', fn.sig);
  end loop;
end$$;

-- A trigger function is called by Postgres, never by a client.
revoke all on function public.guard_certificate_verification() from authenticated;

revoke all on function public.admin_caps_all() from public, anon;
grant execute on function public.admin_caps_all() to authenticated;
