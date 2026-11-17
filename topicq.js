(function(){
var doc=document.querySelector('.doc');if(!doc)return;var key=doc.dataset.key;
var LS={g:function(k){try{return localStorage.getItem(k)}catch(e){return null}},s:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
var uk=function(n){return (window.AUTH&&AUTH.key?AUTH.key(n):n)};
var ROOT=(document.currentScript&&document.currentScript.src||'').replace(/topicq\.js.*$/,'');
var sec=document.createElement('section');sec.className='tq';sec.id='preguntas';
sec.innerHTML='<h2>📝 Preguntas de este tema (Anki)</h2><p class="sub">Cargando preguntas…</p>';
var pn=doc.querySelector('.pn');pn?pn.parentNode.insertBefore(sec,pn):doc.appendChild(sec);
var toc=document.querySelector('.toc');if(toc){var a=document.createElement('a');a.href='#preguntas';a.textContent='📝 Preguntas del tema';toc.appendChild(a)}
function esc(s){return String(s).replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
function shuf(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
fetch(ROOT+'data/preguntas.json').then(function(r){return r.json()}).then(function(all){
 var qs=[];all.forEach(function(q,i){if(q.k===key){q.id=i;qs.push(q)}});
 var st=JSON.parse(LS.g(uk('tq_'+key))||'{}'),only=LS.g('tq_only')==='1',mix=false,L='ABCD';
 function save(){LS.s(uk('tq_'+key),JSON.stringify(st))}
 function draw(){var list=qs.filter(function(q){return !only||q.x||q.i});if(mix)list=shuf(list);
  var ok=0,ko=0;qs.forEach(function(q){if(st[q.id]===1)ok++;else if(st[q.id]===0)ko++});
  var h='<h2>📝 Preguntas de este tema (Anki)</h2><div class="tqbar"><span><b>'+qs.length+'</b> preguntas · <span class="ok">✔ '+ok+'</span> · <span class="ko">✘ '+ko+'</span> · pendientes '+(qs.length-ok-ko)+'</span>'
   +'<label class="tchk"><input type="checkbox" id="tqo" '+(only?'checked':'')+'> Solo EXAMEN/IMPORTANTE ('+qs.filter(function(q){return q.x||q.i}).length+')</label><button id="tqm">🔀 Mezclar</button><button id="tqr">↺ Reiniciar</button><a class="chip" href="'+ROOT+'examinate.html?t='+key+'">⏱ Examen de este tema</a></div><div class="tqlist">';
  h+=list.map(function(q){var done=st[q.id]!==undefined;return '<div class="tqc" data-id="'+q.id+'"><div class="qmeta">#'+(qs.indexOf(q)+1)+(q.x?' <i class="E">EXAMEN</i>':'')+(q.i?' <i class="I">IMPORTANTE</i>':'')+'</div><p class="qq">'+q.q+'</p><div class="opts">'+q.o.map(function(o,i){return '<div class="opt"><button class="pick" data-i="'+i+'"><span class="L">'+L[i]+'</span><span class="ot">'+o+'</span></button></div>'}).join('')+'</div><div class="fb" hidden></div></div>'}).join('')||'<p class="sub">No hay preguntas con ese filtro.</p>';
  sec.innerHTML=h+'</div>';
  sec.querySelector('#tqo').onchange=function(){only=this.checked;LS.s('tq_only',only?'1':'0');draw()};
  sec.querySelector('#tqm').onclick=function(){mix=true;draw()};
  sec.querySelector('#tqr').onclick=function(){if(confirm('¿Borrar tus respuestas de este tema?')){st={};save();mix=false;draw()}};
  Array.prototype.forEach.call(sec.querySelectorAll('.tqc'),function(c){var q=all[+c.dataset.id],done=false;
   Array.prototype.forEach.call(c.querySelectorAll('.pick'),function(b){b.onclick=function(){if(done)return;done=true;var i=+b.dataset.i,good=i===q.c;st[q.id]=good?1:0;save();
    Array.prototype.forEach.call(c.querySelectorAll('.opt'),function(e,j){e.classList.add(j===q.c?'good':'dim');if(j===i&&!good)e.classList.add('bad')});
    var fb=c.querySelector('.fb');fb.hidden=false;fb.innerHTML=(good?'<span class="ok">✔ Correcto.</span> ':'<span class="ko">✘ Incorrecto.</span> Correcta: <b>'+L[q.c]+'</b>. ')+(q.e||'')+(q.p?' <small><i>('+esc(q.p)+')</i></small>':'');
    var bar=sec.querySelector('.tqbar>span');var o2=0,k2=0;qs.forEach(function(x){if(st[x.id]===1)o2++;else if(st[x.id]===0)k2++});bar.innerHTML='<b>'+qs.length+'</b> preguntas · <span class="ok">✔ '+o2+'</span> · <span class="ko">✘ '+k2+'</span> · pendientes '+(qs.length-o2-k2)}})});
 }
 draw()}).catch(function(){sec.innerHTML='<h2>📝 Preguntas de este tema</h2><p class="sub">No se pudieron cargar las preguntas.</p>'})})();
