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

async function newSession(env, req, uid, dev) {
  dev = String(dev || '').replace(/[^a-f0-9]/gi, '').slice(0, 64);
  if (dev) await env.DB.prepare('DELETE FROM sessions WHERE user_id=? AND dev=?').bind(uid, dev).run(); // una sesión por equipo
  const raw = new Uint8Array(32); crypto.getRandomValues(raw); const token = b64u(raw), now = Date.now();
  await env.DB.prepare('INSERT INTO sessions(token_hash,user_id,ip,ua,country,created,last,expires,dev) VALUES(?,?,?,?,?,?,?,?,?)')
    .bind(await sha256(token), uid, req.headers.get('CF-Connecting-IP') || '', (req.headers.get('User-Agent') || '').slice(0, 200), (req.cf && req.cf.country) || '', now, now, now + SESSION_DAYS * DAY, dev).run();
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


const CODE_CH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const newCode = () => [...crypto.getRandomValues(new Uint8Array(6))].map((x) => CODE_CH[x % CODE_CH.length]).join('');
const ROOM_TTL = 60 * 60 * 1000, MAX_PLAYERS = 4;
async function roomView(env, room, a) {
  const pl = (await env.DB.prepare('SELECT user_id,name,answers,ok,err,done,joined FROM room_players WHERE code=? ORDER BY joined').bind(room.code).all()).results;
  const me = pl.find((x) => x.user_id === a.uid); let mine = {}; try { mine = me ? JSON.parse(me.answers) : {}; } catch (e) {}
  const host = await env.DB.prepare('SELECT name FROM users WHERE id=?').bind(room.host_id).first();
  const players = pl.map((x) => {
    let ans = {}; try { ans = JSON.parse(x.answers); } catch (e) {}
    const o = { name: x.name, host: x.user_id === room.host_id, me: x.user_id === a.uid, ok: x.ok, err: x.err, answered: Object.keys(ans).length, done: !!x.done };
    if (x.user_id === a.uid) o.answers = ans; else { o.answers = {}; for (const k of Object.keys(ans)) if (k in mine) o.answers[k] = ans[k]; } // la respuesta del otro solo se ve cuando ya has respondido tú
    return o;
  });
  const qids = JSON.parse(room.qids);
  return { code: room.code, title: room.title || '', n: qids.length, secs: room.secs, pen: room.pen, started: room.started, now: Date.now(), host: host ? host.name : '', isHost: room.host_id === a.uid, joined: !!me, full: pl.length >= MAX_PLAYERS, qids: me ? qids : undefined, players };
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
        return json({ token: await newSession(env, req, u.id, b.dev), user: name }, 200, H);
      }
      if (p === '/api/login' && m === 'POST') {
        const b = await req.json(), name = String(b.user || '').trim(), pw = String(b.password || ''), k = 'login:' + ip + ':' + name.toLowerCase();
        if (await tooMany(env, k, 8, 600000)) return json({ error: 'Demasiados intentos. Espera 10 minutos.' }, 429, H);
        const u = await env.DB.prepare('SELECT id,name,salt,hash FROM users WHERE name=?').bind(name).first();
        const calc = await pbkdf2(pw, u ? unhex(u.salt) : new Uint8Array(16));
        if (!u || !same(calc, u.hash)) { await note(env, k); return json({ error: 'Usuario o contraseña incorrectos' }, 401, H); }
        return json({ token: await newSession(env, req, u.id, b.dev), user: u.name }, 200, H);
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
        const l = await env.DB.prepare('SELECT id,ip,ua,country,created,last,dev FROM sessions WHERE user_id=? AND expires>? ORDER BY last DESC').bind(a.uid, Date.now()).all();
        return json({ sessions: l.results.map((s) => ({ ...s, current: s.id === a.sid })) }, 200, H);
      }
      const dm = /^\/api\/sessions\/(\d+)$/.exec(p);
      if (dm && m === 'DELETE') { await env.DB.prepare('DELETE FROM sessions WHERE id=? AND user_id=?').bind(+dm[1], a.uid).run(); return json({ ok: 1 }, 200, H); }
      if (p === '/api/rooms' && m === 'POST') { // crear sala de test conjunto
        if (await tooMany(env, 'room:' + a.uid, 15, 3600000)) return json({ error: 'Demasiadas salas creadas. Espera un poco.' }, 429, H);
        const b = await req.json(), qids = [...new Set((Array.isArray(b.qids) ? b.qids : []).map(Number).filter((n) => Number.isInteger(n) && n >= 0))].slice(0, 200);
        if (qids.length < 3) return json({ error: 'Hacen falta al menos 3 preguntas' }, 400, H);
        const secs = Math.min(Math.max(b.secs | 0, 0), 14400), pen = [0, 3, 4].includes(b.pen | 0) ? b.pen | 0 : 3, title = String(b.title || '').slice(0, 80), now = Date.now();
        await env.DB.prepare('DELETE FROM room_players WHERE code IN (SELECT code FROM rooms WHERE created<?)').bind(now - ROOM_TTL).run();
        await env.DB.prepare('DELETE FROM rooms WHERE created<?').bind(now - ROOM_TTL).run();
        let code = '', ok = false;
        for (let i = 0; i < 5 && !ok; i++) { code = newCode(); try { await env.DB.prepare('INSERT INTO rooms(code,host_id,title,qids,secs,pen,created) VALUES(?,?,?,?,?,?,?)').bind(code, a.uid, title, JSON.stringify(qids), secs, pen, now).run(); ok = true; } catch (e) {} }
        if (!ok) return json({ error: 'No se pudo crear la sala' }, 500, H);
        await env.DB.prepare('INSERT INTO room_players(code,user_id,name,joined,last) VALUES(?,?,?,?,?)').bind(code, a.uid, a.name, now, now).run();
        await note(env, 'room:' + a.uid);
        return json({ code }, 200, H);
      }
      const rm = /^\/api\/rooms\/([A-Za-z0-9]{6})(?:\/(join|start|progress))?$/.exec(p);
      if (rm) {
        const code = rm[1].toUpperCase(), act = rm[2], room = await env.DB.prepare('SELECT * FROM rooms WHERE code=?').bind(code).first();
        if (!room || room.created < Date.now() - ROOM_TTL) return json({ error: 'Esa sala no existe o ha caducado' }, 404, H);
        if (!act && m === 'GET') return json(await roomView(env, room, a), 200, H);
        if (act === 'join' && m === 'POST') {
          const cnt = (await env.DB.prepare('SELECT COUNT(*) n FROM room_players WHERE code=?').bind(code).first()).n, me = await env.DB.prepare('SELECT 1 x FROM room_players WHERE code=? AND user_id=?').bind(code, a.uid).first();
          if (!me) {
            if (room.started) return json({ error: 'La sala ya ha empezado' }, 409, H);
            if (cnt >= MAX_PLAYERS) return json({ error: 'La sala está llena' }, 409, H);
            const now = Date.now(); await env.DB.prepare('INSERT INTO room_players(code,user_id,name,joined,last) VALUES(?,?,?,?,?)').bind(code, a.uid, a.name, now, now).run();
          }
          return json(await roomView(env, room, a), 200, H);
        }
        if (act === 'start' && m === 'POST') {
          if (room.host_id !== a.uid) return json({ error: 'Solo quien creó la sala puede empezar' }, 403, H);
          if (!room.started) { await env.DB.prepare('UPDATE rooms SET started=? WHERE code=? AND started IS NULL').bind(Date.now(), code).run(); room.started = Date.now(); }
          return json(await roomView(env, (await env.DB.prepare('SELECT * FROM rooms WHERE code=?').bind(code).first()), a), 200, H);
        }
        if (act === 'progress' && (m === 'PUT' || m === 'POST')) {
          const me = await env.DB.prepare('SELECT 1 x FROM room_players WHERE code=? AND user_id=?').bind(code, a.uid).first();
          if (!me) return json({ error: 'No estás en esta sala' }, 403, H);
          if (!room.started) return json({ error: 'La sala aún no ha empezado' }, 409, H);
          const txt = await req.text(); if (txt.length > 20000) return json({ error: 'Demasiados datos' }, 413, H);
          const b = JSON.parse(txt), cur = await env.DB.prepare('SELECT answers FROM room_players WHERE code=? AND user_id=?').bind(code, a.uid).first(); let ans = {}; try { ans = JSON.parse(cur.answers); } catch (e) {}
          const allowed = new Set(JSON.parse(room.qids).map(String)); let n = Object.keys(ans).length;
          for (const [k, v] of Object.entries(b.answers || {})) { if (!(k in ans) && allowed.has(k) && Number.isInteger(v) && v >= -1 && v <= 3 && n++ < 200) ans[k] = v; } // una respuesta dada no se puede cambiar
          await env.DB.prepare('UPDATE room_players SET answers=?,ok=?,err=?,done=?,last=? WHERE code=? AND user_id=?')
            .bind(JSON.stringify(ans), 0, 0, Object.keys(ans).length >= allowed.size ? 1 : 0, Date.now(), code, a.uid).run();
          return json(await roomView(env, room, a), 200, H);
        }
      }
      return json({ error: 'No encontrado' }, 404, H);
    } catch (e) { return json({ error: 'Error del servidor' }, 500, H); }
  },
};
