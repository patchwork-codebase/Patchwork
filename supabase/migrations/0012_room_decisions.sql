create table if not exists room_decisions (
  id uuid primary key default gen_random_uuid(),
  room_id text references rooms(id) on delete cascade,
  builder_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('decision', 'scrapped', 'blocker', 'shipped')),
  title text not null,
  description text default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_room_decisions_room_id on room_decisions(room_id);
