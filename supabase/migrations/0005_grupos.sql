create table grupos (
  id uuid primary key default gen_random_uuid(),
  torneo_id uuid not null references torneos (id) on delete cascade,
  nombre text not null,
  orden int not null default 0,
  created_at timestamptz not null default now(),
  unique (torneo_id, nombre)
);

alter table equipos add column grupo_id uuid references grupos (id) on delete set null;

alter table grupos enable row level security;

create policy "lectura publica grupos" on grupos for select using (true);
create policy "escritura admin grupos" on grupos for all using (is_admin()) with check (is_admin());
