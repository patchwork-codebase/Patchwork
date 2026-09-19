-- Phase 2 schema for Patchwork

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null default 'observer',
  reputation int not null default 0,
  bio text default '',
  avatar text default '',
  city text default '',
  domain text default '',
  interests text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists rooms (
  id text primary key,
  builder_id uuid references auth.users(id) on delete cascade,
  builder_name text not null,
  title text not null,
  description text default '',
  tags text[] not null default '{}',
  status text not null default 'active',
  update_count int not null default 0,
  observer_count int not null default 0,
  last_update text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists updates (
  id text primary key,
  room_id text references rooms(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  content text not null,
  media_url text,
  created_at timestamptz not null default now()
);

create table if not exists reactions (
  id text primary key,
  room_id text references rooms(id) on delete cascade,
  update_id text references updates(id) on delete set null,
  observer_id uuid references auth.users(id) on delete set null,
  observer_name text not null,
  type text not null,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists room_observers (
  room_id text references rooms(id) on delete cascade,
  observer_id uuid references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, observer_id)
);

create index if not exists idx_rooms_updated_at on rooms (updated_at desc);
create index if not exists idx_rooms_builder_id on rooms (builder_id);
create index if not exists idx_updates_room_id on updates (room_id);
create index if not exists idx_reactions_room_id on reactions (room_id);
create index if not exists idx_room_observers_observer_id on room_observers (observer_id);
create index if not exists idx_reactions_update_id on reactions (update_id);
