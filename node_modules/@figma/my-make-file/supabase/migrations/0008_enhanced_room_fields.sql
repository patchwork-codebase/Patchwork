alter table if exists public.rooms
  add column if not exists cover_image text default null,
  add column if not exists primary_link text default null,
  add column if not exists project_stage text default 'Ideation',
  add column if not exists primary_goal text default 'Just sharing my journey';
