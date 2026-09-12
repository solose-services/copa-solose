create extension if not exists pgcrypto;

create table torneos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null,
  temporada text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table equipos (
  id uuid primary key default gen_random_uuid(),
  torneo_id uuid not null references torneos (id) on delete cascade,
  nombre text not null,
  logo_url text,
  orden_desempate_manual int,
  created_at timestamptz not null default now()
);

create table jugadoras (
  id uuid primary key default gen_random_uuid(),
  equipo_id uuid not null references equipos (id) on delete cascade,
  nombre text not null,
  foto_url text,
  numero_camiseta int,
  created_at timestamptz not null default now(),
  unique (equipo_id, numero_camiseta)
);

create table jornadas (
  id uuid primary key default gen_random_uuid(),
  torneo_id uuid not null references torneos (id) on delete cascade,
  etiqueta text not null,
  tipo text not null check (tipo in ('regular', 'liguilla')),
  orden int not null,
  created_at timestamptz not null default now(),
  unique (torneo_id, orden)
);

create table partidos (
  id uuid primary key default gen_random_uuid(),
  jornada_id uuid not null references jornadas (id) on delete cascade,
  equipo_local_id uuid not null references equipos (id),
  equipo_visitante_id uuid not null references equipos (id),
  fecha date,
  hora time,
  mvp_jugadora_id uuid references jugadoras (id),
  incidencias text,
  created_at timestamptz not null default now(),
  check (equipo_local_id <> equipo_visitante_id)
);

create table alineaciones (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null references partidos (id) on delete cascade,
  jugadora_id uuid not null references jugadoras (id) on delete cascade,
  equipo_id uuid not null references equipos (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (partido_id, jugadora_id)
);

create table goles (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null references partidos (id) on delete cascade,
  jugadora_id uuid not null references jugadoras (id) on delete cascade,
  minuto int not null check (minuto >= 0),
  created_at timestamptz not null default now()
);

create table tarjetas (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null references partidos (id) on delete cascade,
  jugadora_id uuid not null references jugadoras (id) on delete cascade,
  tipo text not null check (tipo in ('amarilla', 'roja')),
  minuto int not null check (minuto >= 0),
  created_at timestamptz not null default now()
);

create table suspensiones (
  id uuid primary key default gen_random_uuid(),
  jugadora_id uuid not null references jugadoras (id) on delete cascade,
  tarjeta_id uuid references tarjetas (id) on delete set null,
  jornada_desde_id uuid not null references jornadas (id),
  jornada_hasta_id uuid not null references jornadas (id),
  motivo text,
  created_at timestamptz not null default now()
);

create table avisos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  cuerpo text not null,
  imagen_url text,
  fecha_publicacion timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table reglamentos (
  id uuid primary key default gen_random_uuid(),
  torneo_id uuid not null unique references torneos (id) on delete cascade,
  pdf_url text not null,
  actualizado_en timestamptz not null default now()
);

create table perfiles_admin (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now()
);
