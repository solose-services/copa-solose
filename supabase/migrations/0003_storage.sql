insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "lectura publica media" on storage.objects
  for select using (bucket_id = 'media');

create policy "escritura admin media" on storage.objects
  for insert with check (bucket_id = 'media' and is_admin());

create policy "actualizacion admin media" on storage.objects
  for update using (bucket_id = 'media' and is_admin());

create policy "borrado admin media" on storage.objects
  for delete using (bucket_id = 'media' and is_admin());
