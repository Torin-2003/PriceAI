create table if not exists raw_offer_missing_candidates (
  raw_offer_id text primary key references raw_offers(id) on delete cascade,
  source_id text not null references sources(id) on delete cascade,
  first_missing_at timestamptz not null,
  latest_missing_at timestamptz not null,
  missing_count integer not null default 1 check (missing_count >= 1),
  latest_seen_run_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'resolved_seen', 'resolved_hidden', 'ignored')),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists raw_offer_missing_candidates_source_status_idx
  on raw_offer_missing_candidates(source_id, status, latest_missing_at desc);

create index if not exists raw_offer_missing_candidates_latest_missing_at_idx
  on raw_offer_missing_candidates(latest_missing_at desc);

revoke all on table raw_offer_missing_candidates from anon, authenticated, public;
grant select, insert, update, delete on table raw_offer_missing_candidates to service_role;

alter table raw_offer_missing_candidates enable row level security;

drop trigger if exists raw_offer_missing_candidates_set_updated_at on raw_offer_missing_candidates;
create trigger raw_offer_missing_candidates_set_updated_at
before update on raw_offer_missing_candidates
for each row execute function set_updated_at();
