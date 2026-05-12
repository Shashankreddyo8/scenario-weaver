
-- Extensions
create extension if not exists vector;
create extension if not exists pg_trgm;

-- Storage bucket for protocol uploads
insert into storage.buckets (id, name, public)
values ('protocols', 'protocols', true)
on conflict (id) do nothing;

create policy "Public read protocols"
on storage.objects for select
using (bucket_id = 'protocols');

create policy "Public upload protocols"
on storage.objects for insert
with check (bucket_id = 'protocols');

-- Documents
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  source_type text not null default 'pdf',
  hazard_tags text[] default '{}',
  status text not null default 'pending',
  storage_path text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.documents enable row level security;
create policy "Public read documents" on public.documents for select using (true);
create policy "Public insert documents" on public.documents for insert with check (true);
create policy "Public update documents" on public.documents for update using (true);
create policy "Public delete documents" on public.documents for delete using (true);

-- Document chunks with embeddings + tsvector for hybrid search
create table public.doc_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  meta jsonb default '{}'::jsonb,
  embedding vector(768),
  tsv tsvector generated always as (to_tsvector('english', content)) stored,
  created_at timestamptz not null default now()
);
create index doc_chunks_tsv_idx on public.doc_chunks using gin(tsv);
create index doc_chunks_trgm_idx on public.doc_chunks using gin (content gin_trgm_ops);
create index doc_chunks_embedding_idx on public.doc_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
alter table public.doc_chunks enable row level security;
create policy "Public read chunks" on public.doc_chunks for select using (true);
create policy "Public insert chunks" on public.doc_chunks for insert with check (true);
create policy "Public delete chunks" on public.doc_chunks for delete using (true);

-- Simulations
create table public.simulations (
  id uuid primary key default gen_random_uuid(),
  scenario_input text not null,
  status text not null default 'active',
  state jsonb not null default jsonb_build_object(
    'threatLevel','low',
    'casualties',0,
    'weather','clear',
    'infrastructure','stable',
    'sentiment','neutral',
    'activeProtocols','{}'::jsonb,
    'incidents','{}'::jsonb
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.simulations enable row level security;
create policy "Public read sims" on public.simulations for select using (true);
create policy "Public insert sims" on public.simulations for insert with check (true);
create policy "Public update sims" on public.simulations for update using (true);

-- Events
create table public.simulation_events (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null references public.simulations(id) on delete cascade,
  event_type text not null,
  source text not null default 'system',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index sim_events_sim_idx on public.simulation_events(simulation_id, created_at desc);
alter table public.simulation_events enable row level security;
create policy "Public read events" on public.simulation_events for select using (true);
create policy "Public insert events" on public.simulation_events for insert with check (true);

-- Agent memory
create table public.agent_memory (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null references public.simulations(id) on delete cascade,
  agent_role text not null,
  memory jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (simulation_id, agent_role)
);
alter table public.agent_memory enable row level security;
create policy "Public read memory" on public.agent_memory for select using (true);
create policy "Public write memory" on public.agent_memory for insert with check (true);
create policy "Public update memory" on public.agent_memory for update using (true);

-- Evaluations
create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid references public.simulations(id) on delete cascade,
  user_decision text not null,
  retrieved_protocols jsonb default '[]'::jsonb,
  compliance_score int not null default 0,
  critical_mistakes jsonb default '[]'::jsonb,
  quality_metrics jsonb default '{}'::jsonb,
  after_action_report text,
  created_at timestamptz not null default now()
);
alter table public.evaluations enable row level security;
create policy "Public read evals" on public.evaluations for select using (true);
create policy "Public insert evals" on public.evaluations for insert with check (true);

-- Hybrid search RPC
create or replace function public.match_chunks(
  query_embedding vector(768),
  query_text text,
  match_count int default 8,
  hazard_filter text[] default null
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  meta jsonb,
  vector_score float,
  keyword_score float,
  hybrid_score float
)
language plpgsql
stable
as $$
begin
  return query
  with vec as (
    select c.id, c.document_id, c.content, c.meta,
           1 - (c.embedding <=> query_embedding) as vscore
    from public.doc_chunks c
    join public.documents d on d.id = c.document_id
    where (hazard_filter is null or d.hazard_tags && hazard_filter)
      and c.embedding is not null
    order by c.embedding <=> query_embedding
    limit match_count * 4
  ),
  kw as (
    select c.id,
           ts_rank(c.tsv, plainto_tsquery('english', query_text)) as kscore
    from public.doc_chunks c
    where c.tsv @@ plainto_tsquery('english', query_text)
    limit match_count * 4
  )
  select v.id, v.document_id, v.content, v.meta,
         v.vscore::float as vector_score,
         coalesce(k.kscore,0)::float as keyword_score,
         (v.vscore * 0.7 + coalesce(k.kscore,0) * 0.3)::float as hybrid_score
  from vec v
  left join kw k on k.id = v.id
  order by hybrid_score desc
  limit match_count;
end;
$$;

-- Realtime
alter publication supabase_realtime add table public.simulation_events;
alter publication supabase_realtime add table public.simulations;
