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


// ---- Compañeros, perfil y presencia ----
const REACTS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const MAX_TXT = 1000, MAX_IMG = 150000, KEEP_MSGS = 300, MAX_AVATAR = 40000, ONLINE_MS = 150000, MAX_FRIENDS = 60;
const madridDay = (t) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(t);
async function userByName(env, name) { name = String(name || '').trim(); if (!name || name.length > 40) return null; return env.DB.prepare('SELECT id,name FROM users WHERE name=?').bind(name).first(); }
async function friendship(env, u, v) { return env.DB.prepare('SELECT a,b,status FROM friends WHERE (a=? AND b=?) OR (a=? AND b=?)').bind(u, v, v, u).first(); }
async function myProfile(env, a) {
  const r = await env.DB.prepare('SELECT avatar,share_online,share_topic,share_stats FROM profiles WHERE user_id=?').bind(a.uid).first();
  return { name: a.name, avatar: r ? r.avatar : '', share_online: r ? r.share_online : 1, share_topic: r ? r.share_topic : 1, share_stats: r ? r.share_stats : 0 };
}
async function badge(env, uid) {
  const f = await env.DB.prepare("SELECT COUNT(*) n FROM friends WHERE b=? AND status='pending'").bind(uid).first();
  const i = await env.DB.prepare('SELECT COUNT(*) n FROM room_invites i JOIN rooms r ON r.code=i.code WHERE i.to_id=? AND r.created>? AND (r.started IS NULL OR r.started=0) AND NOT EXISTS(SELECT 1 FROM room_players p WHERE p.code=i.code AND p.user_id=?)').bind(uid, Date.now() - ROOM_TTL, uid).first();
  const u = await env.DB.prepare('SELECT COUNT(*) n FROM messages WHERE to_id=? AND read=0').bind(uid).first();
  return f.n + i.n + u.n;
}
function summarize(d) {
  d = d || {};
  const days = d['@:ex_days'] || {}, hist = Array.isArray(d['@:ex_hist']) ? d['@:ex_hist'] : [], srs = d['@:ex_srs'] || {}, done = d.done || {};
  let t = Date.now(), streak = 0; if (!(days[madridDay(t)] > 0)) t -= DAY;
  while (days[madridDay(t)] > 0 && streak < 2000) { streak++; t -= DAY; }
  const last7 = []; for (let i = 6; i >= 0; i--) { const k = madridDay(Date.now() - i * DAY); last7.push({ d: k, n: days[k] | 0 }); }
  const total = Object.values(days).reduce((x, y) => x + (+y || 0), 0);
  const sum = hist.reduce((x, y) => ({ a: x.a + (y.a | 0), e: x.e + (y.e | 0), b: x.b + (y.b | 0) }), { a: 0, e: 0, b: 0 }), l10 = hist.slice(-10);
  return {
    streak, total, today: days[madridDay(Date.now())] | 0, last7, tests: hist.length,
    exams: hist.slice(-8).map((x) => ({ t: +x.t || 0, nota: +x.nota || 0, n: x.n | 0, a: x.a | 0, e: x.e | 0, b: x.b | 0, m: String(x.m || '').slice(0, 8) })),
    acc: sum.a + sum.e + sum.b ? sum.a / (sum.a + sum.e + sum.b) : null,
    avg10: l10.length ? l10.reduce((x, y) => x + (+y.nota || 0), 0) / l10.length : null,
    learned: Object.keys(srs).length, topicsDone: Object.values(done).filter(Boolean).length,
  };
}

