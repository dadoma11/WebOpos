/* Sincronización entre dispositivos mediante un Gist SECRETO de tu cuenta de GitHub (token con permiso solo "gist").
   Se sincronizan: temas estudiados, curva del olvido, historial/falladas/vistas de Examínate y contadores de prácticas.
   NO se sincroniza nada de SQL (ejercicios, variantes, progreso, laboratorio). */
(function(){
var LS={g:function(k){try{return localStorage.getItem(k)}catch(e){return null}},s:function(k,v){try{localStorage.setItem(k,v)}catch(e){}},d:function(k){try{localStorage.removeItem(k)}catch(e){}}};
var API='https://api.github.com',DESC='WebOpos sync',DAY=864e5;
function user(){return window.AUTH&&AUTH.user()}
function tok(){return LS.g('tai_token')}
function jget(k,d){try{return JSON.parse(LS.g(k)||'')}catch(e){return d}}
/* claves sincronizables (nunca sql*, lab_*, tai_*) */
function keys(){var u=user(),out=[];try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);
 if(k==='done'||/^pq_/.test(k)||(u&&(k.indexOf(u+':ex_')===0||k.indexOf(u+':notes_')===0)))out.push(k)}}catch(e){}return out}
function snapshot(){var o={};keys().forEach(function(k){o[k.replace(user()+':','@:')]=jget(k,null)});return o}
function restore(o){Object.keys(o).forEach(function(k){LS.s(k.indexOf('@:')===0?user()+':'+k.slice(2):k,JSON.stringify(o[k]))})}
/* ---- fusión a 3 bandas: base (última sincronización), local, remoto ---- */
function eq(a,b){return JSON.stringify(a)===JSON.stringify(b)}
function mergeMap(b,l,r){b=b||{};l=l||{};r=r||{};var o={},ks={};[b,l,r].forEach(function(m){Object.keys(m).forEach(function(k){ks[k]=1})});
 Object.keys(ks).forEach(function(k){var lc=!eq(l[k],b[k]),v=lc?l[k]:r[k];if(v!==undefined)o[k]=v});return o}
function mergeKey(k,b,l,r){
 if(l===null||l===undefined)return r;if(r===null||r===undefined)return l;
 if(/^@:notes_/.test(k)){var no={},na={};Object.keys(l).concat(Object.keys(r)).forEach(function(i){na[i]=1});Object.keys(na).forEach(function(i){var x=l[i],y=r[i];no[i]=!x?y:!y?x:((x.u||0)>=(y.u||0)?x:y)});return no}
 if(/ex_srs$/.test(k)){var o={},all={};Object.keys(l).concat(Object.keys(r)).forEach(function(i){all[i]=1});Object.keys(all).forEach(function(i){var x=l[i],y=r[i];o[i]=!x?y:!y?x:(x[2]>=y[2]?x:y)});return o}
 if(/ex_hist$/.test(k)){var m={};(l||[]).concat(r||[]).forEach(function(h){m[h.t]=h});return Object.keys(m).map(Number).sort(function(a,b){return a-b}).map(function(t){return m[t]}).slice(-50)}
 if(/^pq_/.test(k))return (l.n||0)>=(r.n||0)?l:r;
 if(/ex_days$/.test(k)){var dd={};Object.keys(l).concat(Object.keys(r)).forEach(function(i){dd[i]=Math.max(l[i]||0,r[i]||0)});return dd}
 if(k==='done'||/ex_(seen|fail|flag)$/.test(k))return mergeMap(b,l,r);
 return eq(l,(b||{}))?r:l}                                     // ex_cfg y resto: gana el cambio local si lo hay
function mergeAll(base,loc,rem){var o={},ks={};[loc,rem].forEach(function(m){Object.keys(m||{}).forEach(function(k){ks[k]=1})});
 Object.keys(ks).forEach(function(k){var v=mergeKey(k,(base||{})[k],(loc||{})[k],(rem||{})[k]);if(v!==undefined)o[k]=v});return o}
/* ---- API de GitHub ---- */
function gh(path,opt){opt=opt||{};opt.headers=Object.assign({Authorization:'Bearer '+tok(),Accept:'application/vnd.github+json'},opt.headers||{});
 return fetch(API+path,opt).then(function(r){if(r.status===401)throw new Error('Token no válido o caducado');if(r.status===403)throw new Error('GitHub rechazó la petición (permisos o límite de uso)');if(!r.ok)throw new Error('GitHub respondió '+r.status);return r.json()})}
