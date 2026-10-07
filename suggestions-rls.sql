-- Estas políticas son las que usamos para Sugerencias y Reclamos.
-- INSERT: cada usuario autenticado solo puede crear mensajes para su propia unidad.
-- SELECT: cada usuario solo puede ver los mensajes de su propia unidad.
create policy "Users can create suggestions for their own unit"
on public.suggestions
for insert
to authenticated
with check (
  unit_id in (
    select unit_id from public.profiles where id = auth.uid()
  )
);

create policy "Users can view their own suggestions"
on public.suggestions
for select
to authenticated
using (
  unit_id in (
    select unit_id from public.profiles where id = auth.uid()
  )
);
