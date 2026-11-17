# Cuentas y sincronización para todos (Supabase, gratis)
1. https://supabase.com → New project (plan Free). Guarda la contraseña de la base de datos.
2. SQL Editor → New query → pega el contenido de `supabase.sql` → Run.
3. Authentication → Sign In / Providers → Email: desactiva **Confirm email** (así se entra al crear la cuenta).
4. Project Settings → API: copia **Project URL** y la clave **anon public**.
5. En `auth.js`, rellena el bloque `/*CFG*/var CFG={supabaseUrl:"…",supabaseKey:"…"};/*ENDCFG*/` y sube el cambio.
La clave anon es pública por diseño; los datos de cada usuario los protege la política RLS de `supabase.sql`.
