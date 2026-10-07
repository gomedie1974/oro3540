# ORO v12 — Alta de propietarios

Esta versión agrega la creación de propietarios desde Administración → Propietarios.

## Importante: configurar una sola variable secreta en Netlify

En Netlify → Site configuration → Environment variables agregá:

- `SUPABASE_SERVICE_ROLE_KEY` = la **Secret / service_role key** de tu proyecto Supabase.

NO la pongas en `supabase.js`, HTML, JS del navegador ni la compartas públicamente.

La función de Netlify usa esa clave únicamente del lado servidor para crear usuarios de Supabase Auth.

`SUPABASE_URL` ya tiene configurada la URL actual de ORO, por lo que no hace falta agregarla.

## Uso

1. Publicá esta carpeta `oro-web` en Netlify.
2. Configurá `SUPABASE_SERVICE_ROLE_KEY`.
3. Hacé un nuevo deploy.
4. Entrá como Administración.
5. Abrí Propietarios.
6. Elegí una unidad sin propietario y completá:
   - nombre
   - apellido
   - email
   - contraseña inicial
7. Crear propietario.

La función verifica que quien realiza la operación sea realmente un perfil con `rol = admin`, crea el usuario en Auth y luego crea su perfil vinculado a la unidad.

La contraseña inicial no se guarda en `profiles`. Debe entregarse al propietario de forma segura.

La Unidad 13 existente no se modifica.
