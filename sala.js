/* Test conjunto (cooperativo): dos o más usuarios responden las mismas preguntas.
   Cada respuesta se revela cuando TODOS han marcado. Acierto = todos coinciden y es la correcta;
   si no coinciden, no cuenta como acierto. */
(function(){
var app=document.getElementById('app'),L='ABCD',BL={1:'Bloque 1 · Organización del Estado',2:'Bloque 2 · Fundamentos de informática',3:'Bloque 3 · Datos y programación',4:'Bloque 4 · Redes, seguridad y sistemas'};
var code=(new URLSearchParams(location.search).get('c')||'').toUpperCase().replace(/[^A-Z0-9]/g,''),Q=null,Qm={},T=[],room=null,poll=null,sel=null,lastSig='',ackKey='sala_ack_'+code;
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function api(p,o){return AUTH.api(p,o)}
function ackGet(){try{return JSON.parse(sessionStorage.getItem(ackKey)||'{}')}catch(e){return{}}}
function ackSet(a){try{sessionStorage.setItem(ackKey,JSON.stringify(a))}catch(e){}}
function seeded(str){var h=1779033703^str.length;for(var i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}return function(){h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;return(h>>>0)/4294967296}}
function order(q){var ord=q.o.map(function(_,i){return i});if(/anteriores|ninguna de|ambas|todas las|ninguna es|ambos/i.test(q.o.join(' ')))return ord;var r=seeded(code+':'+q.id);for(var i=ord.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=ord[i];ord[i]=ord[j];ord[j]=t}return ord}
function load(){return Promise.all([fetch('data/preguntas.json').then(function(r){return r.json()}),fetch('data/topics.json').then(function(r){return r.json()})]).then(function(a){Q=a[0];Q.forEach(function(q,i){if(q.id===undefined)q.id=i;Qm[q.id]=q});T=a[1]})}
function fail(m){app.innerHTML='<section class="pcard"><p class="ko">'+esc(m)+'</p><p><a href="sala.html">← Crear una sala</a> · <a href="examinate.html">Examínate</a></p></section>'}
/* ---------- crear ---------- */
function create(){
 var h='<p class="sub lead">Practicad juntos con las mismas preguntas. Se revela cada una cuando <b>todos</b> habéis marcado: si <b>coincidís</b> y es la correcta, cuenta como <b>acierto</b>; si coincidís en una incorrecta, es un <b>error</b>; si <b>no coincidís</b>, no cuenta como acierto. Crea la sala y comparte el enlace.</p>';
 h+='<section class="pcard"><h2>1 · Temas</h2><div class="row"><button id="all">Todos</button><button id="none">Ninguno</button>'+[1,2,3,4].map(function(b){return '<button class="bsel" data-b="'+b+'">Bloque '+b+'</button>'}).join('')+'</div>';
 [1,2,3,4].forEach(function(b){h+='<details><summary><b>'+BL[b]+'</b></summary><div class="tgrid">'+T.filter(function(t){return t.b===b}).map(function(t){return '<label class="tchk"><input type="checkbox" class="tk" value="'+t.key+'" checked> <span><b>'+t.t+'</b> '+esc(t.title.length>70?t.title.slice(0,68)+'…':t.title)+'</span></label>'}).join('')+'</div></details>'});
 h+='</section><section class="pcard"><h2>2 · Opciones</h2><div class="row"><label class="f">Preguntas<select id="n"><option>10</option><option selected>20</option><option>30</option><option>50</option><option>100</option></select></label>'
  +'<label class="f">Filtro<select id="flt"><option value="all">Todas</option><option value="ei">Solo EXAMEN + IMPORTANTE</option><option value="x">Solo EXAMEN</option></select></label>'
  +'<label class="f">Penalización por error<select id="pen"><option value="3">Resta 1/3</option><option value="4">Resta 1/4</option><option value="0">Sin penalización</option></select></label>'
  +'<label class="f">Nombre de la sala (opcional)<input id="ttl" maxlength="60" placeholder="Repaso Bloque 2"></label></div>'
  +'<div class="row"><button id="mk" class="go big">👥 Crear sala y obtener enlace</button><span id="avail" class="sub"></span></div><p id="msg" class="ko"></p></section>';
 app.innerHTML=h;
 function keys(){return Array.prototype.map.call(app.querySelectorAll('.tk:checked'),function(c){return c.value})}
 function pool(){var ks=keys(),f=document.getElementById('flt').value;return Q.filter(function(q){return ks.indexOf(q.k)>=0&&(f==='all'||(f==='ei'&&(q.x||q.i))||(f==='x'&&q.x))})}
 function av(){document.getElementById('avail').textContent=pool().length+' preguntas disponibles'}av();
 app.addEventListener('change',function(e){if(e.target.classList.contains('tk')||e.target.id==='flt')av()});
 function setAll(v,b){app.querySelectorAll('.tk').forEach(function(c){var t=T.filter(function(x){return x.key===c.value})[0];if(!b||(t&&t.b===b))c.checked=v});av()}
 document.getElementById('all').onclick=function(){setAll(true)};document.getElementById('none').onclick=function(){setAll(false)};
 app.querySelectorAll('.bsel').forEach(function(bt){bt.onclick=function(){setAll(false);setAll(true,+bt.dataset.b)}});
 document.getElementById('mk').onclick=function(){var p=pool(),n=Math.min(+document.getElementById('n').value,p.length),m=document.getElementById('msg');
  if(n<3){m.textContent='Elige temas con al menos 3 preguntas';return}
  for(var i=p.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=p[i];p[i]=p[j];p[j]=t}
  var pr=p.filter(function(q){return q.x||q.i}),lo=p.filter(function(q){return !(q.x||q.i)}),pick=pr.slice(0,Math.ceil(n/2)).concat(lo).concat(pr.slice(Math.ceil(n/2))).slice(0,n);
  this.disabled=true;m.textContent='';
  api('/api/rooms',{method:'POST',body:JSON.stringify({qids:pick.map(function(q){return q.id}),pen:+document.getElementById('pen').value,title:document.getElementById('ttl').value})}).then(function(r){location.href='sala.html?c='+r.code}).catch(function(e){m.textContent=e.message;document.getElementById('mk').disabled=false})}
}
/* ---------- sala ---------- */
function link(){return location.origin+location.pathname.replace(/[^\/]*$/,'')+'sala.html?c='+code}
function players(){return room.players}
function verdict(q,room){ // null si aún no han marcado todos
 var key=String(q.id),vals=[];for(var i=0;i<room.players.length;i++){var a=room.players[i].answers||{};if(!(key in a))return null;vals.push(a[key])}
 var agree=vals.every(function(v){return v===vals[0]});
 if(agree&&vals[0]===-1)return{k:'blank',vals:vals};
 if(!agree||vals[0]===-1)return{k:'dis',vals:vals};
 return{k:vals[0]===q.c?'ok':'err',vals:vals}}
function stats(){var s={ok:0,err:0,dis:0,blank:0,seen:0};room.qids.forEach(function(id){var v=verdict(Qm[id],room);if(v){s.seen++;s[v.k]++}});s.nota=room.n?(s.ok-(room.pen?s.err/room.pen:0))/room.n*10:0;return s}
function who(){return room.players.map(function(p){return '<span class="pl'+(p.me?' me':'')+'">'+esc(p.name)+(p.host?' ★':'')+'</span>'}).join(' ')}
function lobby(){
 var h='<section class="pcard"><h2>'+esc(room.title||'Sala '+room.code)+'</h2><p class="sub">'+room.n+' preguntas · creada por <b>'+esc(room.host)+'</b></p>';
 if(!room.joined){h+=room.started?'<p class="ko">La sala ya ha empezado.</p>':room.full?'<p class="ko">La sala está llena.</p>':'<p>Te han invitado a un test conjunto.</p><button id="join" class="go big">Unirme a la sala</button>';app.innerHTML=h+'</section>';var j=document.getElementById('join');if(j)j.onclick=function(){j.disabled=true;api('/api/rooms/'+code+'/join',{method:'POST'}).then(function(r){room=r;render(true)}).catch(function(e){fail(e.message)})};return}
 h+='<h3>En la sala ('+room.players.length+')</h3><p class="pls">'+who()+'</p>';
 h+='<div class="lnk-box"><input id="lk" readonly value="'+esc(link())+'"><button id="cp">Copiar enlace</button>'+(navigator.share?'<button id="sh">Compartir</button>':'')+'</div><p class="sub">Quien abra el enlace tendrá que iniciar sesión con su cuenta y pulsar «Unirme».</p>';
 if(room.isHost)h+='<div class="row"><button id="go" class="go big"'+(room.players.length<2?' disabled':'')+'>▶ Empezar ahora</button><span class="sub">'+(room.players.length<2?'Esperando a que se una alguien…':'Podéis empezar cuando estéis todos.')+'</span></div>';
 else h+='<p class="sub">⏳ Esperando a que '+esc(room.host)+' empiece…</p>';
 app.innerHTML=h+'</section>';
 var cp=document.getElementById('cp');if(cp)cp.onclick=function(){var i=document.getElementById('lk');i.select();(navigator.clipboard?navigator.clipboard.writeText(i.value):Promise.reject()).catch(function(){document.execCommand('copy')});cp.textContent='¡Copiado!';setTimeout(function(){cp.textContent='Copiar enlace'},1500)};
 var sh=document.getElementById('sh');if(sh)sh.onclick=function(){navigator.share({title:'Test conjunto TAI',text:'Hagamos un test juntos',url:link()}).catch(function(){})};
 var g=document.getElementById('go');if(g)g.onclick=function(){g.disabled=true;api('/api/rooms/'+code+'/start',{method:'POST'}).then(function(r){room=r;render(true)}).catch(function(e){alert(e.message);g.disabled=false})}}
function head(s,idx){return '<div class="exbar"><b>Pregunta '+Math.min(idx+1,room.n)+' / '+room.n+'</b><span>✔ '+s.ok+' · ✘ '+s.err+' · ≠ '+s.dis+'</span><span class="pls">'+who()+'</span></div><div class="pbar"><i style="width:'+(idx/room.n*100)+'%"></i></div>'}
function nextIdx(){var ack=ackGet();for(var i=0;i<room.qids.length;i++)if(!ack[room.qids[i]])return i;return room.qids.length}
var MAXS=120,tmr=null;
function tStart(id){var k='sala_t_'+code+'_'+id,t=0;try{t=+sessionStorage.getItem(k)||0;if(!t){t=Date.now();sessionStorage.setItem(k,t)}}catch(e){t=tmem[id]||(tmem[id]=Date.now())}return t}
var tmem={};
function fmt(n){return Math.floor(n/60)+':'+('0'+n%60).slice(-2)}
function startTimer(q){clearInterval(tmr);var el=document.getElementById('tm');if(!el)return;var t0=tStart(q.id);
 function upd(){var left=Math.max(0,MAXS-Math.floor((Date.now()-t0)/1000));el.textContent='⏱ '+fmt(left);el.className=left<=20?'ko':'';
  if(left<=0){clearInterval(tmr);el.textContent='⏱ Tiempo agotado';send(q,-1)}}
 upd();tmr=setInterval(upd,1000)}
function play(){
 clearInterval(tmr);
 var idx=nextIdx(),s=stats();if(idx>=room.n||room.ended)return results();
 var q=Qm[room.qids[idx]],me=room.players.filter(function(p){return p.me})[0],key=String(q.id),mine=me.answers&&me.answers[key],answered=mine!==undefined,v=verdict(q,room),ord=order(q);
 var h=head(s,idx)+'<section class="pcard"><div class="qmeta">'+(q.x?'<i class="E">EXAMEN</i> ':'')+(q.i?'<i class="I">IMPORTANTE</i>':'')+'</div><p class="qq">'+esc(q.q)+'</p><div class="opts">';
 ord.forEach(function(oi,pos){var cls='opt',picked=answered?mine===oi:sel===oi;if(v){if(oi===q.c)cls+=' good';else if(v.vals.indexOf(oi)>=0)cls+=' bad'}else if(picked)cls+=' sel';
  var tags='';if(v)room.players.forEach(function(p){if((p.answers||{})[key]===oi)tags+='<span class="pl'+(p.me?' me':'')+'">'+esc(p.name)+'</span> '});
  h+='<div class="'+cls+'"><button class="pick" data-o="'+oi+'"'+(answered?' disabled':'')+'><span class="L">'+L[pos]+'</span><span class="ot">'+esc(q.o[oi])+'</span><span class="who">'+tags+'</span></button></div>'});
 h+='</div>';
 if(!answered){h+='<p class="sub"><b id="tm">⏱ 2:00</b> · máximo 2 min por pregunta; si se acaba cuenta como «No lo sé».</p><div class="row"><button id="ok" class="go"'+(sel==null?' disabled':'')+'>Marcar respuesta</button><button id="pass">No lo sé</button></div><p class="sub">No se revela nada hasta que todos hayáis marcado.</p>'}
 else if(!v){var wait=room.players.filter(function(p){return !(p.answers||{})[key]&&!p.me&&true}).map(function(p){return p.name});
  h+='<p class="wait">✅ Has marcado. ⏳ Esperando a los demás…</p>'}
 else{var msg=v.k==='ok'?'<span class="ok">✔ Acierto: coincidís y es la correcta.</span>':v.k==='err'?'<span class="ko">✘ Error: coincidís, pero la respuesta es incorrecta.</span>':v.k==='dis'?'<span class="ko">≠ No coincidís: no cuenta como acierto.</span>':'<span>○ En blanco.</span>';
  h+='<div class="fb">'+msg+'<br>Correcta: <b>'+L[ord.indexOf(q.c)]+'</b>. '+esc(q.e||'')+(q.p?' <small><i>('+esc(q.p)+')</i></small>':'')+'</div><div class="row"><button id="nx" class="go">'+(idx+1>=room.n?'Ver resultados':'Siguiente →')+'</button></div>'}
 app.innerHTML=h+'</section>';
 app.querySelectorAll('.pick').forEach(function(b){b.onclick=function(){sel=+b.dataset.o;lastSig='';render(true)}});
 if(!answered)startTimer(q);
 var ok=document.getElementById('ok');if(ok)ok.onclick=function(){send(q,sel)};var pass=document.getElementById('pass');if(pass)pass.onclick=function(){send(q,-1)};
 var nx=document.getElementById('nx');if(nx)nx.onclick=function(){var a=ackGet();a[q.id]=1;ackSet(a);sel=null;lastSig='';render(true)}}
function send(q,v){var o={};o[q.id]=v;var b=document.getElementById('ok');if(b)b.disabled=true;
 api('/api/rooms/'+code+'/progress',{method:'PUT',body:JSON.stringify({answers:o})}).then(function(r){room=r;sel=null;lastSig='';render(true)}).catch(function(e){alert(e.message)})}
function results(){
 var s=stats(),h=head(s,room.n)+'<section class="pcard"><h2>Resultado conjunto</h2>'+(room.ended?'<p class="ko">⛔ Test finalizado: '+(room.ended.name===(room.players.filter(function(p){return p.me})[0]||{}).name?'saliste de la sala':esc(room.ended.name)+' cerró la sala')+'. Solo cuentan las preguntas ya resueltas.</p>':'')+'<p class="big"><b class="'+(s.nota>=5?'ok':'ko')+'">'+s.nota.toFixed(2)+'</b> / 10 <small>('+room.players.map(function(p){return esc(p.name)}).join(' + ')+')</small></p>'
 +'<p>✔ <b>'+s.ok+'</b> aciertos · ✘ <b>'+s.err+'</b> errores · ≠ <b>'+s.dis+'</b> sin coincidir · ○ <b>'+s.blank+'</b> en blanco'+(s.seen<room.n?' <span class="sub">(faltan '+(room.n-s.seen)+' por responder entre todos)</span>':'')+'</p></section>';
 h+='<section class="pcard"><h2>Repaso</h2>';
 room.qids.forEach(function(id,i){var q=Qm[id],v=verdict(q,room);h+='<div class="rv '+(v?(v.k==='ok'?'g':v.k==='err'?'b':'n'):'n')+'"><b>'+(i+1)+'.</b> '+esc(q.q)+'<br><small>Correcta: <b>'+esc(q.o[q.c])+'</b></small>';
  room.players.forEach(function(p){var a=(p.answers||{})[id];h+='<br><small>'+esc(p.name)+': '+(a===undefined?'—':a===-1?'no lo sé':esc(q.o[a]))+'</small>'});
  h+=(q.e?'<br><small class="sub">'+esc(q.e)+'</small>':'')+'</div>'});
 app.innerHTML=h+'<div class="row"><a class="chip" href="sala.html">👥 Nueva sala</a></div></section>'}
function render(force){
 if(!room)return;var sig=JSON.stringify([room.started,room.joined,room.ended?1:0,room.players.map(function(p){return[p.name,p.answered,Object.keys(p.answers||{}).length]}),nextIdx(),sel]);
 if(!force&&sig===lastSig)return;lastSig=sig;
 if(!room.started||!room.joined)return lobby();play()}
var TK=null;
var gone=0;
function leave(){gone=1;if(!room||!room.started||!room.joined||room.ended||!TK)return;try{fetch(AUTH.cfg.apiUrl.replace(/\/$/,'')+'/api/rooms/'+code+'/leave',{method:'POST',keepalive:true,headers:{Authorization:'Bearer '+TK,'Content-Type':'application/json'},body:'{}'})}catch(e){}}
window.addEventListener('pagehide',leave);
function tick(){if(!room||gone)return;api('/api/rooms/'+code).then(function(r){room=r;if(room.ended){clearInterval(tmr)}render(false)}).catch(function(){})}
function init(){
 if(!window.AUTH||!AUTH.remote){return fail('El test conjunto necesita las cuentas con servidor (las de este dispositivo no sirven para compartir).')}
 AUTH.accessToken().then(function(t){TK=t});
 load().then(function(){
  if(!code)return create();
  return api('/api/rooms/'+code).then(function(r){room=r;
   if(!room.joined&&!room.started&&!room.full){return api('/api/rooms/'+code+'/join',{method:'POST'}).then(function(r2){room=r2})} /* entra directo al abrir el enlace */
  }).then(function(){render(true);poll=setInterval(tick,2000);document.addEventListener('visibilitychange',tick)})
 }).catch(function(e){fail(e.message||'Error')})}
init();
})();
