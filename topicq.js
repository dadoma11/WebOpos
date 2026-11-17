(function(){
var doc=document.querySelector('.doc');if(!doc)return;var key=doc.dataset.key;
var LS={g:function(k){try{return localStorage.getItem(k)}catch(e){return null}},s:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
var uk=function(n){return (window.AUTH&&AUTH.key?AUTH.key(n):n)};
var ROOT=(document.currentScript&&document.currentScript.src||'').replace(/topicq\.js.*$/,'');
var L='ABCD';
function esc(s){return String(s).replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
function shufQ(q){if(q._s)return q._s;var ord=q.o.map(function(_,i){return i});if(!/anteriores|ninguna de|ambas|todas las|ninguna es|ambos/i.test(q.o.join(' ')))for(var i=ord.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=ord[i];ord[i]=ord[j];ord[j]=t}var r={id:q.id,q:q.q,o:ord.map(function(i){return q.o[i]}),c:ord.indexOf(q.c),e:q.e,p:q.p,x:q.x,i:q.i,g:q.g};q._s=r;return r}
function norm(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
function toks(s){return norm(s.replace(/<[^>]+>/g,' ')).split(/[^a-z0-9]+/).filter(function(w){return w.length>=4})}
fetch(ROOT+'data/preguntas.json').then(function(r){return r.json()}).then(function(all){
 var qs=[];all.forEach(function(q,i){if(q.k===key){q.id=i;qs.push(q)}});if(!qs.length)return;
 /* 1. trocear el tema por encabezados h2/h3 */
 var kids=Array.prototype.slice.call(doc.children),chunks=[],c=null;
 kids.forEach(function(n){if(/^H[23]$/.test(n.tagName)){c={h:n,nodes:[n],end:n};chunks.push(c)}else if(c&&!n.classList.contains('sqlab')&&!n.classList.contains('pn')&&!n.classList.contains('tqpop')&&n.id!=='tqbar'){c.nodes.push(n);c.end=n}});
 if(!chunks.length)return;
 chunks.forEach(function(c){var t=c.nodes.map(function(n){return n.textContent}).join(' ');c.tf={};var w=toks(t);c.len=w.length||1;w.forEach(function(x){c.tf[x]=(c.tf[x]||0)+1});c.qs=[]});
 var N=chunks.length,df={},avg=chunks.reduce(function(a,c){return a+c.len},0)/N;chunks.forEach(function(c){Object.keys(c.tf).forEach(function(w){df[w]=(df[w]||0)+1})});
 /* 2. asignar cada pregunta al fragmento que mejor la explica (BM25 simple) */
 qs.forEach(function(q){var words={};toks(q.q+' '+q.o[q.c]+' '+(q.e||'')).forEach(function(w){words[w]=1});var best=-1,bi=chunks.length-1;
  chunks.forEach(function(c,i){var s=0;Object.keys(words).forEach(function(w){var f=c.tf[w];if(!f)return;var idf=Math.log(1+(N-df[w]+.5)/(df[w]+.5));s+=idf*(f*2.2)/(f+1.2*(.25+.75*c.len/avg))});if(s>best){best=s;bi=i}});
  chunks[bi].qs.push(q)});
 var st=JSON.parse(LS.g(uk('tq_'+key))||'{}'),on=LS.g('tq_pop')!=='0',only=LS.g('tq_only')==='1';
 function save(){LS.s(uk('tq_'+key),JSON.stringify(st))}
 /* 3. barra superior */
 var bar=document.createElement('div');bar.id='tqbar';bar.className='tqbar';var h1=doc.querySelector('h1');h1.parentNode.insertBefore(bar,h1.nextSibling);
 function stats(){var ok=0,ko=0;qs.forEach(function(q){if(st[q.id]===1)ok++;else if(st[q.id]===0)ko++});
  bar.innerHTML='<span>🧠 <b>'+qs.length+'</b> preguntas de repaso intercaladas · <span class="ok">✔ '+ok+'</span> <span class="ko">✘ '+ko+'</span> · pendientes '+(qs.length-ok-ko)+'</span><label class="tchk"><input type="checkbox" id="tqon" '+(on?'checked':'')+'> Intercalar preguntas</label><label class="tchk"><input type="checkbox" id="tqo" '+(only?'checked':'')+'> Preguntas solo EXAMEN/IMPORTANTE</label><button id="tqr">↺ Reiniciar</button><a class="chip" href="'+ROOT+'examinate.html?t='+key+'">⏱ Examen del tema</a>';
  bar.querySelector('#tqon').onchange=function(){on=this.checked;LS.s('tq_pop',on?'1':'0');build()};
  bar.querySelector('#tqo').onchange=function(){only=this.checked;LS.s('tq_only',only?'1':'0');build()};
  bar.querySelector('#tqr').onclick=function(){if(confirm('¿Borrar tus respuestas de este tema?')){st={};save();build()}}}
 /* 4. tarjetas emergentes tras cada fragmento */
 function build(){Array.prototype.forEach.call(doc.querySelectorAll('.tqpop'),function(e){e.remove()});stats();if(!on)return;
  chunks.forEach(function(c){var list=c.qs.filter(function(q){return !only||q.x||q.i});if(!list.length)return;
   var card=document.createElement('div');card.className='tqpop';c.end.after(card);var idx=0;
   // empieza por la primera sin responder
   for(var i=0;i<list.length;i++){if(st[list[i].id]===undefined){idx=i;break}}
   function show(){var q0=list[idx],q=shufQ(q0),done=st[q.id]!==undefined,g=done&&st[q.id]===1,ans=null;
    card.innerHTML='<div class="tph"><b>🧠 Repaso rápido: lo que llevas de «'+esc(c.h.textContent.replace(/^[\d.\s]+/,'').slice(0,60))+'»</b><span>'+(idx+1)+' / '+list.length+'</span></div><div class="qmeta">'+(q.g?'<i class="G">generada</i> ':'')+(q.x?'<i class="E">EXAMEN</i> ':'')+(q.i?'<i class="I">IMPORTANTE</i>':'')+'</div><p class="qq">'+q.q+'</p><div class="opts">'+q.o.map(function(o,i){return '<div class="opt"><button class="pick" data-i="'+i+'"><span class="L">'+L[i]+'</span><span class="ot">'+o+'</span></button></div>'}).join('')+'</div><div class="fb" hidden></div><div class="row"><button class="pv"'+(idx?'':' disabled')+'>‹ Anterior</button><button class="nx"'+(idx<list.length-1?'':' disabled')+'>Siguiente ›</button><button class="hd">Seguir leyendo ▾</button></div>';
    function reveal(sel){var opts=card.querySelectorAll('.opt');Array.prototype.forEach.call(opts,function(e,j){e.classList.add(j===q.c?'good':'dim');if(sel!==null&&j===sel&&sel!==q.c)e.classList.add('bad')});var fb=card.querySelector('.fb');fb.hidden=false;fb.innerHTML=(sel===q.c?'<span class="ok">✔ Correcto.</span> ':sel===null?'Ya respondida antes. ':'<span class="ko">✘ Incorrecto.</span> ')+'Correcta: <b>'+L[q.c]+'</b>. '+(q.e||'')+(q.p?' <small><i>('+esc(q.p)+')</i></small>':'')}
    if(done)reveal(g?q.c:null);
    Array.prototype.forEach.call(card.querySelectorAll('.pick'),function(b){b.onclick=function(){if(card.querySelector('.fb:not([hidden])'))return;var i=+b.dataset.i;st[q.id]=i===q.c?1:0;save();reveal(i);var s=bar.querySelector('span');stats()}});
    card.querySelector('.pv').onclick=function(){idx--;show()};card.querySelector('.nx').onclick=function(){idx++;show()};
    card.querySelector('.hd').onclick=function(){card.classList.toggle('min');this.textContent=card.classList.contains('min')?'Mostrar pregunta ▸':'Seguir leyendo ▾'}}
   show()})}
 build()}).catch(function(){})})();
