-- A sixth record layout: sports, cultural events, NCC, NSS, social work, or
-- any other non-technical certificate a student wants on file. Added on its
-- own because a new enum value cannot be referenced by name in the same
-- transaction that creates it; 20260926_extracurricular_scoring_and_showcase.sql
-- is the migration that actually puts it to use.
alter type public.achievement_kind add value if not exists 'extracurricular';
