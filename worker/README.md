# API de WebOpos (Cloudflare Worker + D1)
Cuentas, sesiones con IP y sincronización del progreso (sin SQL).

```bash
cd worker
npx wrangler login
npx wrangler d1 create webopos          # copia el database_id en wrangler.toml
npx wrangler d1 execute webopos --remote --file=schema.sql
npx wrangler deploy                     # imprime https://webopos-api.<tu-subdominio>.workers.dev
```
Después pon esa URL en `auth.js`: `var CFG={apiUrl:"https://webopos-api.….workers.dev"};` y sube el cambio.
Ajustes en `wrangler.toml`: `ALLOWED_ORIGINS` (tu web), `ALLOW_REGISTER` ("0" cierra el registro) e `INVITE_CODE` (código para crear cuenta).
