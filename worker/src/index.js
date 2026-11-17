// API de WebOpos: cuentas, sesiones (con IP) y sincronización de progreso. Cloudflare Worker + D1.
const DAY = 86400000, SESSION_DAYS = 30, MAX_DATA = 900000;
const enc = new TextEncoder();
const b64u = (b) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
const unhex = (h) => new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16)));
async function sha256(s) { return hex(await crypto.subtle.digest('SHA-256', enc.encode(s))); }
async function pbkdf2(pw, salt) { // 100000 es el máximo que permite Workers
  const k = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, k, 256));
}
function same(a, b) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }

function cors(req, env) {
  const o = req.headers.get('Origin') || '', ok = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const h = { 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Authorization,Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
  if (ok.includes(o)) h['Access-Control-Allow-Origin'] = o;
  return h;
}
const json = (data, status, h) => new Response(JSON.stringify(data), { status: status || 200, headers: { 'Content-Type': 'application/json', ...h } });

async function tooMany(env, k, max, windowMs) {
  const since = Date.now() - windowMs;
  const r = await env.DB.prepare('SELECT COUNT(*) n FROM attempts WHERE k=? AND t>?').bind(k, since).first();
  return r.n >= max;
}
const note = (env, k) => env.DB.prepare('INSERT INTO attempts(k,t) VALUES(?,?)').bind(k, Date.now()).run();

async function newSession(env, req, uid) {
  const raw = new Uint8Array(32); crypto.getRandomValues(raw); const token = b64u(raw), now = Date.now();
  await env.DB.prepare('INSERT INTO sessions(token_hash,user_id,ip,ua,country,created,last,expires) VALUES(?,?,?,?,?,?,?,?)')
    .bind(await sha256(token), uid, req.headers.get('CF-Connecting-IP') || '', (req.headers.get('User-Agent') || '').slice(0, 200), (req.cf && req.cf.country) || '', now, now, now + SESSION_DAYS * DAY).run();
  return token;
}
async function auth(env, req) {
  const m = /^Bearer (.+)$/.exec(req.headers.get('Authorization') || ''); if (!m) return null;
  const th = await sha256(m[1]), now = Date.now();
  const s = await env.DB.prepare('SELECT s.id sid,s.expires,s.last,u.id uid,u.name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?').bind(th).first();
  if (!s || s.expires < now) return null;
  if (now - s.last > 3600000) await env.DB.prepare('UPDATE sessions SET last=?,expires=? WHERE id=?').bind(now, now + SESSION_DAYS * DAY, s.sid).run();
  return { sid: s.sid, uid: s.uid, name: s.name, th };
}

export default {
  async fetch(req, env) {
    const H = cors(req, env), url = new URL(req.url), p = url.pathname, m = req.method;
    if (m === 'OPTIONS') return new Response(null, { status: 204, headers: H });
    try {
      const ip = req.headers.get('CF-Connecting-IP') || 'x';
      if (p === '/api/register' && m === 'POST') {
        if (env.ALLOW_REGISTER !== '1') return json({ error: 'El registro está cerrado' }, 403, H);
        const b = await req.json(), name = String(b.user || '').trim(), pw = String(b.password || '');
        if (env.INVITE_CODE && b.invite !== env.INVITE_CODE) return json({ error: 'Código de invitación incorrecto' }, 403, H);
        if (!/^[\w.\-áéíóúñÁÉÍÓÚÑ ]{3,24}$/.test(name)) return json({ error: 'Usuario de 3 a 24 caracteres (letras, números, . _ -)' }, 400, H);
        if (pw.length < 6 || pw.length > 200) return json({ error: 'La contraseña necesita al menos 6 caracteres' }, 400, H);
        if (await tooMany(env, 'reg:' + ip, 5, 3600000)) return json({ error: 'Demasiadas cuentas creadas desde tu red. Espera una hora.' }, 429, H);
        const salt = crypto.getRandomValues(new Uint8Array(16)), hash = await pbkdf2(pw, salt);
        try { await env.DB.prepare('INSERT INTO users(name,salt,hash,created) VALUES(?,?,?,?)').bind(name, hex(salt), hash, Date.now()).run(); }
        catch (e) { return json({ error: 'Ese usuario ya existe' }, 409, H); }
        await note(env, 'reg:' + ip);
        const u = await env.DB.prepare('SELECT id FROM users WHERE name=?').bind(name).first();
        return json({ token: await newSession(env, req, u.id), user: name }, 200, H);
      }
      if (p === '/api/login' && m === 'POST') {
        const b = await req.json(), name = String(b.user || '').trim(), pw = String(b.password || ''), k = 'login:' + ip + ':' + name.toLowerCase();
        if (await tooMany(env, k, 8, 600000)) return json({ error: 'Demasiados intentos. Espera 10 minutos.' }, 429, H);
        const u = await env.DB.prepare('SELECT id,name,salt,hash FROM users WHERE name=?').bind(name).first();
        const calc = await pbkdf2(pw, u ? unhex(u.salt) : new Uint8Array(16));
        if (!u || !same(calc, u.hash)) { await note(env, k); return json({ error: 'Usuario o contraseña incorrectos' }, 401, H); }
        return json({ token: await newSession(env, req, u.id), user: u.name }, 200, H);
      }
      const a = await auth(env, req);
      if (!a) return json({ error: 'Sesión no válida o caducada' }, 401, H);
      if (p === '/api/logout' && m === 'POST') { await env.DB.prepare('DELETE FROM sessions WHERE id=?').bind(a.sid).run(); return json({ ok: 1 }, 200, H); }
      if (p === '/api/me' && m === 'GET') return json({ user: a.name }, 200, H);
      if (p === '/api/data' && m === 'GET') {
        const r = await env.DB.prepare('SELECT data,rev,updated FROM userdata WHERE user_id=?').bind(a.uid).first();
        return json(r ? { data: JSON.parse(r.data), rev: r.rev, updated: r.updated } : { data: null, rev: 0 }, 200, H);
      }
      if (p === '/api/data' && m === 'PUT') {
        const txt = await req.text(); if (txt.length > MAX_DATA) return json({ error: 'Datos demasiado grandes' }, 413, H);
        const b = JSON.parse(txt), cur = await env.DB.prepare('SELECT rev FROM userdata WHERE user_id=?').bind(a.uid).first(), rev = cur ? cur.rev : 0;
        if ((b.rev || 0) !== rev) { const r = await env.DB.prepare('SELECT data,rev FROM userdata WHERE user_id=?').bind(a.uid).first(); return json({ conflict: 1, data: JSON.parse(r.data), rev: r.rev }, 409, H); }
        await env.DB.prepare('INSERT INTO userdata(user_id,data,rev,updated) VALUES(?,?,1,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data,rev=rev+1,updated=excluded.updated')
          .bind(a.uid, JSON.stringify(b.data), Date.now()).run();
        return json({ rev: rev + 1 }, 200, H);
      }
      if (p === '/api/sessions' && m === 'GET') {
        const l = await env.DB.prepare('SELECT id,ip,ua,country,created,last FROM sessions WHERE user_id=? AND expires>? ORDER BY last DESC').bind(a.uid, Date.now()).all();
        return json({ sessions: l.results.map((s) => ({ ...s, current: s.id === a.sid })) }, 200, H);
      }
      const dm = /^\/api\/sessions\/(\d+)$/.exec(p);
      if (dm && m === 'DELETE') { await env.DB.prepare('DELETE FROM sessions WHERE id=? AND user_id=?').bind(+dm[1], a.uid).run(); return json({ ok: 1 }, 200, H); }
      return json({ error: 'No encontrado' }, 404, H);
    } catch (e) { return json({ error: 'Error del servidor' }, 500, H); }
  },
};
