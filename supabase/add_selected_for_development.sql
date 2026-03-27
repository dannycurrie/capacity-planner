-- Add selected_for_development flag to initiatives
-- Allows marking an initiative for inclusion in load vs capacity calculations
alter table initiatives
  add column if not exists selected_for_development boolean not null default false;
