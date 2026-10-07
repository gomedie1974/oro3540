-- Permite que las novedades publicadas puedan leerse desde la Home,
-- incluso antes de iniciar sesión.
create policy "Anyone can view news"
on public.news
for select
to anon, authenticated
using (true);
