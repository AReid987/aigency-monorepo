create table if not exists projects (
  id text primary key,
  name text not null,
  remote_url text,
  last_commit text,
  indexed_at timestamptz,
  meta jsonb not null default '{}'::jsonb,
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists wiki_pages (
  id serial primary key,
  project_id text not null references projects(id) on delete cascade,
  slug text not null,
  title text not null,
  markdown text not null,
  generated_at timestamptz,
  unique (project_id, slug)
);

create index if not exists idx_wiki_pages_project on wiki_pages(project_id);

create table if not exists sync_jobs (
  id serial primary key,
  project_id text not null references projects(id) on delete cascade,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists idx_sync_jobs_project on sync_jobs(project_id);
