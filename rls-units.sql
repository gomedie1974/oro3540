-- Ejecutar una sola vez en Supabase SQL Editor:
create policy "Authenticated users can view units"
on public.units
for select
to authenticated
using (true);
