# API de WebOpos (Cloudflare Worker + D1)
Cuentas, sesiones con IP y sincronización del progreso (sin SQL).

```bash
cd worker
npx wrangler login
# (la base D1 «webopos» y sus tablas ya están creadas; el id ya está en wrangler.toml)
npx wrangler deploy                     # imprime https://webopos-api.<tu-subdominio>.workers.dev
```
Después pon esa URL en `auth.js`: `var CFG={apiUrl:"https://webopos-api.….workers.dev"};` y sube el cambio.
Ajustes en `wrangler.toml`: `ALLOWED_ORIGINS` (tu web), `ALLOW_REGISTER` ("0" cierra el registro) e `INVITE_CODE` (código para crear cuenta).