const CODE_CH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const newCode = () => [...crypto.getRandomValues(new Uint8Array(6))].map((x) => CODE_CH[x % CODE_CH.length]).join('');
const ROOM_TTL = 60 * 60 * 1000, MAX_PLAYERS = 4, LEAVE_GRACE = 12000, STALE = 150000;
async function touch(env, room, a) { // latido; si ya se había marcado la salida o lleva mucho sin dar señales, no se "resucita"
  const now = Date.now();
  await env.DB.prepare('UPDATE room_players SET last=?,ok=CASE WHEN ok>0 AND ?-ok<=? THEN 0 ELSE ok END WHERE code=? AND user_id=? AND (?-last<=? OR ?=0)').bind(now, now, LEAVE_GRACE, room.code, a.uid, now, STALE, room.started ? 1 : 0).run();
}
async function roomView(env, room, a) {
  const pl = (await env.DB.prepare('SELECT user_id,name,answers,ok,err,done,joined,last FROM room_players WHERE code=? ORDER BY joined').bind(room.code).all()).results;
  const me = pl.find((x) => x.user_id === a.uid); let mine = {}; try { mine = me ? JSON.parse(me.answers) : {}; } catch (e) {}
  const host = await env.DB.prepare('SELECT name FROM users WHERE id=?').bind(room.host_id).first();
  const players = pl.map((x) => {
    let ans = {}; try { ans = JSON.parse(x.answers); } catch (e) {}
    const o = { name: x.name, host: x.user_id === room.host_id, me: x.user_id === a.uid, ok: x.ok, err: x.err, answered: Object.keys(ans).length, done: !!x.done };
    if (x.user_id === a.uid) o.answers = ans; else { o.answers = {}; for (const k of Object.keys(ans)) if (k in mine) o.answers[k] = ans[k]; } // la respuesta del otro solo se ve cuando ya has respondido tú
    return o;
  });
  const qids = JSON.parse(room.qids), now = Date.now(); let ended = null;
  if (room.started) for (const x of pl) if (!x.done && ((x.ok > 0 && now - x.ok > LEAVE_GRACE) || now - x.last > STALE)) { ended = { name: x.name }; break; } // alguien cerró la pestaña: el test termina para todos
  return { ended, code: room.code, title: room.title || '', n: qids.length, secs: room.secs, pen: room.pen, started: room.started, now: Date.now(), host: host ? host.name : '', isHost: room.host_id === a.uid, joined: !!me, full: pl.length >= MAX_PLAYERS, qids: me ? qids : undefined, players };
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
      if (p === '/api/profile' && m === 'GET') return json(await myProfile(env, a), 200, H);
      if (p === '/api/profile' && m === 'PUT') {
        const b = await req.json(), cur = (await env.DB.prepare('SELECT avatar,share_online,share_topic,share_stats FROM profiles WHERE user_id=?').bind(a.uid).first()) || { avatar: '', share_online: 1, share_topic: 1, share_stats: 0 };
        let av = cur.avatar;
        if (b.avatar !== undefined) { av = String(b.avatar || ''); if (av && (av.length > MAX_AVATAR || !/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(av))) return json({ error: 'Imagen no válida o demasiado grande' }, 400, H); }
        const f = (k) => (b[k] === undefined ? cur[k] : b[k] ? 1 : 0);
        await env.DB.prepare('INSERT INTO profiles(user_id,avatar,share_online,share_topic,share_stats) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET avatar=excluded.avatar,share_online=excluded.share_online,share_topic=excluded.share_topic,share_stats=excluded.share_stats')
          .bind(a.uid, av, f('share_online'), f('share_topic'), f('share_stats')).run();
        return json(await myProfile(env, a), 200, H);
      }
      if (p === '/api/presence' && m === 'POST') {
        let b = {}; try { b = await req.json(); } catch (e) {}
        const label = String(b.label || '').replace(/[\u0000-\u001f<>]/g, '').slice(0, 90);
        await env.DB.prepare('INSERT INTO profiles(user_id,last,label) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET last=excluded.last,label=excluded.label').bind(a.uid, Date.now(), label).run();
        return json({ badge: await badge(env, a.uid) }, 200, H);
      }
      if (p === '/api/social' && m === 'GET') {
        const now = Date.now();
        const rows = (await env.DB.prepare('SELECT f.a,f.b,f.status,f.created,u.id uid,u.name,p.avatar,p.share_online,p.share_topic,p.share_stats,p.last,p.label FROM friends f JOIN users u ON u.id=(CASE WHEN f.a=? THEN f.b ELSE f.a END) LEFT JOIN profiles p ON p.user_id=u.id WHERE f.a=? OR f.b=? ORDER BY u.name').bind(a.uid, a.uid, a.uid).all()).results;
        const unread = {}; for (const r of (await env.DB.prepare('SELECT from_id,COUNT(*) n FROM messages WHERE to_id=? AND read=0 GROUP BY from_id').bind(a.uid).all()).results) unread[r.from_id] = r.n;
        const friends = [], incoming = [], outgoing = [];
        for (const r of rows) {
          const pub = { name: r.name, avatar: r.avatar || '' };
          if (r.status === 'ok') {
            const so = r.share_online === null || r.share_online === 1, st = r.share_topic === null || r.share_topic === 1, on = so && r.last && now - r.last < ONLINE_MS;
            friends.push({ ...pub, online: so ? !!on : null, label: so && st && on ? r.label || '' : '', last: so && r.last ? r.last : 0, canStats: r.share_stats === 1, since: r.created, unread: unread[r.uid] || 0 });
          } else if (r.b === a.uid) incoming.push({ ...pub, created: r.created });
          else outgoing.push({ ...pub, created: r.created });
        }
        const inv = (await env.DB.prepare('SELECT i.code,i.created,u.name from_name,r.title,r.qids FROM room_invites i JOIN rooms r ON r.code=i.code JOIN users u ON u.id=i.from_id WHERE i.to_id=? AND r.created>? AND (r.started IS NULL OR r.started=0) AND NOT EXISTS(SELECT 1 FROM room_players p WHERE p.code=i.code AND p.user_id=?) ORDER BY i.created DESC LIMIT 20').bind(a.uid, now - ROOM_TTL, a.uid).all()).results
          .map((x) => { let n = 0; try { n = JSON.parse(x.qids).length; } catch (e) {} return { code: x.code, from: x.from_name, title: x.title || '', n, created: x.created }; });
        return json({ me: await myProfile(env, a), friends, incoming, outgoing, invites: inv, badge: incoming.length + inv.length + Object.values(unread).reduce((x, y) => x + y, 0) }, 200, H);
      }
      if (p === '/api/users' && m === 'GET') { // autocompletar al añadir compañeros (solo usuarios que aún no son compañeros ni tienen solicitud)
        const q = (url.searchParams.get('q') || '').trim().slice(0, 24).replace(/[\\%_]/g, '');
        const r = await env.DB.prepare("SELECT u.name,p.avatar FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id<>? AND u.name LIKE ? AND u.id NOT IN (SELECT CASE WHEN a=? THEN b ELSE a END FROM friends WHERE a=? OR b=?) ORDER BY (u.name LIKE ?) DESC, u.name COLLATE NOCASE LIMIT 30")
          .bind(a.uid, '%' + q + '%', a.uid, a.uid, a.uid, q + '%').all();
        return json({ users: r.results.map((x) => ({ name: x.name, avatar: x.avatar || '' })) }, 200, H);
      }
      if (p === '/api/friends' && m === 'POST') {
        const b = await req.json(), t = await userByName(env, b.user);
        if (!t) return json({ error: 'No existe ningún usuario con ese nombre' }, 404, H);
        if (t.id === a.uid) return json({ error: 'No puedes añadirte a ti mismo' }, 400, H);
        if (await tooMany(env, 'frq:' + a.uid, 20, 3600000)) return json({ error: 'Demasiadas solicitudes. Espera un poco.' }, 429, H);
        const ex = await friendship(env, a.uid, t.id);
        if (ex) {
          if (ex.status === 'ok') return json({ error: 'Ya sois compañeros' }, 409, H);
          if (ex.b === a.uid) { await env.DB.prepare("UPDATE friends SET status='ok' WHERE a=? AND b=?").bind(ex.a, ex.b).run(); return json({ ok: 1, accepted: 1, name: t.name }, 200, H); }
          return json({ error: 'Ya le enviaste una solicitud' }, 409, H);
        }
        const cnt = (await env.DB.prepare('SELECT COUNT(*) n FROM friends WHERE a=? OR b=?').bind(a.uid, a.uid).first()).n;
        if (cnt >= MAX_FRIENDS) return json({ error: 'Has alcanzado el máximo de compañeros' }, 409, H);
        await env.DB.prepare("INSERT INTO friends(a,b,status,created) VALUES(?,?,'pending',?)").bind(a.uid, t.id, Date.now()).run();
        await note(env, 'frq:' + a.uid);
        return json({ ok: 1, name: t.name }, 200, H);
      }
      const fm = /^\/api\/friends\/([^/]+?)(?:\/(accept|stats))?$/.exec(p);
      if (fm) {
        let nm = ''; try { nm = decodeURIComponent(fm[1]); } catch (e) { return json({ error: 'Nombre no válido' }, 400, H); }
        const t = await userByName(env, nm); if (!t) return json({ error: 'No existe ese usuario' }, 404, H);
        const ex = await friendship(env, a.uid, t.id);
        if (fm[2] === 'accept' && m === 'POST') {
          if (!ex || ex.status !== 'pending' || ex.b !== a.uid) return json({ error: 'No hay solicitud pendiente' }, 404, H);
          await env.DB.prepare("UPDATE friends SET status='ok' WHERE a=? AND b=?").bind(ex.a, ex.b).run(); return json({ ok: 1 }, 200, H);
        }
        if (fm[2] === 'stats' && m === 'GET') {
          if (!ex || ex.status !== 'ok') return json({ error: 'No sois compañeros' }, 403, H);
          const pr = await env.DB.prepare('SELECT share_stats FROM profiles WHERE user_id=?').bind(t.id).first();
          if (!pr || pr.share_stats !== 1) return json({ error: 'Esta persona no comparte sus estadísticas' }, 403, H);
          const r = await env.DB.prepare('SELECT data,updated FROM userdata WHERE user_id=?').bind(t.id).first(); let d = null; try { d = r ? JSON.parse(r.data) : null; } catch (e) {}
          return json({ name: t.name, updated: r ? r.updated : 0, stats: summarize(d) }, 200, H);
        }
        if (!fm[2] && m === 'DELETE') {
          if (ex) { await env.DB.prepare('DELETE FROM friends WHERE a=? AND b=?').bind(ex.a, ex.b).run(); await env.DB.prepare('DELETE FROM room_invites WHERE (to_id=? AND from_id=?) OR (to_id=? AND from_id=?)').bind(a.uid, t.id, t.id, a.uid).run(); }
          return json({ ok: 1 }, 200, H);
        }
      }
      const ci = /^\/api\/chat\/image\/(\d+)$/.exec(p);
      if (ci && m === 'GET') {
        const r = await env.DB.prepare("SELECT body,from_id,to_id FROM messages WHERE id=? AND kind='img'").bind(+ci[1]).first();
        if (!r || (r.from_id !== a.uid && r.to_id !== a.uid)) return json({ error: 'No encontrado' }, 404, H);
        return json({ data: r.body }, 200, H);
      }
      const cm = /^\/api\/chat\/msg\/(\d+)(\/react)?$/.exec(p);
      if (cm) {
        const mid = +cm[1], row = await env.DB.prepare('SELECT id,from_id,to_id,kind FROM messages WHERE id=?').bind(mid).first();
        if (!row || (row.from_id !== a.uid && row.to_id !== a.uid)) return json({ error: 'No encontrado' }, 404, H);
        if (!cm[2] && m === 'DELETE') {
          if (row.from_id !== a.uid) return json({ error: 'Solo puedes borrar tus mensajes' }, 403, H);
          await env.DB.prepare("UPDATE messages SET kind='del',body='' WHERE id=?").bind(mid).run();
          await env.DB.prepare('DELETE FROM msg_react WHERE msg_id=?').bind(mid).run();
          return json({ ok: 1 }, 200, H);
        }
        if (cm[2] && m === 'POST') {
          if (row.kind === 'del') return json({ error: 'Mensaje eliminado' }, 410, H);
          const b = await req.json().catch(() => ({})), em = String(b.emoji || '');
          if (!REACTS.includes(em) && em !== '') return json({ error: 'Reacción no válida' }, 400, H);
          const cur = await env.DB.prepare('SELECT emoji FROM msg_react WHERE msg_id=? AND user_id=?').bind(mid, a.uid).first();
          if (!em || (cur && cur.emoji === em)) await env.DB.prepare('DELETE FROM msg_react WHERE msg_id=? AND user_id=?').bind(mid, a.uid).run();
          else await env.DB.prepare('INSERT INTO msg_react(msg_id,user_id,emoji) VALUES(?,?,?) ON CONFLICT(msg_id,user_id) DO UPDATE SET emoji=excluded.emoji').bind(mid, a.uid, em).run();
          return json({ ok: 1 }, 200, H);
        }
      }
      const ch = /^\/api\/chat\/([^/]+)$/.exec(p);
      if (ch) {
        let nm = ''; try { nm = decodeURIComponent(ch[1]); } catch (e) { return json({ error: 'Nombre no válido' }, 400, H); }
        const t = await userByName(env, nm), ex = t ? await friendship(env, a.uid, t.id) : null;
        if (!t || !ex || ex.status !== 'ok') return json({ error: 'Solo puedes chatear con tus compañeros' }, 403, H);
        const PAIR = '((from_id=? AND to_id=?) OR (from_id=? AND to_id=?))';
        if (m === 'GET') {
          const after = +url.searchParams.get('after') || 0;
          const q = after
            ? "SELECT id,from_id,kind,CASE WHEN kind='img' THEN '' ELSE body END body,created FROM messages WHERE " + PAIR + ' AND id>? ORDER BY id LIMIT 100'
            : "SELECT * FROM (SELECT id,from_id,kind,CASE WHEN kind='img' THEN '' ELSE body END body,created FROM messages WHERE " + PAIR + ' AND id>? ORDER BY id DESC LIMIT 60) ORDER BY id';
          const rows = (await env.DB.prepare(q).bind(a.uid, t.id, t.id, a.uid, after).all()).results;
          await env.DB.prepare('UPDATE messages SET read=1 WHERE to_id=? AND from_id=? AND read=0').bind(a.uid, t.id).run();
          const dels = (await env.DB.prepare("SELECT id FROM messages WHERE " + PAIR + " AND kind='del' ORDER BY id DESC LIMIT 100").bind(a.uid, t.id, t.id, a.uid).all()).results.map((r) => r.id);
          const rr = (await env.DB.prepare('SELECT r.msg_id,r.user_id,r.emoji FROM msg_react r JOIN messages m ON m.id=r.msg_id WHERE ' + PAIR.replace(/from_id/g, 'm.from_id').replace(/to_id/g, 'm.to_id') + ' ORDER BY r.msg_id DESC LIMIT 300').bind(a.uid, t.id, t.id, a.uid).all()).results;
          const reacts = {}; rr.forEach((x) => { (reacts[x.msg_id] = reacts[x.msg_id] || []).push({ e: x.emoji, mine: x.user_id === a.uid }); });
          return json({ messages: rows.map((r) => ({ id: r.id, mine: r.from_id === a.uid, kind: r.kind, body: r.body, created: r.created })), dels, reacts }, 200, H);
        }
        if (m === 'POST') {
          const b = await req.json(), kind = String(b.kind || 'text'); let body = '';
          if (kind === 'text') { body = String(b.body || '').replace(/\u0000/g, '').trim().slice(0, MAX_TXT); if (!body) return json({ error: 'Mensaje vacío' }, 400, H); }
          else if (kind === 'img') {
            body = String(b.body || '');
            if (body.length > MAX_IMG || !/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(body)) return json({ error: 'Imagen no válida o demasiado grande' }, 400, H);
            if (await tooMany(env, 'img:' + a.uid, 30, 3600000)) return json({ error: 'Demasiadas imágenes. Espera un poco.' }, 429, H);
            await note(env, 'img:' + a.uid);
          } else if (kind === 'result') {
            let r = b.body; if (typeof r === 'string') { try { r = JSON.parse(r); } catch (e) { r = null; } }
            const qids = r && Array.isArray(r.qids) ? r.qids.map(Number).filter((n) => Number.isInteger(n) && n >= 0).slice(0, 200) : [];
            if (qids.length < 3) return json({ error: 'Resultado no válido' }, 400, H);
            const i = (x) => Math.max(0, Math.min(1000, x | 0));
            body = JSON.stringify({ qids, n: qids.length, a: i(r.a), e: i(r.e), b: i(r.b), nota: Math.max(0, Math.min(10, +r.nota || 0)), m: String(r.m || '').slice(0, 12), pen: [0, 3, 4].includes(r.pen | 0) ? r.pen | 0 : 3, title: String(r.title || '').replace(/[\u0000-\u001f<>]/g, '').slice(0, 80), t: Date.now() });
          } else return json({ error: 'Tipo de mensaje no válido' }, 400, H);
          if (await tooMany(env, 'msg:' + a.uid, 150, 3600000)) return json({ error: 'Demasiados mensajes. Espera un poco.' }, 429, H);
          await note(env, 'msg:' + a.uid);
          const ins = await env.DB.prepare('INSERT INTO messages(from_id,to_id,kind,body,created) VALUES(?,?,?,?,?)').bind(a.uid, t.id, kind, body, Date.now()).run();
          await env.DB.prepare('DELETE FROM messages WHERE ' + PAIR + ' AND id NOT IN (SELECT id FROM messages WHERE ' + PAIR + ' ORDER BY id DESC LIMIT ' + KEEP_MSGS + ')').bind(a.uid, t.id, t.id, a.uid, a.uid, t.id, t.id, a.uid).run();
          await env.DB.prepare('DELETE FROM messages WHERE created<?').bind(Date.now() - 60 * DAY).run();
          await env.DB.prepare('DELETE FROM msg_react WHERE msg_id NOT IN (SELECT id FROM messages)').run();
          return json({ ok: 1, id: ins.meta.last_row_id }, 200, H);
        }
      }
      const iv = /^\/api\/invites\/([A-Za-z0-9]{6})$/.exec(p);
      if (iv && m === 'DELETE') { await env.DB.prepare('DELETE FROM room_invites WHERE code=? AND to_id=?').bind(iv[1].toUpperCase(), a.uid).run(); return json({ ok: 1 }, 200, H); }
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
        await env.DB.prepare('DELETE FROM room_invites WHERE code NOT IN (SELECT code FROM rooms)').run();
        let code = '', ok = false;
        for (let i = 0; i < 5 && !ok; i++) { code = newCode(); try { await env.DB.prepare('INSERT INTO rooms(code,host_id,title,qids,secs,pen,created) VALUES(?,?,?,?,?,?,?)').bind(code, a.uid, title, JSON.stringify(qids), secs, pen, now).run(); ok = true; } catch (e) {} }
        if (!ok) return json({ error: 'No se pudo crear la sala' }, 500, H);
        await env.DB.prepare('INSERT INTO room_players(code,user_id,name,joined,last) VALUES(?,?,?,?,?)').bind(code, a.uid, a.name, now, now).run();
        await note(env, 'room:' + a.uid);
        return json({ code }, 200, H);
      }
      const rm = /^\/api\/rooms\/([A-Za-z0-9]{6})(?:\/(join|start|progress|leave|invite))?$/.exec(p);
      if (rm) {
        const code = rm[1].toUpperCase(), act = rm[2], room = await env.DB.prepare('SELECT * FROM rooms WHERE code=?').bind(code).first();
        if (!room || room.created < Date.now() - ROOM_TTL) return json({ error: 'Esa sala no existe o ha caducado' }, 404, H);
        if (!act && m === 'GET') { await touch(env, room, a); return json(await roomView(env, room, a), 200, H); }
        if (act === 'invite' && m === 'POST') {
          const mine = await env.DB.prepare('SELECT 1 x FROM room_players WHERE code=? AND user_id=?').bind(code, a.uid).first();
          if (!mine) return json({ error: 'No estás en esa sala' }, 403, H);
          if (room.started) return json({ error: 'La sala ya ha empezado' }, 409, H);
          const b = await req.json(), t = await userByName(env, b.user), ex = t ? await friendship(env, a.uid, t.id) : null;
          if (!t || !ex || ex.status !== 'ok') return json({ error: 'Solo puedes invitar a tus compañeros' }, 403, H);
          if (await tooMany(env, 'inv:' + a.uid, 40, 3600000)) return json({ error: 'Demasiadas invitaciones. Espera un poco.' }, 429, H);
          await env.DB.prepare('INSERT OR REPLACE INTO room_invites(code,to_id,from_id,created) VALUES(?,?,?,?)').bind(code, t.id, a.uid, Date.now()).run();
          await note(env, 'inv:' + a.uid);
          return json({ ok: 1 }, 200, H);
        }
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
        if (act === 'leave' && m === 'POST') {
          if (room.started) await env.DB.prepare('UPDATE room_players SET ok=? WHERE code=? AND user_id=? AND done=0 AND ok=0').bind(Date.now(), code, a.uid).run();
          return json({ ok: 1 }, 200, H);
        }
        if (act === 'progress' && (m === 'PUT' || m === 'POST')) {
          const me = await env.DB.prepare('SELECT 1 x FROM room_players WHERE code=? AND user_id=?').bind(code, a.uid).first();
          if (!me) return json({ error: 'No estás en esta sala' }, 403, H);
          if (!room.started) return json({ error: 'La sala aún no ha empezado' }, 409, H);
          if ((await roomView(env, room, a)).ended) return json(await roomView(env, room, a), 200, H);
          await touch(env, room, a);
          const txt = await req.text(); if (txt.length > 20000) return json({ error: 'Demasiados datos' }, 413, H);
          const b = JSON.parse(txt), cur = await env.DB.prepare('SELECT answers FROM room_players WHERE code=? AND user_id=?').bind(code, a.uid).first(); let ans = {}; try { ans = JSON.parse(cur.answers); } catch (e) {}
          const allowed = new Set(JSON.parse(room.qids).map(String)); let n = Object.keys(ans).length;
          for (const [k, v] of Object.entries(b.answers || {})) { if (!(k in ans) && allowed.has(k) && Number.isInteger(v) && v >= -1 && v <= 3 && n++ < 200) ans[k] = v; } // una respuesta dada no se puede cambiar
          await env.DB.prepare('UPDATE room_players SET answers=?,err=?,done=?,last=? WHERE code=? AND user_id=?')
            .bind(JSON.stringify(ans), 0, Object.keys(ans).length >= allowed.size ? 1 : 0, Date.now(), code, a.uid).run();
          return json(await roomView(env, room, a), 200, H);
        }
      }
      return json({ error: 'No encontrado' }, 404, H);
    } catch (e) { return json({ error: 'Error del servidor' }, 500, H); }
  },
};
