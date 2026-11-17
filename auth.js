/* Login en el navegador: cuentas y sesión guardadas en ESTE dispositivo (GitHub Pages no tiene servidor). */
(function(){
var LS={g:function(k){try{return localStorage.getItem(k)}catch(e){return null}},s:function(k,v){try{localStorage.setItem(k,v)}catch(e){}},d:function(k){try{localStorage.removeItem(k)}catch(e){}}};
var ROOT=(document.currentScript&&document.currentScript.src||'').replace(/auth\.js.*$/,'');
var DAYS=30,ITER=150000;
function users(){try{return JSON.parse(LS.g('tai_users')||'{}')}catch(e){return{}}}
function b2h(b){return Array.prototype.map.call(new Uint8Array(b),function(x){return x.toString(16).padStart(2,'0')}).join('')}
function h2b(h){var a=new Uint8Array(h.length/2);for(var i=0;i<a.length;i++)a[i]=parseInt(h.substr(i*2,2),16);return a}
function derive(pw,salt,it){return crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveBits']).then(function(k){return crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:salt,iterations:it},k,256)}).then(b2h)}
function session(){try{var s=JSON.parse(LS.g('tai_sess')||'null');if(s&&s.exp>Date.now()&&users()[s.user])return s}catch(e){}return null}
function startSession(u){var s={user:u,tok:b2h(crypto.getRandomValues(new Uint8Array(16))),t:Date.now(),exp:Date.now()+DAYS*864e5};LS.s('tai_sess',JSON.stringify(s));return s}
function wipeLab(){try{Object.keys(sessionStorage).forEach(function(k){if(/^lab_/.test(k))sessionStorage.removeItem(k)})}catch(e){}
 try{Object.keys(localStorage).forEach(function(k){if(/^lab_/.test(k))localStorage.removeItem(k)})}catch(e){}
 try{window.dispatchEvent(new Event('tai-logout'))}catch(e){}}
var AUTH=window.AUTH={
 user:function(){var s=session();return s&&s.user},
 register:function(u,pw){u=(u||'').trim();if(!/^[\w.\-áéíóúñÁÉÍÓÚÑ ]{3,24}$/.test(u))return Promise.reject(new Error('Usuario de 3 a 24 caracteres (letras, números, . _ -)'));
  if((pw||'').length<6)return Promise.reject(new Error('La contraseña necesita al menos 6 caracteres'));
  var k=u.toLowerCase(),us=users();if(us[k])return Promise.reject(new Error('Ese usuario ya existe en este dispositivo'));
  var salt=crypto.getRandomValues(new Uint8Array(16));return derive(pw,salt,ITER).then(function(h){us[k]={name:u,salt:b2h(salt),hash:h,it:ITER,created:Date.now()};LS.s('tai_users',JSON.stringify(us));return startSession(k)})},
 login:function(u,pw){var k=(u||'').trim().toLowerCase(),us=users(),r=us[k];var fail=new Error('Usuario o contraseña incorrectos');
  var att=JSON.parse(LS.g('tai_att')||'{"n":0,"t":0}');if(att.n>=5&&Date.now()-att.t<60000)return Promise.reject(new Error('Demasiados intentos. Espera un minuto.'));
  if(!r){att.n++;att.t=Date.now();LS.s('tai_att',JSON.stringify(att));return Promise.reject(fail)}
  return derive(pw,h2b(r.salt),r.it).then(function(h){if(h!==r.hash){att.n++;att.t=Date.now();LS.s('tai_att',JSON.stringify(att));throw fail}LS.d('tai_att');return startSession(k)})},
 logout:function(){wipeLab();LS.d('tai_sess');location.href=ROOT+'login.html'},
 key:function(n){return (AUTH.user()||'anon')+':'+n}
};
var isLogin=/login\.html$/.test(location.pathname);
var s=session();
if(!isLogin&&!s){location.replace(ROOT+'login.html?next='+encodeURIComponent(location.pathname.split('/').pop()+location.search+location.hash));document.documentElement.style.visibility='hidden';return}
if(isLogin&&s){var nx=new URLSearchParams(location.search).get('next');if(!nx||/^(https?:)?\/\//.test(nx)||nx.indexOf('..')>=0)nx='index.html';location.replace(ROOT+nx);return}
if(!isLogin&&!/sync\.html$/.test(location.pathname)&&LS.g('tai_token')){var sc=document.createElement('script');sc.src=ROOT+'sync.js';document.head.appendChild(sc)}
document.addEventListener('DOMContentLoaded',function(){var nav=document.querySelector('.top nav');if(!nav||isLogin)return;
 var has=function(h){return nav.querySelector('a[href$="'+h+'"]')};
 var th=nav.querySelector('#thm');
 [['examinate.html','📝 Examínate'],['laboratorio.html','🧪 Lab SQL'],['sync.html','☁ Sync']].forEach(function(p){if(has(p[0]))return;var a=document.createElement('a');a.href=ROOT+p[0];a.textContent=p[1];nav.insertBefore(a,th)});
 var cur=location.pathname.split('/').pop();Array.prototype.forEach.call(nav.querySelectorAll('a'),function(a){if(a.getAttribute('href').split('/').pop()===cur)a.className='cur'});
 var b=document.createElement('button');b.className='lgo';b.title='Cerrar sesión (borra el laboratorio)';b.textContent='Salir · '+(users()[s.user].name);b.onclick=function(){AUTH.logout()};nav.appendChild(b)});
})();
