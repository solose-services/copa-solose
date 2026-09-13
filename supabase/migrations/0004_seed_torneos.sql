insert into torneos (nombre, categoria, temporada, activo)
select 'Torneo Femenil', 'femenil', '2026', true
where not exists (
  select 1 from torneos where categoria = 'femenil' and temporada = '2026'
);

insert into torneos (nombre, categoria, temporada, activo)
select 'Torneo Mixto', 'mixto', '2026', true
where not exists (
  select 1 from torneos where categoria = 'mixto' and temporada = '2026'
);
