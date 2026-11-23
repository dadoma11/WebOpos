(function(){
var A=window.AUTH,ROOT=(document.currentScript&&document.currentScript.src.replace(/bubble\.js.*$/,''))||'';
if(!A||!A.canSocial||!A.canSocial()||document.getElementById('bbl'))return;
var b=document.createElement('button');b.id='bbl';b.className='bbl';b.type='button';b.title='Chat con compañeros';b.setAttribute('aria-label','Abrir chat con compañeros');
b.innerHTML='<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h7M8.5 14h4.5"/></svg><i class="nb" hidden></i>';
var p=document.createElement('div');p.className='bblp';p.hidden=true;
p.innerHTML='<div class="bblh"><b>💬 Compañeros</b><a href="'+ROOT+'companeros.html" title="Abrir a pantalla completa">⤢</a><button type="button" title="Cerrar">✕</button></div>';
var fr=null;
function open(){if(!fr){fr=document.createElement('iframe');fr.src=ROOT+'companeros.html?embed=1';fr.title='Chat';p.appendChild(fr)}p.hidden=false;b.classList.add('on');try{sessionStorage.setItem('bbl','1')}catch(e){}}
function close(){p.hidden=true;b.classList.remove('on');try{sessionStorage.removeItem('bbl')}catch(e){}}
b.onclick=function(){p.hidden?open():close()};
p.querySelector('button').onclick=close;
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!p.hidden)close()});
document.body.appendChild(p);document.body.appendChild(b);
try{if(sessionStorage.getItem('bbl')==='1')open()}catch(e){}
})();
