-- Five more kinds of student record, 27 September 2026.
--
-- The committee asked for competitions to stand apart from hackathons, and
-- for workshops, internships and other things a student does to have their
-- own sections, each asking its own questions rather than one shared form.
--
-- A new enum value cannot be used in the transaction that adds it, so the
-- columns, the scoring rows and the functions that read them are in
-- 20260927_more_record_kinds_fields.sql, applied after this one.

alter type public.achievement_kind add value if not exists 'competition';
alter type public.achievement_kind add value if not exists 'workshop';
alter type public.achievement_kind add value if not exists 'internship';
alter type public.achievement_kind add value if not exists 'certification';
alter type public.achievement_kind add value if not exists 'patent';
