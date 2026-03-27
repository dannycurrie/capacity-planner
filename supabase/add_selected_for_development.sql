-- Add selected_for_development flag and start_month to initiatives
-- Allows marking an initiative for inclusion in load vs capacity calculations
alter table initiatives
  add column if not exists selected_for_development boolean not null default false;

alter table initiatives
  add column if not exists start_month text
    check (start_month is null or start_month ~ '^\d{4}-\d{2}$');
