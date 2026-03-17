-- Teams
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- Products
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- Team members (assignment to team + product is embedded — 1:1 per PRD)
create table team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  fte numeric(4, 2) not null default 1.0,
  team_id uuid not null references teams (id),
  product_id uuid not null references products (id),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  constraint fte_positive check (fte > 0),
  constraint fte_max check (fte <= 1)
);
