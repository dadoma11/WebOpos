/* Login. Sin configurar: cuentas locales en este dispositivo. Con Supabase configurado (bloque CFG): cuentas reales del mismo servidor para todos y sincronización automática. */
(function(){
var LS={g:function(k){try{return localStorage.getItem(k)}catch(e){return null}},s:function(k,v){try{localStorage.setItem(k,v)}catch(e){}},d:function(k){try{localStorage.removeItem(k)}catch(e){}}};
var ROOT=(document.currentScript&&document.currentScript.src||'').replace(/auth\.js.*$/,'');
/*CFG*/var CFG={apiUrl:"https://webopos-api.ddominguezm02.workers.dev"};/*ENDCFG*/
var REMOTE=!!CFG.apiUrl,DAYS=30,ITER=150000;
function users(){try{return JSON.parse(LS.g('tai_users')||'{}')}catch(e){return{}}}
function b2h(b){return Array.prototype.map.call(new Uint8Array(b),function(x){return x.toString(16).padStart(2,'0')}).join('')}
function h2b(h){var a=new Uint8Array(h.length/2);for(var i=0;i<a.length;i++)a[i]=parseInt(h.substr(i*2,2),16);return a}
function derive(pw,salt,it){return crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveBits']).then(function(k){return crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:salt,iterations:it},k,256)}).then(b2h)}
function session(){try{var s=JSON.parse(LS.g('tai_sess')||'null');if(s&&s.exp>Date.now()&&(REMOTE?s.remote:(!s.remote&&users()[s.user])))return s}catch(e){}return null}
/* ---- cuentas reales en servidor (Cloudflare Worker) ---- */
function api(path,opt,tk){opt=opt||{};opt.headers=Object.assign({'Content-Type':'application/json'},opt.headers||{});if(tk)opt.headers.Authorization='Bearer '+tk;
 return fetch(CFG.apiUrl.replace(/\/$/,'')+path,opt).then(function(r){return r.text().then(function(t){var j={};try{j=JSON.parse(t)}catch(e){}if(!r.ok){var e=new Error(j.error||('Error '+r.status));e.status=r.status;e.body=j;throw e}return j})},function(){throw new Error('No se pudo conectar con el servidor')})}
function devId(){var d=LS.g('tai_dev');if(!d||!/^[a-f0-9]{16,64}$/.test(d)){d=b2h(crypto.getRandomValues(new Uint8Array(16)));LS.s('tai_dev',d)}return d}
function startRemote(j){var s={remote:1,user:String(j.user).toLowerCase(),name:j.user,token:j.token,t:Date.now(),exp:Date.now()+DAYS*864e5};LS.s('tai_sess',JSON.stringify(s));return s}
function accessToken(){var s=session();return s&&s.remote&&!s.offline?Promise.resolve(s.token):Promise.reject(new Error(s&&s.offline?'Modo sin conexión: inicia sesión para sincronizar':'Sin sesión'))}
function startOffline(){var s={remote:1,offline:1,user:'sin-conexion',name:'Sin conexión',token:'',t:Date.now(),exp:Date.now()+7*864e5};LS.s('tai_sess',JSON.stringify(s));return s}
function wipeLab(){try{Object.keys(sessionStorage).forEach(function(k){if(/^lab_/.test(k))sessionStorage.removeItem(k)})}catch(e){}
 try{Object.keys(localStorage).forEach(function(k){if(/^lab_/.test(k))localStorage.removeItem(k)})}catch(e){}
 try{window.dispatchEvent(new Event('tai-logout'))}catch(e){}}
var AUTH=window.AUTH={
 user:function(){var s=session();return s&&s.user},
 remote:REMOTE,cfg:CFG,offline:startOffline,canSocial:function(){var x=session();return !!(x&&x.remote&&!x.offline&&x.token)},accessToken:accessToken,api:function(p,o){return accessToken().then(function(t){return api(p,o,t)})},
 register:function(u,pw,inv){if(REMOTE)return api('/api/register',{method:'POST',body:JSON.stringify({user:u,password:pw,invite:inv||'',dev:devId()})}).then(startRemote);
  u=(u||'').trim();if(!/^[\w.\-áéíóúñÁÉÍÓÚÑ ]{3,24}$/.test(u))return Promise.reject(new Error('Usuario de 3 a 24 caracteres (letras, números, . _ -)'));
  if((pw||'').length<6)return Promise.reject(new Error('La contraseña necesita al menos 6 caracteres'));
  var k=u.toLowerCase(),us=users();if(us[k])return Promise.reject(new Error('Ese usuario ya existe en este dispositivo'));
  var salt=crypto.getRandomValues(new Uint8Array(16));return derive(pw,salt,ITER).then(function(h){us[k]={name:u,salt:b2h(salt),hash:h,it:ITER,created:Date.now()};LS.s('tai_users',JSON.stringify(us));return startSession(k)})},
 login:function(u,pw){if(REMOTE)return api('/api/login',{method:'POST',body:JSON.stringify({user:u,password:pw,dev:devId()})}).then(startRemote);
  var k=(u||'').trim().toLowerCase(),us=users(),r=us[k];var fail=new Error('Usuario o contraseña incorrectos');
  var att=JSON.parse(LS.g('tai_att')||'{"n":0,"t":0}');if(att.n>=5&&Date.now()-att.t<60000)return Promise.reject(new Error('Demasiados intentos. Espera un minuto.'));
  if(!r){att.n++;att.t=Date.now();LS.s('tai_att',JSON.stringify(att));return Promise.reject(fail)}
  return derive(pw,h2b(r.salt),r.it).then(function(h){if(h!==r.hash){att.n++;att.t=Date.now();LS.s('tai_att',JSON.stringify(att));throw fail}LS.d('tai_att');return startSession(k)})},
 logout:function(){wipeLab();var s=session();if(s&&s.remote&&!s.offline)try{fetch(CFG.apiUrl.replace(/\/$/,'')+'/api/logout',{method:'POST',headers:{Authorization:'Bearer '+s.token},keepalive:true})}catch(e){}LS.d('tai_sess');location.href=ROOT+'login.html'},
 key:function(n){return (AUTH.user()||'anon')+':'+n}
};
var isLogin=/login\.html$/.test(location.pathname);
var s=session();
var EMB=/[?&]embed=1/.test(location.search)&&window!==window.top;if(EMB){document.documentElement.classList.add('embed');var bs=document.createElement('base');bs.target='_top';document.head.appendChild(bs)}
if(!isLogin&&!s){location.replace(ROOT+'login.html?next='+encodeURIComponent(location.pathname.split('/').pop()+location.search+location.hash));document.documentElement.style.visibility='hidden';return}
if(isLogin&&s){var nx=new URLSearchParams(location.search).get('next');if(!nx||/^(https?:)?\/\//.test(nx)||nx.indexOf('..')>=0)nx='index.html';location.replace(ROOT+nx);return}
if(!isLogin&&!/sync\.html$/.test(location.pathname)&&(REMOTE||LS.g('tai_token'))){var sc=document.createElement('script');sc.src=ROOT+'sync.js';document.head.appendChild(sc)}
document.addEventListener('DOMContentLoaded',function(){var nav=document.querySelector('.top nav');if(!nav||isLogin)return;
 var has=function(h){return nav.querySelector('a[href$="'+h+'"]')};
 var th=nav.querySelector('#thm');
 [['examinate.html','📝 Examínate'],['laboratorio.html','🧪 Lab SQL'],['sync.html','☁ Sync']].forEach(function(p){if(has(p[0]))return;var a=document.createElement('a');a.href=ROOT+p[0];a.textContent=p[1];nav.insertBefore(a,th)});
 if(REMOTE&&!s.offline&&!has('companeros.html')){var fa=document.createElement('a');fa.href=ROOT+'companeros.html';fa.setAttribute('data-i','friends');fa.textContent='Compañeros';var sy=has('sync.html');nav.insertBefore(fa,sy||th)}
 var fl=has('companeros.html');if(fl&&!fl.querySelector('.nb')){var nb=document.createElement('i');nb.className='nb';nb.hidden=true;fl.appendChild(nb)}
 function setBadge(n){document.querySelectorAll('.nb').forEach(function(e){e.textContent=n>9?'9+':n;e.hidden=!n})}
 if(REMOTE&&!s.offline&&!EMB&&!/(companeros|sala)\.html$/.test(location.pathname)){var bj=document.createElement('script');bj.src=ROOT+'bubble.js';document.body.appendChild(bj)}
 function updateNavigation(){
  var pathname=location.pathname, page=pathname.split('/').pop()||'index.html';
  var topic=!!document.querySelector('.doc');
  var inSyllabus=/^#bloque(?:s|-[1-4])$/.test(location.hash);
  nav.querySelectorAll('a').forEach(function(link){
   var target=new URL(link.href);
   var homeLink=page==='index.html'&&target.pathname.endsWith('/index.html');
   var active=topic?target.hash==='#bloques':homeLink?Boolean(target.hash)===inSyllabus:target.pathname===pathname;
   link.classList.toggle('cur',active);
   if(active)link.setAttribute('aria-current',target.hash?'location':'page');
   else link.removeAttribute('aria-current');
  });
 }
 updateNavigation();
 window.addEventListener('hashchange',updateNavigation);
 var b=document.createElement('button');b.className='lgo';b.title='Cerrar sesión (borra el laboratorio)';b.innerHTML='Salir<span class="un"> · </span><span class="un"></span>';b.lastChild.textContent=(REMOTE?s.name:users()[s.user].name);b.onclick=function(){AUTH.logout()};nav.appendChild(b)
 if(REMOTE&&!s.offline&&!EMB){var lastBeat=0;
  function plabel(){if(window.__plabel)return String(window.__plabel);var p=location.pathname;
   if(/\/t\/[^\/]+\.html$/.test(p)){var h=document.querySelector('main h1,.doc h1,h1'),tt=document.title.replace(/\s*·\s*Oposiciones TAI\s*$/,''),ht=h?h.textContent.trim():'';return 'Repasando '+tt+(ht?': '+ht:'')}
   if(/examinate/.test(p))return 'En Examínate';if(/laboratorio/.test(p))return 'En el Lab SQL';if(/practicas/.test(p))return 'En Prácticas';if(/sala\.html/.test(p))return 'En un test conjunto';return ''}
  function beat(){if(document.hidden)return;lastBeat=Date.now();api('/api/presence',{method:'POST',body:JSON.stringify({label:plabel()})},s.token).then(function(r){setBadge(r.badge|0)}).catch(function(e){})}
  AUTH.beat=function(){if(Date.now()-lastBeat>15000)beat()};beat();setInterval(beat,60000);
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&Date.now()-lastBeat>20000)beat()})}
});
})();
