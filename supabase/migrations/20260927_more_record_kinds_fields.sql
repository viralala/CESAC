-- The fields, points and scoring for the five kinds added in
-- 20260927_more_record_kinds.sql.
--
-- Every new column is nullable and belongs to whichever layouts in
-- src/lib/console/records.ts name it. One table, as before: a record is a
-- claim about something a student did, whatever its shape.

alter table public.certificates
  add column if not exists mode text,
  add column if not exists team_name text,
  add column if not exists team_size integer,
  add column if not exists theme text,
  add column if not exists project_title text,
  add column if not exists rank_detail text,
  add column if not exists duration text,
  add column if not exists ended_on date,
  add column if not exists role_title text,
  add column if not exists stipend_inr integer,
  add column if not exists ppo boolean,
  add column if not exists skills text,
  add column if not exists score text,
  add column if not exists credential_url text,
  add column if not exists application_no text,
  add column if not exists patent_status text;

alter table public.certificates
  drop constraint if exists certificates_team_size_sane,
  add constraint certificates_team_size_sane
    check (team_size is null or team_size between 1 and 100),
  drop constraint if exists certificates_stipend_sane,
  add constraint certificates_stipend_sane
    check (stipend_inr is null or stipend_inr between 0 and 10000000),
  drop constraint if exists certificates_ended_after_start,
  add constraint certificates_ended_after_start
    check (ended_on is null or happened_on is null or ended_on >= happened_on),
  drop constraint if exists certificates_credential_https,
  add constraint certificates_credential_https
    check (credential_url is null or credential_url ~ '^https://');

alter table public.scoring drop constraint if exists scoring_band_check;
alter table public.scoring add constraint scoring_band_check
  check (band = any (array['contribution', 'competition', 'extracurricular', 'kind', 'level']));

-- Competitions place, like hackathons, so they get a results scale of their
-- own, seeded level with a hackathon's so nothing moves until the committee
-- decides it should. The other four do not place: one base each, in the same
-- band as the publications, plus the level on top as for everything else.
insert into public.scoring (key, band, label, hint, points, position) values
  ('competition:participation', 'competition', 'Participation',
   'Entered a competition and did not place.', 40, 1),
  ('competition:third', 'competition', 'Third prize', null, 70, 2),
  ('competition:second', 'competition', 'Second prize', null, 85, 3),
  ('competition:first', 'competition', 'First prize', null, 100, 4),
  ('kind:workshop', 'kind', 'Workshop or bootcamp', null, 25, 5),
  ('kind:internship', 'kind', 'Internship', null, 80, 6),
  ('kind:certification', 'kind', 'Online course or certification', null, 20, 7),
  ('kind:patent', 'kind', 'Patent', null, 110, 8)
on conflict (key) do nothing;

create or replace function public.achievement_points(
  p_kind achievement_kind,
  p_contribution certificate_contribution,
  p_level achievement_level
)
returns integer
language sql
stable
set search_path to 'public'
as $function$
  select
    coalesce((
      select s.points from public.scoring s
       where s.key = case
         when p_kind = 'event' then 'contribution:' || coalesce(p_contribution::text, 'participation')
         when p_kind = 'competition' then 'competition:' || coalesce(p_contribution::text, 'participation')
         when p_kind = 'extracurricular' then 'extracurricular:' || coalesce(p_contribution::text, 'participation')
         else 'kind:' || p_kind::text
       end
    ), 0)
    +
    coalesce((
      select s.points from public.scoring s
       where s.key = 'level:' || coalesce(p_level::text, 'other')
    ), 0);
$function$;

-- A competition win is a win. Named, never "not a publication": see the
-- extracurricular migration for what inferring a kind by elimination cost.
create or replace function public.merit_tally()
returns table(
  id uuid, role text, name text, year text, photo_path text,
  points numeric, verified_points numeric, records numeric, verified_records numeric,
  wins numeric, firsts numeric, seconds numeric, thirds numeric, win_points numeric,
  verified_wins numeric, publications numeric, pub_points numeric, quartile_score numeric,
  indexed_pubs numeric, impact numeric, verified_pubs numeric, prize_money numeric,
  international numeric, national_level numeric, state_level numeric, level_score numeric,
  reached_at timestamp with time zone
)
language sql
stable
set search_path to 'public'
as $function$
  with recs as (
    select
      c.*,
      public.achievement_points(c.kind, c.contribution, c.level) as pts,
      coalesce((select s.points from public.scoring s
                 where s.key = 'level:' || coalesce(c.level::text, 'other')), 0) as lvl_pts,
      (c.kind in ('event', 'competition', 'extracurricular')
        and c.contribution in ('first', 'second', 'third')) as is_win,
      (c.kind in ('journal', 'conference', 'book', 'book_chapter')) as is_pub
    from public.certificates c
  )
  select
    p.id,
    p.role::text,
    coalesce(nullif(btrim(p.full_name), ''), split_part(p.email, '@', 1)),
    p.year,
    p.photo_path,
    coalesce(sum(r.pts), 0),
    coalesce(sum(r.pts) filter (where r.verified), 0),
    count(r.id),
    count(r.id) filter (where r.verified),
    count(r.id) filter (where r.is_win),
    count(r.id) filter (where r.is_win and r.contribution = 'first'),
    count(r.id) filter (where r.is_win and r.contribution = 'second'),
    count(r.id) filter (where r.is_win and r.contribution = 'third'),
    coalesce(sum(r.pts) filter (where r.is_win), 0),
    count(r.id) filter (where r.is_win and r.verified),
    count(r.id) filter (where r.is_pub),
    coalesce(sum(r.pts) filter (where r.is_pub), 0),
    coalesce(sum(case upper(btrim(r.quartile))
                   when 'Q1' then 4 when 'Q2' then 3 when 'Q3' then 2 when 'Q4' then 1
                   else 0 end) filter (where r.is_pub), 0),
    count(r.id) filter (
      where r.is_pub
        and nullif(lower(btrim(r.indexing)), '') is not null
        and lower(btrim(r.indexing)) not in ('none', 'na', 'n/a', 'nil', '-', 'not indexed')
    ),
    coalesce(sum(r.impact_factor) filter (where r.is_pub), 0),
    count(r.id) filter (where r.is_pub and r.verified),
    coalesce(sum(r.prize_amount_inr), 0),
    count(r.id) filter (where r.level = 'international'),
    count(r.id) filter (where r.level = 'national'),
    count(r.id) filter (where r.level = 'state'),
    coalesce(sum(r.lvl_pts), 0),
    max(r.created_at)
  from public.profiles p
  left join recs r on r.owner_id = p.id
  group by p.id, p.role, p.full_name, p.email, p.year, p.photo_path;
$function$;

revoke all on function public.merit_tally() from public, anon, authenticated;