function findGist(){var id=LS.g('tai_gist');if(id)return Promise.resolve(id);
 return gh('/gists?per_page=100').then(function(l){var g=l.filter(function(x){return x.description===DESC})[0];if(g){LS.s('tai_gist',g.id);return g.id}
  return gh('/gists',{method:'POST',body:JSON.stringify({description:DESC,public:false,files:{'README.txt':{content:'Datos de sincronización de WebOpos. No editar a mano.'}}})}).then(function(g){LS.s('tai_gist',g.id);return g.id})})}
function fname(){return 'u_'+user()+'.json'}
function pull(id){return gh('/gists/'+id).then(function(g){var f=g.files&&g.files[fname()];if(!f)return null;if(f.truncated)throw new Error('Archivo demasiado grande');try{return JSON.parse(f.content)}catch(e){return null}})}
function push(id,data){var f={};f[fname()]={content:JSON.stringify({v:1,t:Date.now(),data:data})};return gh('/gists/'+id,{method:'PATCH',body:JSON.stringify({files:f})})}
function R(){return window.AUTH&&AUTH.remote}
var busy=false;
function syncRemote(){var u=user(),revk='tai_rev_'+u;
 function attempt(n){return AUTH.api('/api/data').then(function(rem){var loc=snapshot(),base=jget('tai_syncbase_'+u,null),merged=rem.data?mergeAll(base,loc,rem.data):loc,changedLocal=!eq(merged,loc),needPush=!rem.data||!eq(merged,rem.data);
  if(changedLocal)restore(merged);
  if(!needPush){LS.s('tai_syncbase_'+u,JSON.stringify(merged));return {changed:changedLocal,pushed:false}}
  return AUTH.api('/api/data',{method:'PUT',body:JSON.stringify({rev:rem.rev,data:merged})}).then(function(){LS.s('tai_syncbase_'+u,JSON.stringify(merged));return {changed:changedLocal,pushed:true}},function(e){if(e.status===409&&n<2)return attempt(n+1);throw e})})}
 return attempt(0)}
function syncNow(){if(!user()||(!R()&&!tok()))return Promise.reject(new Error('Sin conectar'));if(busy)return Promise.resolve({busy:true});busy=true;
 var fin=function(r){LS.s('tai_synctime',String(Date.now()));busy=false;return r},fail=function(e){busy=false;throw e};
 if(R())return syncRemote().then(fin,fail);
 return findGist().then(function(id){return pull(id).then(function(rem){
  var loc=snapshot(),base=jget('tai_syncbase_'+user(),null),merged=rem&&rem.data?mergeAll(base,loc,rem.data):loc,changedLocal=!eq(merged,loc),needPush=!rem||!eq(merged,rem.data);
  if(changedLocal)restore(merged);
  var p=needPush?push(id,merged):Promise.resolve();
  return p.then(function(){LS.s('tai_syncbase_'+user(),JSON.stringify(merged));return {changed:changedLocal,pushed:needPush}})})}).then(fin,fail)}
var SYNC=window.SYNC={remote:function(){return !!R()},connected:function(){return !!(R()?user():tok())},syncNow:syncNow,
 connect:function(t){LS.s('tai_token',t.trim());LS.d('tai_gist');return gh('/user').then(function(u){LS.s('tai_ghuser',u.login);return syncNow()}).catch(function(e){LS.d('tai_token');throw e})},
 disconnect:function(){LS.d('tai_token');LS.d('tai_gist');LS.d('tai_ghuser')},
 exportJson:function(){return JSON.stringify({v:1,user:user(),t:Date.now(),data:snapshot()})},
 importJson:function(txt){var o=JSON.parse(txt);if(!o||!o.data)throw new Error('Archivo no válido');restore(mergeAll(jget('tai_syncbase_'+user(),null),snapshot(),o.data))},
 _merge:mergeAll};
/* ---- automático: al cargar cada página y cada minuto si hay cambios ---- */
if(!user()||(!R()&&!tok()))return;
var last='';function sig(){return JSON.stringify(snapshot())}
function banner(){if(document.getElementById('syncban'))return;var d=document.createElement('div');d.id='syncban';d.className='syncban';d.innerHTML='☁ Datos actualizados desde otro dispositivo. <button>Recargar</button>';d.querySelector('button').onclick=function(){location.reload()};document.body.appendChild(d)}
function auto(){if(window.__inExam)return;syncNow().then(function(r){last=sig();if(r&&r.changed)banner()}).catch(function(e){if(R()&&e&&e.status===401){LS.d('tai_sess');location.replace((document.currentScript&&0)||new URL('login.html',document.querySelector('script[src*="auth.js"]').src).href)}})}
function boot(){last=sig();setTimeout(auto,300);setInterval(function(){if(!window.__inExam&&sig()!==last)auto()},45000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'&&sig()!==last)auto()});
})();
