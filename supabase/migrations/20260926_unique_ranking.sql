-- One place per person, in every ranking on the site.
--
-- Until now the boards ranked on a single number and let ties stand:
-- standouts_board() used rank(), so two students with four wins each were
-- both "1st" and the next one was "3rd", and ranking_board() / my_standing()
-- broke a points tie on the student's name, which is alphabetical luck and
-- not merit. The committee asked for a ranking that weighs more than one
-- factor and never puts two people on the same place.
--
-- Two parts:
--
--   1. public.merit_tally(), one row per account with every figure a
--      ranking might want. Every board reads it, so the front page, the
--      standouts page and a student's own standing can never disagree about
--      what somebody has done.
--
--   2. The boards order by the category's own figure first, which is still
--      the number printed next to the name, then by a chain of tie-breakers
--      chosen for that category, then by who reached their tally first, and
--      last by the account id so the order is total. row_number() replaces
--      rank(), so a place is unique by construction rather than by luck.
--
-- Nothing on the site changes shape: every function returns exactly the
-- columns it did before. The tie-breakers are backend only, by request.

create or replace function public.merit_tally()
returns table (
  id uuid,
  role text,
  name text,
  year text,
  photo_path text,
  points numeric,
  verified_points numeric,
  records numeric,
  verified_records numeric,
  wins numeric,
  firsts numeric,
  seconds numeric,
  thirds numeric,
  win_points numeric,
  verified_wins numeric,
  publications numeric,
  pub_points numeric,
  quartile_score numeric,
  indexed_pubs numeric,
  impact numeric,
  verified_pubs numeric,
  prize_money numeric,
  international numeric,
  national_level numeric,
  state_level numeric,
  level_score numeric,
  reached_at timestamptz
)
language sql
stable
set search_path = public
as $$
  with recs as (
    select
      c.*,
      public.achievement_points(c.kind, c.contribution, c.level) as pts,
      coalesce((select s.points from public.scoring s
                 where s.key = 'level:' || coalesce(c.level::text, 'other')), 0) as lvl_pts,
      (c.kind in ('event', 'extracurricular')
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
    -- When the latest record was filed: the moment they reached the tally
    -- they hold now. Of two people level on everything, the one who got
    -- there first ranks higher, the usual rule on any scoreboard.
    max(r.created_at)
  from public.profiles p
  left join recs r on r.owner_id = p.id
  group by p.id, p.role, p.full_name, p.email, p.year, p.photo_path;
$$;

-- Internal. Only the boards below, which run as their owner, call it; a
-- visitor or a student has no business reading every account's figures.
revoke all on function public.merit_tally() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- The standouts board, every category, everybody in it.
-- ---------------------------------------------------------------------------

create or replace function public.standouts_board()
returns table (
  category_id text, category_title text, category_blurb text, category_position integer,
  metric text, slots integer, place integer, seq integer, student_id uuid, name text,
  year text, value bigint, note text, photo text
)
language sql
stable
security definer
set search_path = public
as $$
  with live as (select * from public.showcase_categories where visible),
  people as (
    select * from public.merit_tally() t where t.role in ('participant', 'admin', 'owner')
  ),
  counted as (
    select
      l.id as category_id, l.title, l.blurb, l.position, l.metric, l.slots,
      pk.note, pk.position as pick_position,
      pe.*,
      case l.metric
        when 'points'        then pe.points
        when 'wins'          then pe.wins
        when 'publications'  then pe.publications
        when 'prize_money'   then pe.prize_money
        when 'international' then pe.international
        when 'records'       then pe.records
        else pe.points
      end as metric_value
    from live l
    left join public.showcase_picks pk on pk.category_id = l.id and l.metric = 'manual'
    join people pe on (l.metric = 'manual' and pe.id = pk.student_id) or (l.metric <> 'manual')
  ),
  keyed as (
    -- Six tie-breakers per category, read left to right. Each list is what
    -- "better at this" means for that category once the headline figure is
    -- level: for wins, a first beats a second, then the level of the wins,
    -- then whether they have been checked; for publications, the committee's
    -- own points for the kind and level of each paper, then quartile,
    -- indexing and impact factor.
    select c.*,
      case c.metric
        when 'points'        then array[c.verified_points, c.wins, c.firsts, c.level_score, c.publications, c.records]
        when 'wins'          then array[c.firsts, c.seconds, c.thirds, c.win_points, c.verified_wins, c.prize_money]
        when 'publications'  then array[c.pub_points, c.quartile_score, c.indexed_pubs, c.impact, c.verified_pubs, c.points]
        when 'prize_money'   then array[c.wins, c.firsts, c.win_points, c.points, c.verified_points, c.records]
        when 'international' then array[c.national_level, c.state_level, c.level_score, c.points, c.verified_points, c.wins]
        when 'records'       then array[c.verified_records, c.points, c.level_score, c.wins, c.publications, c.prize_money]
        else                      array[c.points, c.verified_points, c.wins, c.firsts, c.level_score, c.records]
      end as ties
    from counted c
    where c.metric = 'manual' or c.metric_value > 0
  ),
  ordered as (
    select k.*,
      row_number() over (
        partition by k.category_id
        order by
          case when k.metric = 'manual' then k.pick_position else 0 end,
          case when k.metric = 'manual' then 0 else k.metric_value end desc,
          k.ties desc,
          -- Everything level after that: points overall, then the checked
          -- share of them, then who reached their tally first.
          k.points desc,
          k.verified_points desc,
          k.reached_at asc nulls last,
          k.id
      )::integer as seq
    from keyed k
  )
  select
    o.category_id, o.title, o.blurb, o.position, o.metric, o.slots,
    o.seq, o.seq,
    o.id, o.name, o.year, o.metric_value::bigint, o.note, o.photo_path
  from ordered o
  where o.seq <= 500
  order by o.position, o.seq;
$$;

-- The pre-photo fallback the site still knows how to read. It is the same
-- board cut to each category's slots, so the two can no longer drift.
create or replace function public.showcase_board()
returns table (
  category_id text, category_title text, category_blurb text, category_position integer,
  metric text, place integer, student_id uuid, name text, year text, value bigint, note text
)
language sql
stable
security definer
set search_path = public
as $$
  select b.category_id, b.category_title, b.category_blurb, b.category_position,
         b.metric, b.place, b.student_id, b.name, b.year, b.value, b.note
    from public.standouts_board() b
   where b.seq <= b.slots
   order by b.category_position, b.seq;
$$;

-- ---------------------------------------------------------------------------
-- The student ranking, and a student's own place in it.
-- ---------------------------------------------------------------------------

-- One ordering, used by both functions below, so the place a student sees on
-- their own dashboard is always the place the board prints against them.
create or replace function public.student_ranking()
returns table (
  place bigint, id uuid, name text, year text, photo_path text,
  points bigint, certificates bigint, prize_total bigint
)
language sql
stable
set search_path = public
as $$
  select
    row_number() over (
      order by
        t.points desc,
        t.verified_points desc,
        t.wins desc,
        t.firsts desc,
        t.seconds desc,
        t.level_score desc,
        t.publications desc,
        t.pub_points desc,
        t.prize_money desc,
        t.records desc,
        t.reached_at asc nulls last,
        t.id
    ),
    t.id, t.name, t.year, t.photo_path,
    t.points::bigint, t.records::bigint, t.prize_money::bigint
  from public.merit_tally() t
  where t.role = 'participant' and t.records > 0;
$$;

revoke all on function public.student_ranking() from public, anon, authenticated;

create or replace function public.ranking_board(p_limit integer default 10)
returns table (
  place bigint, student_id uuid, name text, year text, points bigint,
  certificates bigint, photo text
)
language sql
stable
security definer
set search_path = public
as $$
  select r.place, r.id, r.name, r.year, r.points, r.certificates, r.photo_path
    from public.student_ranking() r
   order by r.place
   limit greatest(1, least(coalesce(p_limit, 10), 100));
$$;

create or replace function public.my_standing()
returns table (
  place bigint, points bigint, certificates bigint, ranked_students bigint, prize_total_inr bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (select * from public.student_ranking())
  select r.place, r.points, r.certificates, (select count(*) from ranked), r.prize_total
    from ranked r
   where r.id = auth.uid();
$$;
