-- ORO v12: nombres y apellidos de propietarios
reset role;

alter table public.profiles
add column if not exists apellido text;

-- El administrador necesita poder consultar todos los perfiles
-- para mostrar el nombre asociado a cada unidad.
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (
  public.is_admin()
);

-- Permite al administrador actualizar nombre y apellido desde el panel.
-- La interfaz no expone cambios de rol.
drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);
