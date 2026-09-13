create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from perfiles_admin where id = auth.uid()
  );
$$;

alter table torneos enable row level security;
alter table equipos enable row level security;
alter table jugadoras enable row level security;
alter table jornadas enable row level security;
alter table partidos enable row level security;
alter table alineaciones enable row level security;
alter table goles enable row level security;
alter table tarjetas enable row level security;
alter table suspensiones enable row level security;
alter table avisos enable row level security;
alter table reglamentos enable row level security;
alter table perfiles_admin enable row level security;

create policy "lectura publica torneos" on torneos for select using (true);
create policy "escritura admin torneos" on torneos for all using (is_admin()) with check (is_admin());

create policy "lectura publica equipos" on equipos for select using (true);
create policy "escritura admin equipos" on equipos for all using (is_admin()) with check (is_admin());

create policy "lectura publica jugadoras" on jugadoras for select using (true);
create policy "escritura admin jugadoras" on jugadoras for all using (is_admin()) with check (is_admin());

create policy "lectura publica jornadas" on jornadas for select using (true);
create policy "escritura admin jornadas" on jornadas for all using (is_admin()) with check (is_admin());

create policy "lectura publica partidos" on partidos for select using (true);
create policy "escritura admin partidos" on partidos for all using (is_admin()) with check (is_admin());

create policy "lectura publica alineaciones" on alineaciones for select using (true);
create policy "escritura admin alineaciones" on alineaciones for all using (is_admin()) with check (is_admin());

create policy "lectura publica goles" on goles for select using (true);
create policy "escritura admin goles" on goles for all using (is_admin()) with check (is_admin());

create policy "lectura publica tarjetas" on tarjetas for select using (true);
create policy "escritura admin tarjetas" on tarjetas for all using (is_admin()) with check (is_admin());

create policy "lectura publica suspensiones" on suspensiones for select using (true);
create policy "escritura admin suspensiones" on suspensiones for all using (is_admin()) with check (is_admin());

create policy "lectura publica avisos" on avisos for select using (true);
create policy "escritura admin avisos" on avisos for all using (is_admin()) with check (is_admin());

create policy "lectura publica reglamentos" on reglamentos for select using (true);
create policy "escritura admin reglamentos" on reglamentos for all using (is_admin()) with check (is_admin());

create policy "admin lee su propio perfil" on perfiles_admin for select using (auth.uid() = id);
