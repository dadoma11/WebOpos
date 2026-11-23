(function(){
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var LS={g:function(k){try{return localStorage.getItem(k)}catch(e){return null}},s:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
var uk=function(n){return (window.AUTH&&AUTH.key?AUTH.key(n):n)};
var app=$('#app'),Q=[],Qm={},T=[],cur=null,tick=null,view=null,S=window.speechSynthesis||null;
var BL={1:'Bloque 1 · Organización del Estado y Administración',2:'Bloque 2 · Sistemas y comunicaciones (base)',3:'Bloque 3 · Datos y programación',4:'Bloque 4 · Redes, seguridad y sistemas'};
var DAY=864e5;
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function shuf(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function fmt(s){var m=Math.floor(s/60),x=s%60;return (m<10?'0':'')+m+':'+(x<10?'0':'')+x}
function jget(k,d){try{var v=JSON.parse(LS.g(uk(k)));return v==null?d:v}catch(e){return d}}
function jset(k,v){LS.s(uk(k),JSON.stringify(v))}
function hist(){return jget('ex_hist',[])}function seen(){return jget('ex_seen',{})}function fails(){return jget('ex_fail',{})}function flags(){return jget('ex_flag',{})}
function srsAll(){return jget('ex_srs',{})}function days(){return jget('ex_days',{})}
function cfgGet(){return jget('ex_cfg',{})}function cfgSet(o){var c=cfgGet();for(var k in o)c[k]=o[k];jset('ex_cfg',c)}
function ds(d){d=d||new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function addDay(n){var m=days(),k=ds();m[k]=(m[k]||0)+n;jset('ex_days',m)}
function streak(){var m=days(),d=new Date(),s=0;if(!m[ds(d)])d.setDate(d.getDate()-1);while(m[ds(d)]>0){s++;d.setDate(d.getDate()-1)}return s}
function topicOf(k){return T.filter(function(t){return t.key===k})[0]||{t:'?',b:+k.charAt(1),title:''}}
function tshort(k){var t=topicOf(k).title||'';t=t.split(/[:(]/)[0].trim();return t.length>64?t.slice(0,62)+'…':t}
function qlink(q){return 't/'+q.k+'.html?buscar='+encodeURIComponent(q.q+' '+q.o[q.c])}
Promise.all([fetch('data/preguntas.json').then(function(r){return r.json()}),fetch('data/topics.json').then(function(r){return r.json()})]).then(function(a){
 Q=a[0].map(function(q,i){if(q.id===undefined)q.id=i;Qm[q.id]=q;return q});T=a[1];config();sameTest();supTest()});

/* ---------- test recibido de un compañero: «hacer el mismo test» ---------- */
function sameTest(){if(!/[?&]mismo=1/.test(location.search))return;var r=null;try{r=JSON.parse(LS.g('rx_same')||'null')}catch(e){}LS.s('rx_same','');
 history.replaceState(null,'',location.pathname);if(!r||!r.qids)return;var list=r.qids.map(function(id){return Qm[id]}).filter(Boolean);
 if(list.length<3){alert('No se encontraron las preguntas de ese test');return}
 var sn=seen();list.forEach(function(q){sn[q.id]=1});jset('ex_seen',sn);
 start(list,Math.round(list.length*1.2),true,{pen:r.pen?1/r.pen:0,study:false,mode:'rnd'})}
function supTest(){var m=/[?&]supuesto=([34])/.exec(location.search);if(!m)return;var id=(/[?&]caso=([a-z]+)/.exec(location.search)||[])[1]||null,study=/[?&]estudio=1/.test(location.search);history.replaceState(null,'',location.pathname);
 var cs=null;try{cs=CASOS.gen(m[1],id)}catch(e){}if(!cs){alert('No se pudo generar el supuesto');return}
 var list=cs.qs.map(function(x,i){return {id:'c:'+cs.id+':'+i,q:x.q,o:x.o,c:x.c,e:x.e,k:'b'+cs.b+'caso',cs:cs.title,n:i+1,x:0,i:0}});
 start(list,Math.round(list.length*1.2),true,{pen:1/3,study:study,mode:'sup',parts:list.map(function(){return 2}),cs:cs})}
function supScore(A,E,N){var d=A-E/3,M=.3*N;return d>=M?25+25*(d-M)/(N-M):25*Math.max(d,0)/M}
function shareResult(rx){var ov=document.createElement('div');ov.className='smodal';ov.innerHTML='<div class="sbox"><button class="sx" id="shx">✕</button><h2>📤 Enviar a un compañero</h2><p class="sub">Recibirá tu nota y un botón para hacer el mismo test.</p><div id="shl"><p class="sub">Cargando…</p></div></div>';document.body.appendChild(ov);
 function close(){ov.remove()}document.getElementById('shx').onclick=close;ov.onclick=function(e){if(e.target===ov)close()};
 AUTH.api('/api/social').then(function(r){var l=document.getElementById('shl');if(!r.friends.length){l.innerHTML='<p class="sub">Aún no tienes compañeros. <a href="companeros.html">Añade alguno</a>.</p>';return}
  l.innerHTML=r.friends.map(function(f){return '<div class="fr"><span class="fn"><b>'+esc(f.name)+'</b><small>'+(f.online===true?'Conectado':'')+'</small></span><span class="fa"><button class="go" data-n="'+esc(f.name)+'">Enviar</button></span></div>'}).join('');
  l.querySelectorAll('button[data-n]').forEach(function(b){b.onclick=function(){b.disabled=true;AUTH.api('/api/chat/'+encodeURIComponent(b.dataset.n),{method:'POST',body:JSON.stringify({kind:'result',body:rx})}).then(function(){b.textContent='✔ Enviado';var a=document.createElement('a');a.className='chip';a.href='companeros.html?chat='+encodeURIComponent(b.dataset.n);a.textContent='Abrir chat';b.parentNode.appendChild(a)}).catch(function(e){b.disabled=false;alert(e.message)})}})}).catch(function(e){document.getElementById('shl').innerHTML='<p class="ko">'+esc(e.message)+'</p>'})}

/* ---------- Curva del olvido ---------- */
function Rt(c,now){return Math.pow(0.9,(now-c[2])/DAY/c[0])}
function srsUpd(m,id,ok,now){var c=m[id];
 if(!c){m[id]=ok?[1.5,2.5,now,1,0]:[0.4,2.2,now,1,1];return}
 var R=Rt(c,now);
 if(ok){c[0]=c[0]*(1+c[1]*(1.4-Math.min(R,1)));c[1]=Math.min(3,c[1]+0.05)}
 else{c[0]=Math.max(0.3,c[0]*0.35);c[1]=Math.max(1.3,c[1]-0.2);c[4]++}
 c[2]=now;c[3]++}
function tstats(){var m=srsAll(),o={};Object.keys(m).forEach(function(id){var q=Qm[id];if(!q)return;var c=m[id],t=o[q.k]||(o[q.k]={a:0,n:0});t.n+=c[3];t.a+=c[3]-c[4]});return o}
function weakTopics(){var st=tstats();return T.map(function(t){var s=st[t.key]||{a:0,n:0};return {t:t,a:s.a,n:s.n,sc:(s.a+1)/(s.n+2)}}).sort(function(x,y){return x.sc-y.sc})}

/* ---------- gráficos ---------- */
function ring(p,txt,sub,cls){var r=42,C=2*Math.PI*r;return '<svg class="ring '+(cls||'')+'" viewBox="0 0 100 100" role="img" aria-label="'+esc(txt+' '+sub)+'"><circle cx="50" cy="50" r="42" class="rb"/><circle cx="50" cy="50" r="42" class="rf" stroke-dasharray="'+(C*Math.max(0,Math.min(1,p))).toFixed(1)+' '+C.toFixed(1)+'" transform="rotate(-90 50 50)"/><text x="50" y="52" class="rt">'+txt+'</text><text x="50" y="68" class="rs">'+sub+'</text></svg>'}
function srsPanel(){var m=srsAll(),now=Date.now(),ids=Object.keys(m);
 if(!ids.length)return '<section class="pcard"><h2>🧠 Tu curva del olvido</h2><p class="sub">Aún no hay datos. Cada pregunta que contestes (acierto o error) entra en tu modelo de memoria y la web calcula cuándo te conviene repasarla. Usa el modo <b>🧠 Repaso inteligente</b> para que te pregunte justo lo que estás a punto de olvidar.</p></section>';
 var Rs=ids.map(function(i){return Rt(m[i],now)}),mean=Rs.reduce(function(a,b){return a+b},0)/ids.length,due=Rs.filter(function(r){return r<0.9}).length;
 var fc=[0,0,0,0,0,0,0];ids.forEach(function(i){var c=m[i],dd=(c[2]+c[0]*DAY-now)/DAY;if(dd>0&&dd<7)fc[Math.floor(dd)]++});
 var pts=[];for(var d=0;d<=30;d++){var s=0;ids.forEach(function(i){s+=Rt(m[i],now+d*DAY)});pts.push(s/ids.length)}
 var W=300,H=90,line=pts.map(function(v,d){return (d/30*W).toFixed(1)+','+(H-v*H).toFixed(1)}).join(' ');
 var mx=Math.max.apply(null,fc.concat([1]));
 var h='<section class="pcard"><h2>🧠 Tu curva del olvido</h2><div class="tiles"><div class="tile"><b>'+ids.length+'</b><span>preguntas en tu modelo</span></div><div class="tile"><b class="'+(mean>=.8?'ok':mean>=.6?'':'ko')+'">'+Math.round(mean*100)+'%</b><span>retención media estimada</span></div><div class="tile"><b class="'+(due?'ko':'ok')+'">'+due+'</b><span>toca repasarlas ya</span></div></div>';
 h+='<div class="srsg"><div><div class="sub">Retención media prevista si no repasas (30 días)</div><svg viewBox="0 0 '+W+' '+(H+14)+'" class="srsv"><line x1="0" y1="'+(H*0.1)+'" x2="'+W+'" y2="'+(H*0.1)+'" stroke="#999" stroke-dasharray="3"/><polyline fill="none" stroke="var(--ac)" stroke-width="2.5" points="'+line+'"/><text x="2" y="'+(H+11)+'" font-size="9" fill="currentColor">hoy</text><text x="'+(W-34)+'" y="'+(H+11)+'" font-size="9" fill="currentColor">+30 días</text><text x="'+(W-60)+'" y="'+(H*0.1-3)+'" font-size="9" fill="#999">90%</text></svg></div>';
 h+='<div><div class="sub">Repasos que vencen en los próximos 7 días</div><div class="fcb">'+fc.map(function(v,d){return '<div><i style="height:'+Math.round(v/mx*60)+'px"></i><small>'+v+'</small><small>'+(d?'+'+d+'d':'hoy')+'</small></div>'}).join('')+'</div></div></div>';
 h+='<div class="sub"><button id="srsreset" class="lnk">borrar mi modelo</button></div></section>';
 return h}
function dueCount(){var m=srsAll(),now=Date.now(),n=0;Object.keys(m).forEach(function(i){if(Qm[i]&&Rt(m[i],now)<0.9)n++});return n}

/* ---------- panel de hoy + estadísticas + puntos débiles ---------- */
function examLine(goal){var cfg=cfgGet(),d=cfg.exdate,sn=seen(),unseen=Q.filter(function(q){return !sn[q.id]}).length,h='<div class="row sm"><label class="f sm">📅 Fecha del examen<input type="date" id="exd" value="'+(d||'')+'"></label>';
 if(d){var left=Math.ceil((new Date(d+'T00:00:00')-new Date(ds()+'T00:00:00'))/864e5);
  if(left>0){var need=Math.max(5,Math.ceil(unseen/left));h+='<span class="pill">⏳ Faltan <b>'+left+'</b> días</span><span class="pill">Para ver todo el banco: <b>'+need+'</b>/día'+(need!==goal?' <button id="usegoal" class="lnk">usar</button>':'')+'</span>'}
  else h+='<span class="pill">'+(left===0?'🎯 ¡Es hoy! Mucha suerte':'Fecha pasada')+'</span>'}
 return h+'</div>'}
function heroCard(){var cfg=cfgGet(),goal=cfg.goal||30,dm=days(),today=dm[ds()]||0,st=streak(),due=dueCount();
 var left=Math.max(0,goal-today);
 return '<section class="pcard hero">'+ring(today/goal,today+'/'+goal,'hoy',today>=goal?'done':'')
  +'<div class="hbody"><h2>Plan de hoy</h2><div class="chips"><span class="pill">🔥 Racha: <b>'+st+'</b> '+(st===1?'día':'días')+'</span><span class="pill">🧠 <b>'+due+'</b> para repasar</span><span class="pill">'+(left?'Te faltan <b>'+left+'</b> para tu objetivo':'✅ Objetivo cumplido')+'</span></div>'
  +examLine(goal)+'<div class="row"><button id="plan" class="go big">▶ '+(left?'Empezar plan de hoy':'Seguir practicando')+'</button><label class="f sm">Objetivo diario<input type="number" id="goal" min="5" max="500" value="'+goal+'"></label></div></div></section>'}
function statsCard(){var hs=hist(),m=srsAll(),ids=Object.keys(m),tot=0,ok=0;ids.forEach(function(i){tot+=m[i][3];ok+=m[i][3]-m[i][4]});
 var last5=hs.slice(-5),avg=last5.length?last5.reduce(function(a,x){return a+x.nota},0)/last5.length:null;
 var h='<section class="pcard"><h2>📊 Tu progreso</h2><div class="tiles">'
  +'<div class="tile"><b>'+tot+'</b><span>respuestas dadas</span></div>'
  +'<div class="tile"><b class="'+(tot&&ok/tot>=.7?'ok':tot&&ok/tot<.5?'ko':'')+'">'+(tot?Math.round(ok/tot*100)+'%':'–')+'</b><span>acierto global</span></div>'
  +'<div class="tile"><b>'+hs.length+'</b><span>exámenes hechos</span></div>'
  +'<div class="tile"><b class="'+(avg==null?'':avg>=5?'ok':'ko')+'">'+(avg==null?'–':avg.toFixed(2))+'</b><span>media últimos '+Math.max(last5.length,1)+'</span></div></div>';
 if(hs.length>=2){var pts=hs.slice(-20),W=320,H=110,px=function(i){return pts.length>1?10+i*(W-20)/(pts.length-1):W/2},py=function(v){return H-8-(v/10)*(H-16)};
  h+='<div class="sub">Nota de tus últimos exámenes (la línea discontinua es el 5)</div><svg viewBox="0 0 '+W+' '+H+'" class="nchart"><line x1="0" x2="'+W+'" y1="'+py(5)+'" y2="'+py(5)+'" stroke="#999" stroke-dasharray="4"/><polyline fill="none" stroke="var(--ac)" stroke-width="2.5" stroke-linejoin="round" points="'+pts.map(function(x,i){return px(i).toFixed(1)+','+py(x.nota).toFixed(1)}).join(' ')+'"/>'+pts.map(function(x,i){return '<circle cx="'+px(i).toFixed(1)+'" cy="'+py(x.nota).toFixed(1)+'" r="3.5" fill="'+(x.nota>=5?'#2e9d5b':'#d6453d')+'"><title>'+x.nota.toFixed(2)+'</title></circle>'}).join('')+'</svg>'}
 var dm=days(),goal=cfgGet().goal||30,cells='',d0=new Date();d0.setDate(d0.getDate()-34);
 for(var i=0;i<35;i++){var k=ds(d0),v=dm[k]||0,lv=!v?0:v>=goal?4:v>=goal*.6?3:v>=goal*.25?2:1;cells+='<i class="hm l'+lv+'" title="'+k+': '+v+' preguntas"></i>';d0.setDate(d0.getDate()+1)}
 h+='<div class="sub">Actividad de las últimas 5 semanas</div><div class="heat">'+cells+'</div></section>';return h}
function weakCard(){var w=weakTopics(),h='<section class="pcard"><h2>🎯 Tus puntos débiles</h2>';
 var played=w.filter(function(x){return x.n>0});
 if(!played.length)return h+'<p class="sub">Cuando hayas respondido algunas preguntas verás aquí en qué temas fallas más.</p></section>';
 h+='<p class="sub">Temas ordenados de más flojo a más fuerte (según todas tus respuestas).</p>';
 h+=w.slice(0,8).map(function(x){var p=x.n?Math.round(x.a/x.n*100):null;return '<div class="wk"><div class="wkt"><b>'+x.t.t+'</b> '+esc(x.t.title.length>58?x.t.title.slice(0,56)+'…':x.t.title)+'</div><div class="wkb"><i class="'+(p==null?'':p>=75?'g':p>=55?'m':'b')+'" style="width:'+(p==null?0:p)+'%"></i></div><span class="wkp">'+(p==null?'sin datos':p+'% ('+x.n+')')+'</span><button class="wkgo" data-k="'+x.t.key+'">Practicar</button></div>'}).join('');
 h+='<div class="row"><button id="weak5" class="go">🎯 Test con mis 5 temas más flojos</button></div></section>';return h}

/* ---------- configuración ---------- */
var MODES=[['rnd','🎲','Aleatorio','Prioriza las que no has visto','Test con las preguntas y el tiempo que elijas, con nota al final. Prioriza las que aún no has visto.'],['srs','🧠','Repaso inteligente','Lo que estás a punto de olvidar','Sin elegir cantidad: te pone todas las preguntas que toca repasar sí o sí, empezando por las que más estás olvidando.'],['weak','🎯','Puntos débiles','Tus temas más flojos y falladas','Test centrado en tus 5 temas más flojos y en las preguntas que más fallas.'],['sim','🏛','Simulacro','80 de teoría + 20 de supuesto práctico, como el examen','Examen completo de 100 preguntas en 120 minutos (teoría + supuesto práctico), puntuado como el oficial.'],['flash','🃏','Flashcards','Sin opciones: recuerda y autoevalúate','Tarjetas sin opciones: ves la pregunta, piensas la respuesta, la destapas y te autoevalúas. Sin nota.'],['listen','🎧','Modo escucha','Te lee las preguntas; respondes A–D','Te lee cada pregunta en voz alta y respondes A–D. Sin nota.']];
function config(){window.__plabel='';var mm=document.querySelector('main');if(mm)mm.classList.remove('wide');clearInterval(tick);cur=null;view=null;window.__inExam=false;if(S)S.cancel();
 var cfg=cfgGet(),tp=new URLSearchParams(location.search).get('t'),sel=(tp&&T.some(function(t){return t.key===tp})?[tp]:null)||cfg.sel||T.map(function(t){return t.key}),n=cfg.n||20,mins=cfg.mins==null?Math.round(n*1.2):cfg.mins,mode=cfg.mode||'rnd',pen=cfg.pen||'3';
 var cnt={};Q.forEach(function(q){cnt[q.k]=(cnt[q.k]||0)+1});var fl=fails(),nf=Object.keys(fl).length,fg=flags(),ng=Object.keys(fg).length;
 var h='<p class="sub lead">'+Q.length+' preguntas tipo test (Anki + redactadas del temario + automáticas, 4 opciones). La nota por defecto es <b>(aciertos − errores/3) sobre 10</b>; puedes cambiar la penalización en las opciones.</p>';
 h+=heroCard();


 var sc=cfg.sim||{},ts=tstats();
 h+='<section class="pcard" id="cfgcard"><h2>¿Qué quieres hacer?</h2><div class="modes">'+MODES.map(function(m){return '<label class="mode"><input type="radio" name="mode" value="'+m[0]+'"'+(m[0]===mode?' checked':'')+'><span class="mc"><span class="mi">'+m[1]+'</span><b>'+m[2]+'</b><small>'+m[3]+'</small></span></label>'}).join('')+'</div><p class="sub modehint" id="modehint"></p>';
 /* simulacro */
 h+='<div id="secsim" hidden><h3>🏛 Simulacro del examen oficial</h3><p class="sub">Un solo ejercicio de <b>120 min</b> con dos partes. Cada parte se puntúa de 0 a 50 y necesitas 25 en cada una.</p>'
  +'<div class="simparts"><div class="sp"><b>Parte 1 · Teoría</b><span>80 preguntas</span><small>Los 4 bloques (22 · 12 · 22 · 24 según nº de temas) · cada error resta 1/3</small></div><div class="sp"><b>Parte 2 · Supuesto práctico</b><span>20 preguntas</span><small>Al final, del bloque que elijas · cada error resta 1/3</small></div></div>'
  +'<h3>Supuesto práctico</h3><div class="seg big"><label><input type="radio" name="sup" value="3"'+(sc.sup!=='4'?' checked':'')+'><span><b>Bloque III</b><small>Desarrollo de sistemas</small></span></label><label><input type="radio" name="sup" value="4"'+(sc.sup==='4'?' checked':'')+'><span><b>Bloque IV</b><small>Sistemas y comunicaciones</small></span></label></div>'
  +'<label class="f" style="margin-top:.6rem;max-width:460px">Caso práctico<select id="casesel"></select></label>'
  +'<h3>Dificultad de la teoría</h3><div class="seg"><label><input type="radio" name="dif" value="easy"'+(sc.dif==='easy'?' checked':'')+'><span>Más fáciles</span></label><label><input type="radio" name="dif" value="mid"'+(!sc.dif||sc.dif==='mid'?' checked':'')+'><span>Equilibrada</span></label><label><input type="radio" name="dif" value="hard"'+(sc.dif==='hard'?' checked':'')+'><span>Más difíciles</span></label></div><p class="sub">Fáciles, medias y difíciles van intercaladas. La dificultad se estima por la redacción de la pregunta y, si ya la has contestado, por tus fallos.</p>'
  +'<p class="sub">Puntuación: acierto +1, error −1/3, blanco 0. Las notas de corte de la última convocatoria (2026) quedaron en 24 puntos directos en teoría y 9,67 en el supuesto; aquí se usa el 30 % de cada parte como mínimo (24 y 6).</p>'
  +'</div>';
 h+='<div id="secpr"><h3>Temas <small id="tsum" class="sub"></small></h3><div class="row"><button id="all">Todos</button><button id="none">Ninguno</button><span class="sub">Marca un bloque entero o abre sus temas. La barra de cada tema es tu porcentaje de acierto.</span></div>';
 [1,2,3,4].forEach(function(b){var tl=T.filter(function(t){return t.b===b});h+='<details class="blk"'+(sel.length<T.length?' open':'')+'><summary><label class="bh"><input type="checkbox" class="bk" data-b="'+b+'"> <b>'+BL[b]+'</b></label> <small class="bs" data-b="'+b+'"></small></summary><div class="tgrid">'+tl.map(function(t){var st=ts[t.key],p=st&&st.n?Math.round(st.a/st.n*100):0;return '<label class="tchk tpc"><input type="checkbox" class="tk" value="'+t.key+'" '+(sel.indexOf(t.key)>=0?'checked':'')+'><span class="tn">'+t.t+'</span><span class="tt">'+esc(t.title.length>80?t.title.slice(0,78)+'…':t.title)+'</span><span class="tm" title="'+(st&&st.n?p+'% de acierto':'sin datos')+'"><i class="'+(p>=75?'g':p>=55?'m':'b')+'" style="width:'+p+'%"></i></span><small>'+(cnt[t.key]||0)+'</small></label>'}).join('')+'</div></details>'});
 h+='<h3>Ajustes</h3>'
  +'<div class="fgrp" id="grpn"><h4>Cantidad y tiempo</h4><div class="row"><label class="f">Nº de preguntas<input type="number" id="n" min="1" max="500" value="'+n+'"><span class="presets">'+[10,20,40,80].map(function(x){return '<button type="button" class="pre" data-n="'+x+'">'+x+'</button>'}).join('')+'</span></label><label class="f">Tiempo en minutos<input type="number" id="mins" min="0" max="300" value="'+mins+'"><small>0 = sin límite</small></label></div></div>'
  +'<div class="fgrp"><h4>Corrección</h4><div class="seg" id="pensg"><label><input type="radio" name="pen" value="3"'+(pen==='3'?' checked':'')+'><span>Resta 1/3 <small>como el examen</small></span></label><label><input type="radio" name="pen" value="4"'+(pen==='4'?' checked':'')+'><span>Resta 1/4</span></label><label><input type="radio" name="pen" value="0"'+(pen==='0'?' checked':'')+'><span>Sin penalización</span></label></div></div>'
  +'<div class="fgrp"><h4>Qué preguntas</h4><div class="row"><label class="f">Origen<select id="bank"><option value="all">Todas</option><option value="anki">Solo Anki</option><option value="wr">Solo redactadas del temario</option><option value="gen">Solo automáticas</option></select></label>'
  +'<label class="f">Filtro<select id="flt"><option value="all">Todas</option><option value="ei">Solo EXAMEN + IMPORTANTE</option><option value="x">Solo EXAMEN</option><option value="i">Solo IMPORTANTE</option><option value="hard">Solo difíciles (las que más fallo)</option><option value="new">Solo nunca vistas</option>'+(nf?'<option value="fail">Solo mis falladas ('+nf+')</option>':'')+(ng?'<option value="flag">Solo marcadas ⚑ ('+ng+')</option>':'')+'</select></label></div></div>'
  +'<div class="fgrp"><h4>Opciones</h4><label class="sw"><input type="checkbox" id="shf" checked><span></span> Mezclar el orden de las opciones</label><label class="sw"><input type="checkbox" id="prio" checked><span></span> Dar prioridad a EXAMEN / IMPORTANTE</label><label class="sw"><input type="checkbox" id="study"'+(cfg.study?' checked':'')+'><span></span> Corregir cada pregunta al responder</label></div>'
  +'</div><div class="row startbar"><button id="start" class="go big">▶ Empezar</button><span id="avail" class="sub"></span></div></section>';
 h+='<section class="pcard"><h2>👥 Test conjunto</h2><p class="sub">Hazlo con otra persona mediante un enlace: se revela cada pregunta cuando ambos habéis marcado, y solo cuenta como acierto si coincidís y es la correcta.</p><a class="chip go" href="sala.html">Crear una sala</a></section>';
 h+=statsCard()+weakCard()+srsPanel();
 var hs=hist();if(hs.length){h+='<section class="pcard"><h2>Historial</h2><div class="hist">'+hs.slice(-10).reverse().map(function(x){return '<div><b class="'+(x.nota>=5?'ok':'ko')+'">'+x.nota.toFixed(2)+'</b> · '+new Date(x.t).toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'})+' · ✔'+x.a+' ✘'+x.e+' ○'+x.b+' de '+x.n+(x.m&&x.m!=='rnd'?' · <small>'+x.m+'</small>':'')+'</div>'}).join('')+'</div></section>'}
 app.innerHTML=h;var rs=$('#srsreset');if(rs)rs.onclick=function(){if(confirm('¿Borrar tu modelo de memoria (curva del olvido)?')){jset('ex_srs',{});config()}};
 function keysSel(){return $$('.tk:checked').map(function(c){return c.value})}
 function pool(){return poolFor(keysSel(),$('#flt').value,$('#bank').value)}
 function av(){[1,2,3,4].forEach(function(b){var cs=$$('.tk').filter(function(c){return c.value.indexOf('b'+b+'t')===0}),k=cs.filter(function(c){return c.checked}).length,bk=document.querySelector('.bk[data-b="'+b+'"]'),sm=document.querySelector('.bs[data-b="'+b+'"]');bk.checked=k===cs.length;bk.indeterminate=k>0&&k<cs.length;sm.textContent=k+' de '+cs.length+' temas'});$('#tsum').textContent='· '+keysSel().length+' de '+T.length+' seleccionados';var p=pool(),sn=seen(),m0=srsAll(),n0=Date.now(),dc=p.filter(function(q){return m0[q.id]&&Rt(m0[q.id],n0)<0.9}).length;$('#avail').innerHTML=p.length+' disponibles · <b>'+p.filter(function(q){return !sn[q.id]}).length+'</b> aún sin ver · <b>'+dc+'</b> vencidas <button id="fgt" class="lnk">olvidar vistas</button>';var f=$('#fgt');if(f)f.onclick=function(){jset('ex_seen',{});av()};updBtn()}
 function updBtn(){var m=curMode(),b=$('#start'),p=pool(),nn=Math.max(1,+$('#n').value||20),k=Math.min(nn,p.length),t,dis=false,md=MODES.filter(function(x){return x[0]===m})[0];$('#modehint').textContent=md?md[4]:'';
  if(m==='sim'){t='🏛 Empezar simulacro · 100 preguntas · 120 min';$('#avail').innerHTML=''}
  else if(m==='srs'){var d=dueList(p).length;t=d?'🧠 Empezar repaso inteligente · '+d+' para repasar':'🧠 Nada pendiente de repasar';dis=!d}
  else if(!p.length){t='Sin preguntas con estos filtros';dis=true}
  else t={rnd:'🎲 Empezar test aleatorio · ',weak:'🎯 Empezar test de puntos débiles · ',flash:'🃏 Empezar flashcards · ',listen:'🎧 Empezar modo escucha · '}[m]+k+(m==='flash'?' tarjetas':' preguntas');
  b.textContent=t;b.disabled=dis}
 av();
 $('#bank').onchange=av;$('#flt').onchange=av;$$('.tk').forEach(function(c){c.onchange=av});
 $('#all').onclick=function(){$$('.tk').forEach(function(c){c.checked=true});av()};$('#none').onclick=function(){$$('.tk').forEach(function(c){c.checked=false});av()};
 $$('.bk').forEach(function(b){b.onchange=function(){$$('.tk').forEach(function(c){if(c.value.indexOf('b'+b.dataset.b+'t')===0)c.checked=b.checked});av()}});
 $$('.pre').forEach(function(b){b.onclick=function(){$('#n').value=b.dataset.n;$('#n').oninput()}});
 $('#n').oninput=function(){$('#mins').value=Math.max(1,Math.round($('#n').value*1.2));updBtn()};$('#n').onchange=updBtn;
 function curMode(){return $('input[name=mode]:checked').value}
 function setMode(){var m=curMode(),sim=m==='sim';$('#secsim').hidden=!sim;$('#secpr').hidden=sim;$('#grpn').hidden=m==='srs';updBtn()}
 function fillCases(){var b=document.querySelector('input[name=sup]:checked').value,sc=cfgGet().sim||{},h='<option value="">Aleatorio (nuevo cada vez)</option>'+CASOS.info.filter(function(c){return c.b==b}).map(function(c){return '<option value="'+c.id+'"'+(sc.cs===c.id?' selected':'')+'>'+esc(c.t)+(c.db?' · con base de datos':'')+'</option>'}).join('');$('#casesel').innerHTML=h}
 fillCases();$$('input[name=sup]').forEach(function(r){r.onchange=fillCases});
 $$('input[name=mode]').forEach(function(r){r.onchange=function(){var m=curMode();setMode();if(m==='flash'||m==='listen'){$('#mins').value=0}else if(m==='weak'){var w=weakTopics().slice(0,5).map(function(x){return x.t.key});$$('.tk').forEach(function(c){c.checked=w.indexOf(c.value)>=0});av()}}});setMode();
 function runSim(){var o={sup:document.querySelector('input[name=sup]:checked').value,dif:document.querySelector('input[name=dif]:checked').value,cs:$('#casesel').value};cfgSet({sim:o,mode:'sim'});simulacro(o)}
 function go(o){cfgSet(o.all?{sel:o.keys,mode:o.mode,pen:o.penK,study:o.study}:{sel:o.keys,n:o.n,mins:o.mins,mode:o.mode,pen:o.penK,study:o.study});launch(o)}
 $('#start').onclick=function(){if(curMode()==='sim')return runSim();var sr=curMode()==='srs';go({all:sr,keys:keysSel(),flt:$('#flt').value,bank:$('#bank').value,mode:curMode(),n:+$('#n').value||20,mins:sr?0:+$('#mins').value||0,penK:document.querySelector('input[name=pen]:checked').value,pen:document.querySelector('input[name=pen]:checked').value==='0'?0:1/(+document.querySelector('input[name=pen]:checked').value),shuf:$('#shf').checked,prio:$('#prio').checked,study:$('#study').checked})};
 var exd=$('#exd');if(exd)exd.onchange=function(){cfgSet({exdate:exd.value});config()};var ug=$('#usegoal');if(ug)ug.onclick=function(){var d=cfgGet().exdate,sn=seen(),u=Q.filter(function(q){return !sn[q.id]}).length,l=Math.ceil((new Date(d+'T00:00:00')-new Date(ds()+'T00:00:00'))/864e5);cfgSet({goal:Math.min(500,Math.max(5,Math.ceil(u/l)))});config()};
 $('#goal').onchange=function(){cfgSet({goal:Math.max(5,+$('#goal').value||30)});config()};
 $('#plan').onclick=function(){var g=cfgGet().goal||30,left=g-(days()[ds()]||0),k=T.map(function(t){return t.key}),cs=cfgGet().sel;if(cs&&cs.length)k=cs;
  launch({keys:k,flt:'all',bank:'all',mode:'srs',n:Math.max(10,Math.min(left>0?left:15,100)),mins:0,penK:'3',pen:1/3,shuf:true,prio:true,study:true,tag:'plan'})};
 $$('.wkgo').forEach(function(b){b.onclick=function(){launch({keys:[b.dataset.k],flt:'all',bank:'all',mode:'weak',n:20,mins:0,penK:'3',pen:1/3,shuf:true,prio:true,study:true,tag:'tema'})}});
 var w5=$('#weak5');if(w5)w5.onclick=function(){launch({keys:weakTopics().slice(0,5).map(function(x){return x.t.key}),flt:'all',bank:'all',mode:'weak',n:30,mins:0,penK:'3',pen:1/3,shuf:true,prio:true,study:true,tag:'débiles'})};
}
function poolFor(ks,f,bk){var fl=fails(),fg=flags(),m=srsAll();return Q.filter(function(q){if(ks.indexOf(q.k)<0)return false;if(bk==='anki'&&q.g)return false;if(bk==='gen'&&q.g!==1)return false;if(bk==='wr'&&q.g!==2)return false;
 if(f==='ei')return q.x||q.i;if(f==='x')return q.x;if(f==='i')return q.i;if(f==='fail')return !!fl[q.id];if(f==='flag')return !!fg[q.id];if(f==='new')return !m[q.id];
 if(f==='hard'){var c=m[q.id];return c&&c[4]>0&&c[4]/c[3]>=0.4}return true})}
function dueList(p){var m=srsAll(),now=Date.now();return p.filter(function(q){return m[q.id]&&Rt(m[q.id],now)<0.9}).sort(function(a,b){return Rt(m[a.id],now)-Rt(m[b.id],now)})}
function uniq(a,n){var s={},r=[];for(var i=0;i<a.length&&r.length<n;i++){if(!s[a[i].id]){s[a[i].id]=1;r.push(a[i])}}return r}
function samp(arr,m,pr){if(!pr)return shuf(arr).slice(0,m);var hi=shuf(arr.filter(function(q){return q.x||q.i})),lo=shuf(arr.filter(function(q){return !(q.x||q.i)})),r=[];
 while(r.length<m&&(hi.length||lo.length)){var useA=hi.length&&(!lo.length||Math.random()<2*hi.length/(2*hi.length+lo.length));r.push(useA?hi.shift():lo.shift())}return r}
function choose(mode,p,n,o){var m=srsAll(),now=Date.now(),sn=seen(),fl=fails();
 function due(q){return m[q.id]&&Rt(m[q.id],now)<0.9}
 function byR(a,b){return Rt(m[a.id],now)-Rt(m[b.id],now)}
 if(mode==='srs'||mode==='flash'){var dueL=p.filter(due).sort(byR),newL=shuf(p.filter(function(q){return !m[q.id]})).sort(function(a,b){return (b.x+b.i>0)-(a.x+a.i>0)}),okL=p.filter(function(q){return m[q.id]&&!due(q)}).sort(byR);
  var nd=Math.min(dueL.length,Math.ceil(n*0.7));return shuf(uniq(dueL.slice(0,nd).concat(newL,dueL.slice(nd),okL),n))}
 if(mode==='weak'){var A=shuf(p.filter(function(q){return fl[q.id]})),B=p.filter(due).sort(byR),C=shuf(p.filter(function(q){return !m[q.id]})),D=p.filter(function(q){return m[q.id]&&!due(q)}).sort(byR);
  return shuf(uniq(A.slice(0,Math.ceil(n*0.5)).concat(B.slice(0,Math.ceil(n*0.3)),C,A,B,D),n))}
 if(mode==='sim'){var by={};p.forEach(function(q){(by[q.k.charAt(1)]=by[q.k.charAt(1)]||[]).push(q)});var ks=$$('.tk:checked').map(function(c){return c.value.charAt(1)}),w={};ks.forEach(function(b){w[b]=(w[b]||0)+1});var bs=Object.keys(w).filter(function(b){return by[b]}),tot=bs.reduce(function(a,b){return a+w[b]},0)||1,res=[];
  var al={},rest=n;bs.forEach(function(b){al[b]=Math.min(by[b].length,Math.floor(n*w[b]/tot));rest-=al[b]});
  while(rest>0){var g=false;bs.forEach(function(b){if(rest>0&&al[b]<by[b].length){al[b]++;rest--;g=true}});if(!g)break}
  bs.forEach(function(b){var U=by[b].filter(function(q){return !sn[q.id]}),Sn=by[b].filter(function(q){return sn[q.id]}),pk=samp(U,al[b],o.prio);if(pk.length<al[b])pk=pk.concat(samp(Sn,al[b]-pk.length,o.prio));res=res.concat(pk)});return shuf(res)}
 var U=p.filter(function(q){return !sn[q.id]}),Sn=p.filter(function(q){return sn[q.id]}),pick=samp(U,n,o.prio);if(pick.length<n)pick=pick.concat(samp(Sn,n-pick.length,o.prio));return shuf(pick)}
function launch(o){var p=poolFor(o.keys,o.flt,o.bank);if(!p.length){alert('No hay preguntas con esos filtros');return}
 var list;if(o.mode==='srs'&&o.all){list=dueList(p);if(!list.length){alert('No tienes nada pendiente de repasar 🎉');return}}else list=choose(o.mode,p,Math.max(1,Math.min(o.n,p.length)),o);
 var sn=seen();list.forEach(function(q){sn[q.id]=1});jset('ex_seen',sn);
 if(o.mode==='flash')return flash(list,o);if(o.mode==='listen')return listen(list,o);
 start(list,o.mins,o.shuf,o)}


/* ---------- simulacro oficial: 80 teoría + 20 supuesto ---------- */
var HC={};
function tokset(t){var o={};t.toLowerCase().replace(/<[^>]+>/g,' ').split(/[^a-záéíóúñ0-9]+/).forEach(function(w){if(w.length>3)o[w]=1});return o}
function hardness(q){if(HC[q.id]!=null)return HC[q.id];var ts=q.o.map(tokset),ov=0,c=0,i,j,k;
 for(i=0;i<ts.length;i++)for(j=i+1;j<ts.length;j++){var a=Object.keys(ts[i]),m=Math.min(a.length,Object.keys(ts[j]).length)||1,x=0;for(k=0;k<a.length;k++)if(ts[j][a[k]])x++;ov+=x/m;c++}
 ov=c?ov/c:0;var len=q.q.length+q.o.join('').length,neg=/\b(no es|excepto|incorrecta|falsa|no corresponde|salvo|no forma)\b/i.test(q.q)?1:0;
 var h=Math.min(1,len/700)*.35+Math.min(1,ov/.5)*.4+neg*.25,m2=srsAll()[q.id];if(m2&&m2[3]>=2)h=.4*h+.6*(m2[4]/m2[3]);return HC[q.id]=h}
function applied(q){return /\b(dado|dada|supón|suponga|siguiente (c[oó]digo|comando|consulta|script|tabla|configuraci[oó]n|direcci[oó]n)|qu[eé] (devuelve|resultado|muestra|hace)|ejecut|comando|select |bash|\d+\.\d+\.\d+|\/\d{1,2}\b)/i.test(q.q)||/[{}<>=;$]/.test(q.q)}
var MIX={easy:[.5,.3,.2],mid:[1/3,1/3,1/3],hard:[.2,.3,.5]};
function levelsOf(arr){var s=arr.slice().sort(function(a,b){return hardness(a)-hardness(b)}),t=Math.floor(s.length/3);return [shuf(s.slice(0,t)),shuf(s.slice(t,s.length-t)),shuf(s.slice(s.length-t))]}
function pickMix(arr,n,mix){n=Math.min(n,arr.length);var lv=levelsOf(arr),q=mix.map(function(m){return Math.floor(n*m)}),r=n-q.reduce(function(a,b){return a+b},0),ord=[0,1,2].sort(function(a,b){return mix[b]-mix[a]}),i;
 for(i=0;r>0;i=(i+1)%3,r--)q[ord[i]]++;var out=[[],[],[]];
 for(i=0;i<3;i++){out[i]=lv[i].splice(0,q[i])}
 var short=n-out[0].length-out[1].length-out[2].length;for(i=0;short>0&&i<9;i++){var l=ord[i%3];if(lv[l].length){out[l].push(lv[l].shift());short--}}
 return out}
function weave(lv){var tot=lv.map(function(x){return x.length}),N=tot[0]+tot[1]+tot[2],tk=[0,0,0],res=[];
 for(var i=0;i<N;i++){var b=-1,bd=-9;for(var l=0;l<3;l++){if(tk[l]>=tot[l])continue;var d=tot[l]*(i+1)/N-tk[l]+Math.random()*.01;if(d>bd){bd=d;b=l}}res.push(lv[b][tk[l=b]++])}return res}
function simBuild(o){var mix=MIX[o.dif]||MIX.mid,alloc={1:22,2:12,3:22,4:24},t1=[],used={};
 var lv1=[[],[],[]];[1,2,3,4].forEach(function(b){var pool=Q.filter(function(q){return q.k.charAt(1)==b}),r=pickMix(pool,alloc[b],mix);r.forEach(function(x,i){x.forEach(function(q){used[q.id]=1});lv1[i]=lv1[i].concat(x)})});
 var p1=weave(lv1.map(shuf));
 var cs=CASOS.gen(o.sup,o.cs||null);
 var p2=cs.qs.map(function(x,i){return {id:'c:'+cs.id+':'+i,q:x.q,o:x.o,c:x.c,e:x.e,k:'b'+cs.b+'caso',cs:cs.title,n:i+1,x:0,i:0}});
 return {list:p1.concat(p2),parts:p1.map(function(){return 1}).concat(p2.map(function(){return 2})),cs:cs}}
function simulacro(o){var r=simBuild(o),sn=seen();r.list.forEach(function(q){sn[q.id]=1});jset('ex_seen',sn);
 start(r.list,120,true,{pen:1/3,study:false,mode:'sim',parts:r.parts,sim:o,cs:r.cs})}
function simScore(c){var p={1:{a:0,e:0,n:0},2:{a:0,e:0,n:0}};c.items.forEach(function(it){var x=p[it.part||1];x.n++;if(it.ans>=0){if(it.ord[it.ans]===it.q.c)x.a++;else x.e++}});
 function g(x){var d=x.a-x.e/3,M=.3*x.n;return {d:d,n:x.n,a:x.a,e:x.e,g:d>=M?25+25*(d-M)/(x.n-M):25*Math.max(d,0)/M}}
 var a=g(p[1]),b=g(p[2]);return {p1:a,p2:b,total:a.g+b.g,ok1:a.g>=25,ok2:b.g>=25}}

/* ---------- examen ---------- */
function plab(list,pre){var ks={};list.forEach(function(q){if(q.k&&!q.cs)ks[q.k]=1});var k=Object.keys(ks);window.__plabel=pre+' ('+list.length+' preguntas'+(k.length&&k.length<=2?' · Tema '+k.map(function(x){return topicOf(x).t}).join(', '):k.length>2?' · '+k.length+' temas':'')+')';if(window.AUTH&&AUTH.beat)AUTH.beat()}
function start(list,mins,shuffleOpts,o){o=o||{};var fg=flags();plab(list,o.mode==='sim'?'Haciendo un simulacro':o.mode==='sup'?'Haciendo un supuesto práctico':'Haciendo un test');
 var items=list.map(function(q){var ord=q.o.map(function(_,i){return i});
  if(shuffleOpts&&!/anteriores|ninguna de|ambas|todas las|ninguna es|ambos/i.test(q.o.join(' ')))ord=shuf(ord);
  return {q:q,ord:ord,ans:-1,flag:!!fg[q.id],part:0}});items.forEach(function(it,i){it.part=(o.parts&&o.parts[i])||1});
 window.__inExam=true;view='exam';cur={items:items,i:0,total:mins*60,left:mins*60,t0:Date.now(),pen:o.pen==null?1/3:o.pen,study:!!o.study,mode:o.mode||'rnd',sim:o.sim||null,cs:o.cs||null};render();
 clearInterval(tick);tick=setInterval(function(){if(!cur||cur.done)return;var el=Math.round((Date.now()-cur.t0)/1000);cur.left=cur.total?cur.total-el:el;var t=$('#clock');if(t)t.textContent=fmt(Math.abs(cur.left));
  if(cur.total&&cur.left<=60&&t)t.classList.add('ko');if(cur.total&&cur.left<=0){finish(true)}},500)}
function dbHtml(db){return db.map(function(t){return '<div class="dbt"><h4>'+t.name+'</h4><div class="tw"><table><tr>'+t.cols.map(function(c){var pk=t.pk.indexOf(c)>=0,fk=t.fk[c];return '<th'+(fk?' title="Clave foránea → '+esc(fk)+'"':'')+'>'+(pk?'🔑 ':'')+c+(fk?' ↗':'')+'</th>'}).join('')+'</tr>'+t.rows.map(function(r){return '<tr>'+r.map(function(v){return '<td>'+(v===null?'<i class="nl">NULL</i>':esc(v))+'</td>'}).join('')+'</tr>'}).join('')+'</table></div>'+(Object.keys(t.fk).length?'<small>'+Object.keys(t.fk).map(function(k){return k+' → '+t.fk[k]}).join(' · ')+'</small>':'')+'</div>'}).join('')+'<p class="sub">🔑 clave primaria · ↗ clave foránea</p>'}
function caseWrap(c,card){var cs=c.cs;return '<div class="casegrid'+(cs.db?' c3':'')+'"><div class="cq">'+card+'</div><aside class="ce"><h3>📋 '+esc(cs.title)+'</h3>'+cs.enun+'</aside>'+(cs.db?'<aside class="cd"><h3>🗄 Base de datos</h3>'+dbHtml(cs.db)+'</aside>':'')+'</div>'}
function det(q){if(q.e2)return '<div class="fans"><p>'+esc(q.e2)+'</p></div>';var t=[];if(q.e)t.push('<p>'+esc(q.e)+'</p>');if(q.d)t.push('<p class="dt"><b>📖 En el temario'+(q.dh?' · '+esc(q.dh):'')+':</b> '+esc(q.d)+'</p>');return t.length?'<div class="fans">'+t.join('')+'</div>':''}
function qa(q){return q.cs?'':'<a href="'+qlink(q)+'" target="_blank" rel="noopener">📖 Ver en el temario</a>'}
function setFlag(it,v){it.flag=v;if(cur&&cur.done)return;var f=flags();if(v)f[it.q.id]=1;else delete f[it.q.id];jset('ex_flag',f)}
function render(){var c=cur,it=c.items[c.i],L='ABCD',q=it.q,lock=c.study&&it.ans>=0;
 var ans=c.items.filter(function(x){return x.ans>=0}).length,nfl=c.items.filter(function(x){return x.flag}).length;
 var h='<div class="exbar"><b>Pregunta '+(c.i+1)+' / '+c.items.length+'</b><span>'+ans+' contestadas'+(nfl?' · ⚑ '+nfl:'')+'</span><span class="clk">⏱ <b id="clock">'+fmt(Math.abs(c.left))+'</b>'+(c.total?'':' (sin límite)')+'</span><button id="fin" class="go">Terminar</button></div><div class="pbar"><i style="width:'+(ans/c.items.length*100)+'%"></i></div>';
 h+='<div class="qgrid">'+c.items.map(function(x,i){var st='';if(c.study&&x.ans>=0)st=x.ord[x.ans]===x.q.c?' okk':' koo';return '<button class="qn'+(x.part===2?' p2':'')+(i===c.i?' cur':'')+(x.ans>=0?' ans':'')+st+(x.flag?' flg':'')+'" data-i="'+i+'">'+(i+1)+'</button>'}).join('')+'</div>';
 var tp=topicOf(q.k),h0=h;h='';
 h+='<section class="pcard qcard"><div class="qmeta">'+(c.sim?'<i class="ptag">'+(it.part===2?'Parte 2 · Supuesto práctico':'Parte 1 · Teoría')+'</i> ':'')+(q.cs?'<b>'+esc(q.cs)+'</b> · pregunta '+q.n+' de 20':'B'+q.k.charAt(1)+' · Tema '+tp.t+' · <b>'+esc(tshort(q.k))+'</b>')+(q.x?' <i class="E">EXAMEN</i>':'')+(q.i?' <i class="I">IMPORTANTE</i>':'')+'</div><p class="qq">'+q.q+'</p><div class="opts">'
  +it.ord.map(function(oi,p){var cl=it.ans===p?' sel':'';if(lock){if(oi===q.c)cl=' good';else if(it.ans===p)cl=' bad'}return '<div class="opt'+cl+'"><button class="pick" data-p="'+p+'"><span class="L">'+L[p]+'</span><span class="ot">'+q.o[oi]+'</span></button></div>'}).join('')
  +'</div>';
 if(lock)h+='<div class="fb '+(it.ord[it.ans]===q.c?'g':'b')+'"><img class="owl" src="img/owl-'+(it.ord[it.ans]===q.c?'ok':'ko')+'.webp" alt="" width="56" height="56"><b>'+(it.ord[it.ans]===q.c?'✔ Correcto':'✘ Incorrecto')+'</b> '+det(q)+' '+qa(q)+'</div>';
 h+='<div class="row nav"><button id="prev"'+(c.i?'':' disabled')+'>← Anterior</button><button id="clr"'+(lock?' disabled':'')+'>Borrar respuesta</button><button id="flag">'+(it.flag?'🚩 Quitar marca':'⚑ Marcar')+'</button><button id="next"'+(c.i<c.items.length-1?'':' disabled')+'>Siguiente →</button></div><p class="hint">Atajos: 1-4 o A-D responden · ← → navegan · F marca</p></section>';
 h=h0+(it.part===2&&c.cs?caseWrap(c,h):h);var mm=document.querySelector('main');if(mm)mm.classList.toggle('wide',it.part===2&&!!c.cs);
 app.innerHTML=h;
 $$('.pick').forEach(function(b){b.onclick=function(){if(lock)return;it.ans=+b.dataset.p;render()}});
 $$('.qn').forEach(function(b){b.onclick=function(){c.i=+b.dataset.i;render()}});
 $('#prev').onclick=function(){c.i--;render()};$('#next').onclick=function(){c.i++;render()};
 $('#clr').onclick=function(){it.ans=-1;render()};$('#flag').onclick=function(){setFlag(it,!it.flag);render()};
 $('#fin').onclick=function(){var b=c.items.filter(function(x){return x.ans<0}).length,f=c.items.filter(function(x){return x.flag&&x.ans<0}).length;if((!b&&!f)||confirm('Te quedan '+b+' sin contestar'+(f?' ('+f+' marcadas para revisar)':'')+'. ¿Terminar el examen?'))finish(false)}}
function finish(auto){var c=cur;if(!c||c.done)return;c.done=true;window.__inExam=false;window.__plabel='';view='res';clearInterval(tick);
 var A=0,E=0,B=0,per={},pt={},fl=fails();
 c.items.forEach(function(it){var q=it.q,b=q.k.charAt(1);per[b]=per[b]||{a:0,e:0,b:0};pt[q.k]=pt[q.k]||{a:0,e:0,b:0};
  if(it.ans<0){B++;per[b].b++;pt[q.k].b++}else if(it.ord[it.ans]===q.c){A++;per[b].a++;pt[q.k].a++;if(!q.cs)delete fl[q.id]}else{E++;per[b].e++;pt[q.k].e++;if(!q.cs)fl[q.id]=1}});
 jset('ex_fail',fl);
 var fgm=flags();c.items.forEach(function(it){delete fgm[it.q.id]});jset('ex_flag',fgm);
 var sm=srsAll(),nw=Date.now();c.items.forEach(function(it){if(it.ans>=0&&!it.q.cs)srsUpd(sm,it.q.id,it.ord[it.ans]===it.q.c,nw)});jset('ex_srs',sm);addDay(A+E);
 var N=c.items.length,pts=A-E*c.pen,nota=Math.max(0,pts/N*10),notaSin=A/N*10,S2=c.sim?simScore(c):null;if(S2)nota=S2.total/10;
 var hs=hist();hs.push({t:Date.now(),a:A,e:E,b:B,n:N,nota:nota,m:c.mode});jset('ex_hist',hs.slice(-50));
 var qn=c.items.filter(function(it){return typeof it.q.id==='number'}).map(function(it){return it.q.id}),rx={t:Date.now(),qids:qn,a:A,e:E,b:B,nota:nota,m:c.mode,pen:c.pen?(c.pen===1/3?3:4):0};
 if(qn.length>=3){var rl=[];try{rl=JSON.parse(LS.g(AUTH.key('rx_last'))||'[]')}catch(e){}rl.unshift(rx);LS.s(AUTH.key('rx_last'),JSON.stringify(rl.slice(0,10)))}
 var used=Math.round((Date.now()-c.t0)/1000),pen=c.pen?(c.pen===1/3?'1/3':'1/4'):'';
 var h='<section class="pcard res"><h2>Resultado'+(auto?' <small class="ko">(se acabó el tiempo)</small>':'')+'</h2><div class="reshero">'+ring(nota/10,nota.toFixed(2),'sobre 10',nota>=5?'okr':'kor')+'<div><div class="verdict '+(nota>=5?'ok':'ko')+'">'+(nota>=8?'¡Excelente!':nota>=5?'Aprobado':nota>=3?'Te falta un empujón':'A seguir repasando')+'</div>'
  +(S2?'<p>Total: <b>'+S2.total.toFixed(1)+'</b> / 100 · '+(S2.ok1&&S2.ok2?'<b class="ok">APTO</b>':'<b class="ko">NO APTO</b>')+'</p>':'<p>'+(c.pen?'Puntos: <b>'+pts.toFixed(2)+'</b> sobre '+N+' <small>(= '+A+' aciertos − '+E+' errores × '+pen+')</small>':'Sin penalización: <b>'+A+'</b> de '+N)+'</p>')+(!S2&&c.pen?'<p class="sub">Sin penalización tendrías un <b>'+notaSin.toFixed(2)+'</b>.</p>':'')+(c.mode==='sup'?(function(){var sp=supScore(A,E,N);return '<p>Parte práctica: <b>'+sp.toFixed(1)+'</b> / 50 · '+(sp>=25?'<b class="ok">APTO</b>':'<b class="ko">NO APTO</b>')+' <small>(mínimo 25)</small></p>'})():'')+'</div></div>'
  +(S2?'<div class="simres">'+[['Parte 1 · Teoría',S2.p1,S2.ok1],['Parte 2 · Supuesto práctico',S2.p2,S2.ok2]].map(function(r){return '<div class="sp '+(r[2]?'g':'b')+'"><b>'+r[0]+'</b><span>'+r[1].g.toFixed(1)+' / 50</span><small>'+r[1].a+' ✔ · '+r[1].e+' ✘ · '+r[1].d.toFixed(2)+' puntos directos de '+r[1].n+' (mínimo 25 / 50)</small></div>'}).join('')+'</div><p class="sub">Cada parte vale 50: 25 en el mínimo (30 % de los puntos directos) y el resto proporcional. En el examen real el supuesto solo se corrige si superas la primera parte.</p>':'')
  +'<div class="stats"><span class="ok">✔ '+A+' aciertos</span><span class="ko">✘ '+E+' errores</span><span>○ '+B+' en blanco</span><span>⏱ '+fmt(used)+'</span></div>'
  +'<h3>Por tema</h3><div class="ptl">'+Object.keys(pt).sort().map(function(k){var x=pt[k],tot=x.a+x.e+x.b,tpc=k.indexOf('caso')>0?{t:'📋',title:'Supuesto práctico'}:topicOf(k);return '<div class="wk"><div class="wkt"><b>'+tpc.t+'</b> '+esc(tpc.title.length>48?tpc.title.slice(0,46)+'…':tpc.title)+'</div><div class="wkb"><i class="'+(x.a/tot>=.75?'g':x.a/tot>=.5?'m':'b')+'" style="width:'+Math.round(x.a/tot*100)+'%"></i></div><span class="wkp">'+x.a+'/'+tot+'</span></div>'}).join('')+'</div>'
  +'<table class="pt"><tr><th>Bloque</th><th>✔</th><th>✘</th><th>○</th></tr>'+Object.keys(per).sort().map(function(b){return '<tr><td>Bloque '+b+'</td><td>'+per[b].a+'</td><td>'+per[b].e+'</td><td>'+per[b].b+'</td></tr>'}).join('')+'</table>'
  +'<div class="row"><button id="again" class="go">Nuevo examen</button>'+(c.mode==='sup'?'<a class="chip go" href="practicas.html#supuestos">📋 Otro supuesto</a>':'')+'<button id="rf">Repetir solo las falladas/en blanco</button>'+(c.items.some(function(x){return x.flag})?'<button id="rm">Repasar las marcadas ⚑</button>':'')+'<button id="fcf">🃏 Flashcards de las falladas</button>'+(qn.length>=3&&window.AUTH&&AUTH.canSocial()?'<button id="shr">📤 Enviar a un compañero</button>':'')+'</div></section>';
 h+='<section class="pcard"><h2>Revisión</h2><div class="row"><label class="tchk"><input type="checkbox" id="onlyw" checked> Solo errores y en blanco</label><label class="tchk"><input type="checkbox" id="onlym"> Solo marcadas ⚑</label></div><div id="rev"></div></section>';
 app.innerHTML=h;window.scrollTo(0,0);
 function rev(){var w=$('#onlyw').checked,mk=$('#onlym').checked,L='ABCD';$('#rev').innerHTML=c.items.map(function(it,i){var q=it.q,ok=it.ans>=0&&it.ord[it.ans]===q.c;if(mk&&!it.flag)return '';if(w&&ok&&!mk)return '';
  return '<div class="rv '+(ok?'g':it.ans<0?'n':'b')+'"><div class="qmeta">#'+(i+1)+' · '+(q.cs?esc(q.cs):'B'+q.k.charAt(1)+' · Tema '+topicOf(q.k).t+' · '+esc(tshort(q.k)))+(q.x?' <i class="E">EXAMEN</i>':'')+(q.i?' <i class="I">IMPORTANTE</i>':'')+'<button class="fgb" data-i="'+i+'">'+(it.flag?'🚩':'⚑')+'</button></div><p class="qq">'+q.q+'</p>'
   +it.ord.map(function(oi,p){var good=oi===q.c,mine=p===it.ans;return '<div class="ro'+(good?' good':mine?' bad':'')+'"><b>'+L[p]+')</b> '+q.o[oi]+(good?' ✔':'')+(mine&&!good?' ✘ <small>(tu respuesta)</small>':'')+'</div>'}).join('')
   +(it.ans<0?'<div class="sub">Sin contestar</div>':'')+'<div class="why">'+(q.e||'')+' '+qa(q)+'</div></div>'}).join('')||'<p class="ok">¡Nada que mostrar con este filtro! 🎉</p>';
  $$('.fgb').forEach(function(b){b.onclick=function(){var it=c.items[+b.dataset.i];setFlag(it,!it.flag);b.textContent=it.flag?'🚩':'⚑'}})}
 rev();$('#onlyw').onchange=rev;$('#onlym').onchange=rev;
 $('#again').onclick=config;
 function sub(l){return l.map(function(it){return it.q})}
 $('#rf').onclick=function(){var l=sub(c.items.filter(function(it){return !(it.ans>=0&&it.ord[it.ans]===it.q.c)}));if(!l.length){alert('No hay falladas 🎉');return}start(shuf(l),c.total?Math.ceil(c.total/60*l.length/N):0,true,{pen:c.pen,study:true,mode:'rep'})}
 var rm=$('#rm');if(rm)rm.onclick=function(){start(shuf(sub(c.items.filter(function(it){return it.flag}))),0,true,{pen:c.pen,study:true,mode:'rep'})};
 var sh=$('#shr');if(sh)sh.onclick=function(){shareResult(rx)};
 $('#fcf').onclick=function(){var l=sub(c.items.filter(function(it){return !(it.ans>=0&&it.ord[it.ans]===it.q.c)}));if(!l.length){alert('No hay falladas 🎉');return}flash(shuf(l),{})}}

/* ---------- flashcards ---------- */
function flash(list,o){plab(list,'Con flashcards');view='flash';window.__inExam=true;var i=0,shown=false,res={ok:0,dd:0,ko:0},pk=-1,ord=null,L='ABCD';
 function mkOrd(q){var r=q.o.map(function(_,k){return k});if(!/anteriores|ninguna de|ambas|todas las|ninguna es|ambos/i.test(q.o.join(' ')))r=shuf(r);return r}
 function draw(){if(i>=list.length)return end();var q=list[i],tp=topicOf(q.k);if(!ord)ord=mkOrd(q);
  var good=pk>=0&&ord[pk]===q.c;
  var h='<div class="exbar"><b>Tarjeta '+(i+1)+' / '+list.length+'</b><span>✔ '+res.ok+' · ~ '+res.dd+' · ✘ '+res.ko+'</span><button id="fx">Salir</button></div><div class="pbar"><i style="width:'+(i/list.length*100)+'%"></i></div>'
   +'<section class="pcard fcard"><div class="qmeta">B'+q.k.charAt(1)+' · Tema '+tp.t+' · <b>'+esc(tshort(q.k))+'</b>'+(q.x?' <i class="E">EXAMEN</i>':'')+(q.i?' <i class="I">IMPORTANTE</i>':'')+'</div><p class="qq">'+q.q+'</p><div class="fopts">'
   +ord.map(function(oi,p){var c='';if(shown){if(oi===q.c)c=' good';else if(p===pk)c=' bad'}return '<button class="fo'+c+'" data-p="'+p+'"'+(shown?' disabled':'')+'><b>'+L[p]+')</b> '+q.o[oi]+(shown&&oi===q.c?' ✔':'')+(shown&&p===pk&&oi!==q.c?' ✘':'')+'</button>'}).join('')+'</div>';
  if(!shown)h+='<div class="row"><button id="show" class="ghost">No lo sé · ver respuesta</button></div><p class="hint">Elige una opción · teclas 1–4 · Espacio = no lo sé</p>';
  else h+=(pk<0?'<p class="sub">Sin contestar.</p>':'<p class="sub">'+(good?'✔ ¡Correcta!':'✘ Incorrecta')+'</p>')+det(q)+'<p>'+qa(q)+'</p>'+'<div class="row rate"><button class="r3" id="nx">Siguiente →</button>'+(good?'<button class="r2" data-r="2">~ Acerté dudando</button>':'')+'</div>';
  h+='</section>';app.innerHTML=h;
  $$('.fo').forEach(function(b){b.onclick=function(){pick(+b.dataset.p)}});
  var sh=$('#show');if(sh)sh.onclick=function(){pick(-1)};var nx=$('#nx');if(nx)nx.onclick=function(){next()};
  $('#fx').onclick=function(){if(confirm('¿Salir de las flashcards?')){end(true)}};
  $$('.rate button[data-r]').forEach(function(b){b.onclick=function(){rate(+b.dataset.r)}});
  var card=$('.fcard'),x0=null,y0=0,dx=0;
  if(card&&'ontouchstart' in window){if(shown)card.insertAdjacentHTML('beforeend','<p class="hint swh">Desliza para pasar a la siguiente</p>');
   card.addEventListener('touchstart',function(e){var t=e.touches[0];x0=t.clientX;y0=t.clientY;dx=0;card.style.transition='none'},{passive:true});
   card.addEventListener('touchmove',function(e){if(x0===null||!shown)return;var t=e.touches[0];dx=t.clientX-x0;if(Math.abs(t.clientY-y0)>Math.abs(dx))return;card.style.transform='translateX('+dx+'px) rotate('+dx/30+'deg)';card.style.opacity=Math.max(.4,1-Math.abs(dx)/400)},{passive:true});
   card.addEventListener('touchend',function(){if(x0===null)return;var d=dx;x0=null;card.style.transition='transform .18s,opacity .18s';
    if(!shown||Math.abs(d)<70){card.style.transform='';card.style.opacity='';return}
    card.style.transform='translateX('+(d>0?'110%':'-110%')+')';card.style.opacity='0';setTimeout(next,160)})}}
 function pick(p){if(shown)return;pk=p;shown=true;draw();window.scrollTo(0,0)}
 function next(){var q=list[i];rate(pk>=0&&ord[pk]===q.c?3:1)}
 function rate(r){var q=list[i],m=srsAll(),fl=fails(),now=Date.now();srsUpd(m,q.id,r>1,now);if(r===2&&m[q.id])m[q.id][0]*=0.5;jset('ex_srs',m);if(r===1)fl[q.id]=1;else if(r===3)delete fl[q.id];jset('ex_fail',fl);addDay(1);
  if(r===3)res.ok++;else if(r===2)res.dd++;else res.ko++;i++;shown=false;pk=-1;ord=null;draw()}
 flash.rate=rate;flash.pick=pick;flash.next=next;flash.reveal=function(){if(!shown)pick(-1)};flash.on=function(){return view==='flash'&&i<list.length};flash.shown=function(){return shown};flash.nopt=function(){return list[i].o.length};
 function end(early){view=null;window.__inExam=false;if(early&&i===0)return config();
  app.innerHTML='<section class="pcard res"><h2>🃏 Tanda terminada</h2><div class="stats"><span class="ok">✔ '+res.ok+' la sabía</span><span>~ '+res.dd+' dudosas</span><span class="ko">✘ '+res.ko+' no la sabía</span></div><p class="sub">Las que fallaste o dudaste volverán a salir antes en tu repaso inteligente.</p><div class="row"><button id="again" class="go">Volver</button>'+(res.ko+res.dd?'<button id="rpt">Repetir las que no sabía</button>':'')+'</div></section>';
  $('#again').onclick=config;var rp=$('#rpt');if(rp)rp.onclick=function(){var ids=list.slice(0,i);flash(shuf(ids.filter(function(q){return fails()[q.id]})),o)}}
 draw()}

/* ---------- modo escucha ---------- */
function voiceList(){return S?S.getVoices().filter(function(v){return /^es/i.test(v.lang)}):[]}
function speak(text,cb){if(!S){cb&&cb();return}S.cancel();var u=new SpeechSynthesisUtterance(text);u.lang='es-ES';u.rate=parseFloat(LS.g('tts_rate'))||1;var vn=LS.g('tts_voice'),vs=voiceList(),v=vs.filter(function(x){return x.name===vn})[0]||vs.filter(function(x){return /^es[-_]ES/i.test(x.lang)})[0]||vs[0];if(v){u.voice=v;u.lang=v.lang}
 var done=false;function fin(){if(done)return;done=true;cb&&cb()}u.onend=fin;u.onerror=function(e){if(e.error!=='interrupted'&&e.error!=='canceled')fin()};S.speak(u)}
function listen(list,o){if(!S){alert('Tu navegador no admite lectura en voz alta.');return config()}plab(list,'En modo escucha');
 view='listen';window.__inExam=true;var i=0,L='ABCD',res={a:0,e:0},auto=LS.g('ex_lauto')!=='0',got=false,gen=0;
 var items=list.map(function(q){var ord=q.o.map(function(_,k){return k});if(!/anteriores|ninguna de|ambas|todas las|ninguna es|ambos/i.test(q.o.join(' ')))ord=shuf(ord);return {q:q,ord:ord}});
 function say(t,cb){var g=++gen;speak(t,function(){if(g===gen&&cb)cb()})}
 function readQ(){var it=items[i],t='Pregunta '+(i+1)+'. '+it.q.q.replace(/<[^>]+>/g,'')+'. ';it.ord.forEach(function(oi,p){t+='Opción '+L[p]+': '+it.q.o[oi].replace(/<[^>]+>/g,'')+'. '});say(t)}
 function draw(){if(i>=items.length)return end();got=false;var it=items[i],q=it.q;
  app.innerHTML='<div class="exbar"><b>🎧 Pregunta '+(i+1)+' / '+items.length+'</b><span>✔ '+res.a+' · ✘ '+res.e+'</span><button id="lx">Salir</button></div><div class="pbar"><i style="width:'+(i/items.length*100)+'%"></i></div>'
   +'<section class="pcard qcard"><div class="qmeta">B'+q.k.charAt(1)+' · Tema '+topicOf(q.k).t+' · '+esc(tshort(q.k))+(q.x?' <i class="E">EXAMEN</i>':'')+(q.i?' <i class="I">IMPORTANTE</i>':'')+'</div><p class="qq">'+q.q+'</p><div class="opts">'
   +it.ord.map(function(oi,p){return '<div class="opt"><button class="pick" data-p="'+p+'"><span class="L">'+L[p]+'</span><span class="ot">'+q.o[oi]+'</span></button></div>'}).join('')+'</div>'
   +'<div class="row nav"><button id="rep">🔁 Repetir</button><button id="skip">⏭ Siguiente</button><label class="f sm">Velocidad<select id="spd">'+[0.8,1,1.2,1.5,1.8].map(function(x){return '<option value="'+x+'"'+(x===(parseFloat(LS.g('tts_rate'))||1)?' selected':'')+'>'+x+'×</option>'}).join('')+'</select></label></div>'
   +'<label class="tchk"><input type="checkbox" id="auto"'+(auto?' checked':'')+'> Pasar sola a la siguiente tras la corrección</label><p class="hint">Pulsa A–D (o 1–4) para responder · R repite · N salta</p><div id="lfb"></div></section>';
  $$('.pick').forEach(function(b){b.onclick=function(){answer(+b.dataset.p)}});
  $('#rep').onclick=readQ;$('#skip').onclick=function(){next()};$('#lx').onclick=function(){end(true)};
  $('#spd').onchange=function(){LS.s('tts_rate',$('#spd').value);readQ()};$('#auto').onchange=function(){auto=$('#auto').checked;LS.s('ex_lauto',auto?'1':'0')};
  readQ()}
 function answer(p){if(got)return;got=true;var it=items[i],q=it.q,ok=it.ord[p]===q.c;
  var m=srsAll(),fl=fails();srsUpd(m,q.id,ok,Date.now());jset('ex_srs',m);if(ok)delete fl[q.id];else fl[q.id]=1;jset('ex_fail',fl);addDay(1);if(ok)res.a++;else res.e++;
  $$('.opt').forEach(function(d,k){if(it.ord[k]===q.c)d.classList.add('good');else if(k===p)d.classList.add('bad')});
  var pos=it.ord.indexOf(q.c);$('#lfb').innerHTML='<div class="fb '+(ok?'g':'b')+'"><b>'+(ok?'✔ Correcto':'✘ Incorrecto')+'</b> '+(ok?'':'La correcta es la '+L[pos]+'. ')+(q.e?esc(q.e):'')+'</div>';
  say((ok?'Correcto. ':'Incorrecto. La correcta es la '+L[pos]+': '+q.o[q.c].replace(/<[^>]+>/g,'')+'. ')+(q.e||''),function(){if(auto)setTimeout(next,500)})}
 function next(){gen++;if(S)S.cancel();i++;draw()}
 listen.on=function(){return view==='listen'};listen.ans=function(p){if(p>=0&&p<4)answer(p)};listen.rep=readQ;listen.next=function(){if(i<items.length)next()};
 function end(early){gen++;if(S)S.cancel();view=null;window.__inExam=false;if(early&&i===0)return config();
  app.innerHTML='<section class="pcard res"><h2>🎧 Sesión terminada</h2><div class="stats"><span class="ok">✔ '+res.a+' aciertos</span><span class="ko">✘ '+res.e+' errores</span></div><div class="row"><button id="again" class="go">Volver</button></div></section>';$('#again').onclick=config}
 if(S.getVoices().length===0&&S.addEventListener)S.addEventListener('voiceschanged',function(){},{once:true});
 draw()}

/* ---------- atajos de teclado ---------- */
document.addEventListener('keydown',function(e){if(/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName)||e.ctrlKey||e.metaKey||e.altKey)return;var k=e.key.toLowerCase();
 if(view==='exam'&&cur&&!cur.done){var it=cur.items[cur.i],idx='1234'.indexOf(k);if(idx<0)idx='abcd'.indexOf(k);
  if(idx>=0){if(cur.study&&it.ans>=0)return;it.ans=idx;render()}else if(k==='arrowright'&&cur.i<cur.items.length-1){cur.i++;render()}else if(k==='arrowleft'&&cur.i>0){cur.i--;render()}else if(k==='f'){setFlag(it,!it.flag);render()}}
 else if(view==='flash'&&flash.on()){if(k===' '||k==='enter'){e.preventDefault();if(!flash.shown())flash.reveal();else flash.next()}else if(!flash.shown()&&'1234'.indexOf(k)>=0&&k&&+k<=flash.nopt())flash.pick(+k-1);else if(flash.shown()&&k==='2')flash.rate(2)}
 else if(view==='listen'&&listen.on()){var j='1234'.indexOf(k);if(j<0)j='abcd'.indexOf(k);if(j>=0)listen.ans(j);else if(k==='r')listen.rep();else if(k==='n')listen.next()}});
window.addEventListener('beforeunload',function(e){if(view==='exam'&&cur&&!cur.done){e.preventDefault();e.returnValue=''}});
window.addEventListener('pagehide',function(){try{if(S)S.cancel()}catch(e){}});
})();
