/* Lector de temario: modo concentración, barra de progreso y NOTAS PROPIAS (sincronizadas con el resto del progreso). */
(function(){
var doc=document.querySelector('.doc');if(!doc)return;var key=doc.dataset.key;if(!key)return;
var LS={g:function(k){try{return localStorage.getItem(k)}catch(e){return null}},s:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
var uk=function(n){return window.AUTH&&AUTH.key?AUTH.key(n):n};
var ROOT=(document.currentScript&&document.currentScript.src||'').replace(/reader\.js.*$/,'');
var NK=uk('notes_'+key),notes={};
function load(){try{notes=JSON.parse(LS.g(NK)||'{}')||{}}catch(e){notes={}}}load();
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!==undefined)e.textContent=x;return e}
function hash(s){var h=5381;for(var i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return(h>>>0).toString(36)}
function count(){var n=0;Object.keys(notes).forEach(function(k){if(notes[k]&&notes[k].t)n++});return n}
/* ---- sincronización diferida tras guardar ---- */
var st;function later(){clearTimeout(st);st=setTimeout(function(){try{if(window.SYNC&&SYNC.connected&&SYNC.connected())SYNC.syncNow().catch(function(){})}catch(e){}},2500)}
function persist(){LS.s(NK,JSON.stringify(notes));upd();later()}
/* ---- objetivos de nota: recuadros EXAMEN/IMPORTANTE y encabezados ---- */
var seen={},targets=[];
Array.prototype.forEach.call(doc.children,function(n){
 var tag=n.tagName,isBox=n.classList.contains('box');if(!isBox&&tag!=='H2'&&tag!=='H3')return;
 var base=hash((isBox?'b':'h')+n.textContent.replace(/\s+/g,' ').trim().toLowerCase().slice(0,140)),id=base,i=1;while(seen[id])id=base+'_'+(++i);seen[id]=1;
 n.dataset.nid=id;targets.push(n)});
function label(n){var t=n.classList.contains('box')?((n.querySelector('p b')||n.querySelector('.t')||n).textContent):n.textContent.replace(/\s*✎\s*$/,'');return t.replace(/\s+/g,' ').trim().slice(0,90)}
var cards={};
function removeCard(id){if(cards[id]){cards[id].remove();delete cards[id]}}
function place(n,card){var prev=n,nx=n.nextElementSibling;card.className+=n.classList.contains('box')?'':' nh';n.after(card)}
function view(n,id){var d=notes[id];removeCard(id);if(!d||!d.t)return;
 var c=el('div','mynote');c.dataset.for=id;var h=el('div','mnh');h.appendChild(el('b','','✎ Mi nota'));
 var ed=el('button','mnb','Editar'),del=el('button','mnb','Borrar');h.appendChild(ed);h.appendChild(del);
 c.appendChild(h);c.appendChild(el('div','mnt',d.t));place(n,c);cards[id]=c;
 ed.onclick=function(){edit(n,id)};
 del.onclick=function(){if(!confirm('¿Borrar esta nota?'))return;notes[id]={t:'',u:Date.now()};persist();view(n,id)}}
function edit(n,id){var d=notes[id];removeCard(id);
 var c=el('div','mynote editing');c.dataset.for=id;c.appendChild(el('div','mnh')).appendChild(el('b','','✎ Mi nota'));
 var ta=el('textarea');ta.rows=4;ta.placeholder='Escribe aquí lo que quieras recordar de este apartado…';ta.value=d&&d.t||'';
 var row=el('div','mnr'),ok=el('button','mnb pri','Guardar'),no=el('button','mnb','Cancelar');row.appendChild(ok);row.appendChild(no);
 c.appendChild(ta);c.appendChild(row);place(n,c);cards[id]=c;ta.focus();
 function grow(){ta.style.height='auto';ta.style.height=Math.min(ta.scrollHeight+2,420)+'px'}ta.oninput=grow;grow();
 ok.onclick=function(){var v=ta.value.trim();if(v||(d&&d.t)){notes[id]={t:v,u:Date.now(),h:label(n)};persist()}view(n,id)};
 no.onclick=function(){view(n,id)};
 ta.onkeydown=function(e){if((e.ctrlKey||e.metaKey)&&e.key==='Enter')ok.click();if(e.key==='Escape')no.click()}}
targets.forEach(function(n){var id=n.dataset.nid;
 var b=el('button','nb',n.classList.contains('box')?'✎ Nota':'✎');b.type='button';b.title='Añadir o editar tu nota en este apartado';b.setAttribute('aria-label','Nota en este apartado');
 b.onclick=function(e){e.preventDefault();var d=notes[id];if(cards[id]&&cards[id].classList.contains('editing')){cards[id].querySelector('textarea').focus();return}edit(n,id)};
 if(n.classList.contains('box'))n.insertBefore(b,n.firstChild);else n.appendChild(b);
 if(notes[id]&&notes[id].t)view(n,id)});
/* ---- barra: concentración + notas ---- */
var bar=doc.querySelector('.bar'),fchip=el('button','chip');
fchip.type='button';fchip.textContent='🎯 Concentración';
function upd(){}
if(bar)bar.appendChild(fchip);
var fx=el('button','fexit','✕ Salir de concentración');fx.type='button';document.body.appendChild(fx);
function focus(on){document.body.classList.toggle('focus',on);LS.s('focus',on?'1':'0');if(on)window.scrollBy(0,0)}
fchip.onclick=function(){focus(true)};fx.onclick=function(){focus(false)};
if(LS.g('focus')==='1')focus(true);
document.addEventListener('keydown',function(e){var t=e.target&&e.target.tagName;if(t==='TEXTAREA'||t==='INPUT'||e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==='f'||e.key==='F')focus(!document.body.classList.contains('focus'))});
/* ---- tiempo de lectura ---- */
var crumb=doc.querySelector('.crumb');if(crumb){var w=0;Array.prototype.forEach.call(doc.children,function(n){if(!n.classList.contains('mynote'))w+=(n.textContent.match(/\S+/g)||[]).length});crumb.textContent+=' · ≈ '+Math.max(1,Math.round(w/230))+' min de lectura'}
/* ---- progreso de lectura y cabecera que se oculta al bajar ---- */
var pg=el('div','rprog');document.body.appendChild(pg);var lastY=0,tick=false;
function onscroll(){var y=window.scrollY||0,h=document.documentElement.scrollHeight-innerHeight;pg.style.width=(h>0?Math.min(100,100*y/h):0)+'%';
 document.body.classList.toggle('hdr-off',y>140&&y>lastY+4);if(y<lastY-4||y<140)document.body.classList.remove('hdr-off');lastY=y;tick=false}
window.addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(onscroll)}},{passive:true});onscroll();
/* ---- enlace directo a una nota (#n-ID) ---- */
function jump(){var m=/^#n-(.+)$/.exec(location.hash);if(!m)return;var t=doc.querySelector('[data-nid="'+m[1].replace(/"/g,'')+'"]');if(!t)return;
 t.scrollIntoView({block:'center'});t.classList.add('flash');setTimeout(function(){t.classList.remove('flash')},2200)}
setTimeout(jump,250);
})();
