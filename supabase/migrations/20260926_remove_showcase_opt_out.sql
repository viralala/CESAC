-- ---------------------------------------------------------------------------
-- Remove the per-student showcase opt-out. The committee's own decision,
-- given directly after two students who had switched themselves off turned
-- out to include the single highest scorer on the whole board (670 points,
-- all five certificates verified) invisible on /standouts. Every student
-- with a record is named now; there is no switch to come off it.
--
-- standouts_board and showcase_board stop reading showcase_opt_out. The
-- column itself is left in place rather than dropped: nothing reads it, and
-- dropping a column is a one-way door a "do not read it" change is not.
-- The application-side toggle (setShowcaseOptOut, the "Being named
-- publicly" panel's button on both My record pages) was removed in the same
-- commit as this migration.
-- ---------------------------------------------------------------------------

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
    where p.role in ('participant', 'admin', 'owner')
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
    where p.role in ('participant', 'admin', 'owner')
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
