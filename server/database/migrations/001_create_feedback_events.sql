create table if not exists feedback_events (
  feedback_event_id uuid primary key,
  attempt_id uuid not null,
  source_provider_id text not null,
  target_provider_id text not null,
  failure_class text not null,
  normalized_identity_hash text not null,
  confidence_bucket text not null,
  stripped_tracking_keys text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists feedback_events_failure_class_created_at_idx
  on feedback_events (failure_class, created_at desc);
