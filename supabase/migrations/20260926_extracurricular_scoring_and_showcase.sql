-- ---------------------------------------------------------------------------
-- Puts the new 'extracurricular' kind to use: its own scoring band, and a
-- fix to two functions that assumed "not an event" meant "a publication",
-- which stopped being true the moment a kind existed that was neither.
-- 26 September 2026. Depends on 20260926_add_extracurricular_kind.sql having
-- already run.
-- ---------------------------------------------------------------------------

-- A fourth band, for a non-technical or extracurricular certificate's own
-- adjustable scoring, separate from a hackathon's contribution band.
alter table public.scoring drop constraint scoring_band_check;
alter table public.scoring add constraint scoring_band_check
  check (band = any (array['contribution', 'level', 'kind', 'extracurricular']));

-- Its own adjustable scoring band, editable at /admin/site/points the same
-- way every other band already is. Starting values are roughly half the
-- hackathon scale; the committee can move them.
insert into public.scoring (key, band, label, hint, points, position) values
  ('extracurricular:participation', 'extracurricular', 'Participation',
   'Entered and took part in a non-technical or extracurricular activity.', 20, 1),
  ('extracurricular:third', 'extracurricular', 'Third prize', null, 35, 2),
  ('extracurricular:second', 'extracurricular', 'Second prize', null, 45, 3),
  ('extracurricular:first', 'extracurricular', 'First prize', null, 50, 4)
on conflict (key) do nothing;

-- achievement_points: extracurricular scores like an event (a contribution
-- band) rather than like a publication (a flat kind band), but reads its own
-- extracurricular:* keys rather than a hackathon's contribution:* ones.
create or replace function public.achievement_points(p_kind achievement_kind, p_contribution certificate_contribution, p_level achievement_level)
returns integer
language sql
stable
set search_path to 'public'
as $$
  select
    coalesce((
      select s.points from public.scoring s
       where s.key = case
         when p_kind = 'event' then 'contribution:' || coalesce(p_contribution::text, 'participation')
         when p_kind = 'extracurricular' then 'extracurricular:' || coalesce(p_contribution::text, 'participation')
         else 'kind:' || p_kind::text
       end
    ), 0)
    +
    coalesce((
      select s.points from public.scoring s
       where s.key = 'level:' || coalesce(p_level::text, 'other')
    ), 0);
$$;

-- standouts_board and showcase_board both counted "publications" as anything
-- that was not an 'event', which was every publication kind until today. An
-- extracurricular certificate is neither an event nor a publication, so both
-- functions now name the four publication kinds explicitly rather than
-- inferring them by elimination. "wins" is widened the other way: an
-- extracurricular first, second or third place counts as a win the same way
-- a hackathon one does.
create or replace function public.standouts_board()
returns table(category_id text, category_title text, category_blurb text, category_position integer, metric text, slots integer, place integer, seq integer, student_id uuid, name text, year text, value bigint, note text, photo text)
language sql
stable security definer
set search_path to 'public'
as $$
  with live as (select * from public.showcase_categories where visible),
  people as (
    select p.id,
      coalesce(nullif(btrim(p.full_name), ''), split_part(p.email, '@', 1)) as name,
      p.year, p.photo_path,
      coalesce(sum(public.achievement_points(c.kind, c.contribution, c.level)), 0)::bigint as points,
      count(c.id) filter (where c.kind in ('event', 'extracurricular') and c.contribution in ('first', 'second', 'third'))::bigint as wins,
      count(c.id) filter (where c.kind in ('journal', 'conference', 'book', 'book_chapter'))::bigint as publications,
      coalesce(sum(c.prize_amount_inr), 0)::bigint as prize_money,
      count(c.id) filter (where c.level = 'international')::bigint as international,
      count(c.id)::bigint as records
    from public.profiles p
    left join public.certificates c on c.owner_id = p.id
    where p.role in ('participant', 'admin', 'owner') and p.showcase_opt_out = false
    group by p.id, p.full_name, p.email, p.year, p.photo_path
  ),
  counted as (
    select l.id as category_id, l.title, l.blurb, l.position, l.metric, l.slots,
      pk.note, pk.position as pick_position, pe.id, pe.name, pe.year, pe.photo_path,
      case l.metric
        when 'points' then pe.points when 'wins' then pe.wins when 'publications' then pe.publications
        when 'prize_money' then pe.prize_money when 'international' then pe.international
        when 'records' then pe.records else pe.points end as value
    from live l
    left join public.showcase_picks pk on pk.category_id = l.id and l.metric = 'manual'
    join people pe on (l.metric = 'manual' and pe.id = pk.student_id) or (l.metric <> 'manual')
  ),
  ordered as (
    select c.*,
      row_number() over (partition by c.category_id order by
          case when c.metric = 'manual' then c.pick_position else 0 end,
          case when c.metric = 'manual' then 0 else c.value end desc, c.name asc)::integer as seq,
      rank() over (partition by c.category_id order by
          case when c.metric = 'manual' then c.pick_position else 0 end,
          case when c.metric = 'manual' then 0 else c.value end desc)::integer as tied
    from counted c
    where c.metric = 'manual' or c.value > 0
  )
  select o.category_id, o.title, o.blurb, o.position, o.metric, o.slots,
    case when o.metric = 'manual' then o.seq else o.tied end, o.seq,
    o.id, o.name, o.year, o.value, o.note, o.photo_path
  from ordered o where o.seq <= 500
  order by o.position, o.seq;
$$;

create or replace function public.showcase_board()
returns table(category_id text, category_title text, category_blurb text, category_position integer, metric text, place integer, student_id uuid, name text, year text, value bigint, note text)
language sql
stable security definer
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
      coalesce(sum(public.achievement_points(c.kind, c.contribution, c.level)), 0)::bigint as points,
      count(c.id) filter (
        where c.kind in ('event', 'extracurricular') and c.contribution in ('first', 'second', 'third')
      )::bigint as wins,
      count(c.id) filter (where c.kind in ('journal', 'conference', 'book', 'book_chapter'))::bigint as publications,
      coalesce(sum(c.prize_amount_inr), 0)::bigint as prize_money,
      count(c.id) filter (where c.level = 'international')::bigint as international,
      count(c.id)::bigint as records
    from public.profiles p
    left join public.certificates c on c.owner_id = p.id
    where p.role in ('participant', 'admin', 'owner') and p.showcase_opt_out = false
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
      )::integer as place
    from counted c
    where c.metric = 'manual' or c.value > 0
  )
  select
    o.category_id, o.title, o.blurb, o.position, o.metric,
    o.place, o.id, o.name, o.year, o.value, o.note
  from ordered o
  where o.place <= o.slots
  order by o.position, o.place;
$$;
