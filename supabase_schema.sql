-- Run this in Supabase SQL Editor

create table if not exists riot_sessions (
  id          bigint generated always as identity primary key,
  discord_id  text not null unique,
  puuid       text not null,
  game_name   text,
  tag_line    text,
  shard       text not null default 'ap',
  region      text not null default 'ap',
  access_token      text not null,
  entitlement_token text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index untuk lookup cepat by discord_id
create index if not exists riot_sessions_discord_id_idx on riot_sessions(discord_id);
