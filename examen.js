(function(){
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var LS={g:function(k){try{return localStorage.getItem(k)}catch(e){return null}},s:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
var uk=function(n){return (window.AUTH&&AUTH.key?AUTH.key(n):n)};
var app=$('#app'),Q=[],T=[],cur=null,tick=null;
var BL={1:'Bloque 1 · Organización del Estado y Administración',2:'Bloque 2 · Sistemas y comunicaciones (base)',3:'Bloque 3 · Datos y programación',4:'Bloque 4 · Redes, seguridad y sistemas'};
function esc(s){return String(s).replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
function shuf(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function fmt(s){var m=Math.floor(s/60),x=s%60;return (m<10?'0':'')+m+':'+(x<10?'0':'')+x}
function hist(){try{return JSON.parse(LS.g(uk('ex_hist'))||'[]')}catch(e){return[]}}
function seen(){try{return JSON.parse(LS.g(uk('ex_seen'))||'{}')}catch(e){return{}}}
function fails(){try{return JSON.parse(LS.g(uk('ex_fail'))||'{}')}catch(e){return{}}}
Promise.all([fetch('data/preguntas.json').then(function(r){return r.json()}),fetch('data/topics.json').then(function(r){return r.json()})]).then(function(a){
 Q=a[0].map(function(q,i){q.id=i;return q});T=a[1];config()});


/* ---------- Curva del olvido (repetición espaciada) ---------- */
var DAY=864e5;
function srsAll(){try{return JSON.parse(LS.g(uk('ex_srs'))||'{}')}catch(e){return{}}}
function Rt(c,now){return Math.pow(0.9,(now-c[2])/DAY/c[0])}              // retención estimada: 90% cuando ha pasado S días
function srsUpd(m,id,ok,now){var c=m[id];
 if(!c){m[id]=ok?[1.5,2.5,now,1,0]:[0.4,2.2,now,1,1];return}
 var R=Rt(c,now);
 if(ok){c[0]=c[0]*(1+c[1]*(1.4-Math.min(R,1)));c[1]=Math.min(3,c[1]+0.05)}
 else{c[0]=Math.max(0.3,c[0]*0.35);c[1]=Math.max(1.3,c[1]-0.2);c[4]++}
 c[2]=now;c[3]++}
function srsPanel(){var m=srsAll(),now=Date.now(),ids=Object.keys(m);
 if(!ids.length)return '<section class="pcard"><h2>🧠 Tu curva del olvido</h2><p class="sub">Aún no hay datos. Haz exámenes: cada pregunta que contestes (acierto o error) entra en tu modelo de memoria y la web calcula cuándo te conviene repasarla. Usa el modo <b>🧠 Repaso inteligente</b> para que te pregunte justo lo que estás a punto de olvidar.</p></section>';
 var Rs=ids.map(function(i){return Rt(m[i],now)}),mean=Rs.reduce(function(a,b){return a+b},0)/ids.length,due=Rs.filter(function(r){return r<0.9}).length;
 var fc=[0,0,0,0,0,0,0];ids.forEach(function(i){var c=m[i],dd=(c[2]+c[0]*DAY-now)/DAY;if(dd>0&&dd<7)fc[Math.floor(dd)]++});
 var pts=[];for(var d=0;d<=30;d++){var s=0;ids.forEach(function(i){s+=Rt(m[i],now+d*DAY)});pts.push(s/ids.length)}
 var W=300,H=90,line=pts.map(function(v,d){return (d/30*W).toFixed(1)+','+(H-v*H).toFixed(1)}).join(' ');
 var byB={};ids.forEach(function(i){var q=Q[+i];if(!q)return;var b=q.k.charAt(1);(byB[b]=byB[b]||[]).push(Rt(m[i],now))});
 var mx=Math.max.apply(null,fc.concat([1]));
 var h='<section class="pcard"><h2>🧠 Tu curva del olvido</h2><div class="stats"><span><b>'+ids.length+'</b> preguntas en tu modelo</span><span>Retención media estimada: <b class="'+(mean>=.8?'ok':mean>=.6?'':'ko')+'">'+Math.round(mean*100)+'%</b></span><span><b class="'+(due?'ko':'ok')+'">'+due+'</b> toca repasarlas ya</span></div>';
 h+='<div class="srsg"><div><div class="sub">Retención media prevista si no repasas (30 días)</div><svg viewBox="0 0 '+W+' '+(H+14)+'" class="srsv"><line x1="0" y1="'+(H*0.1)+'" x2="'+W+'" y2="'+(H*0.1)+'" stroke="#999" stroke-dasharray="3"/><polyline fill="none" stroke="var(--ac)" stroke-width="2.5" points="'+line+'"/><text x="2" y="'+(H+11)+'" font-size="9" fill="currentColor">hoy</text><text x="'+(W-34)+'" y="'+(H+11)+'" font-size="9" fill="currentColor">+30 días</text><text x="'+(W-60)+'" y="'+(H*0.1-3)+'" font-size="9" fill="#999">90%</text></svg></div>';
 h+='<div><div class="sub">Repasos que vencen en los próximos 7 días</div><div class="fcb">'+fc.map(function(v,d){return '<div><i style="height:'+Math.round(v/mx*60)+'px"></i><small>'+v+'</small><small>'+(d?'+'+d+'d':'hoy')+'</small></div>'}).join('')+'</div></div></div>';
 h+='<div class="sub">Retención por bloque: '+Object.keys(byB).sort().map(function(b){var a=byB[b].reduce(function(x,y){return x+y},0)/byB[b].length;return '<b>B'+b+'</b> '+Math.round(a*100)+'%'}).join(' · ')+' <button id="srsreset" class="lnk">borrar mi modelo</button></div></section>';
 return h}

/* ---------- configuración ---------- */
function config(){clearInterval(tick);cur=null;
 var cfg=JSON.parse(LS.g(uk('ex_cfg'))||'{}'),tp=new URLSearchParams(location.search).get('t'),sel=(tp&&T.some(function(t){return t.key===tp})?[tp]:null)||cfg.sel||T.map(function(t){return t.key}),n=cfg.n||20,mins=cfg.mins==null?Math.round(n*1.2):cfg.mins;
 var cnt={};Q.forEach(function(q){cnt[q.k]=(cnt[q.k]||0)+1});var fl=fails(),nf=Object.keys(fl).length;
 var h='<p class="sub">'+Q.length+' preguntas tipo test (Anki + generadas del resumen, 4 opciones). <b>Nota = (aciertos − errores/3) sobre 10</b>: cada error resta 1/3 de acierto y las no contestadas no puntúan.</p>';
 h+=srsPanel();
 h+='<section class="pcard"><h2>1 · Temas</h2><div class="row"><button id="all">Todos</button><button id="none">Ninguno</button>'+[1,2,3,4].map(function(b){return '<button class="bsel" data-b="'+b+'">Bloque '+b+'</button>'}).join('')+'</div>';
 [1,2,3,4].forEach(function(b){h+='<details open><summary><b>'+BL[b]+'</b></summary><div class="tgrid">'+T.filter(function(t){return t.b===b}).map(function(t){return '<label class="tchk"><input type="checkbox" class="tk" value="'+t.key+'" '+(sel.indexOf(t.key)>=0?'checked':'')+'> <b>'+t.t+'</b> '+esc(t.title.length>70?t.title.slice(0,68)+'…':t.title)+' <small>('+(cnt[t.key]||0)+')</small></label>'}).join('')+'</div></details>'});
 h+='</section><section class="pcard"><h2>2 · Opciones</h2><div class="row">'
  +'<label class="f">Nº de preguntas<input type="number" id="n" min="1" max="500" value="'+n+'"></label>'
  +'<label class="f">Tiempo (min, 0 = sin límite)<input type="number" id="mins" min="0" max="300" value="'+mins+'"></label>'
  +'<label class="f">Modo<select id="mode"><option value="rnd">Aleatorio (prioriza las nuevas)</option><option value="srs">🧠 Repaso inteligente (curva del olvido)</option></select></label><label class="f">Banco<select id="bank"><option value="all">Anki + generadas del resumen</option><option value="anki">Solo Anki</option><option value="gen">Solo generadas</option></select></label><label class="f">Filtro<select id="flt"><option value="all">Todas las preguntas</option><option value="ei">Solo EXAMEN + IMPORTANTE</option><option value="x">Solo EXAMEN</option><option value="i">Solo IMPORTANTE</option>'+(nf?'<option value="fail">Solo mis falladas ('+nf+')</option>':'')+'</select></label></div>'
  +'<label class="tchk"><input type="checkbox" id="shf" checked> Mezclar el orden de las opciones</label> <label class="tchk"><input type="checkbox" id="prio" checked> Dar prioridad a EXAMEN/IMPORTANTE al sortear</label>'
  +'<div class="row"><button id="start" class="go">▶ Empezar examen</button><span id="avail" class="sub"></span></div></section>';
 var hs=hist();if(hs.length){h+='<section class="pcard"><h2>Historial</h2><div class="hist">'+hs.slice(-10).reverse().map(function(x){return '<div><b class="'+(x.nota>=5?'ok':'ko')+'">'+x.nota.toFixed(2)+'</b> · '+new Date(x.t).toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'})+' · ✔'+x.a+' ✘'+x.e+' ○'+x.b+' de '+x.n+'</div>'}).join('')+'</div></section>'}
 app.innerHTML=h;var rs=$('#srsreset');if(rs)rs.onclick=function(){if(confirm('¿Borrar tu modelo de memoria (curva del olvido)?')){LS.s(uk('ex_srs'),'{}');config()}};
 function pool(){var ks=$$('.tk:checked').map(function(c){return c.value}),f=$('#flt').value;
  var bk=$('#bank').value;return Q.filter(function(q){if(ks.indexOf(q.k)<0)return false;if(bk==='anki'&&q.g)return false;if(bk==='gen'&&!q.g)return false;if(f==='ei')return q.x||q.i;if(f==='x')return q.x;if(f==='i')return q.i;if(f==='fail')return !!fl[q.id];return true})}
 function av(){var p=pool(),sn=seen(),m0=srsAll(),n0=Date.now(),dc=p.filter(function(q){return m0[q.id]&&Rt(m0[q.id],n0)<0.9}).length;$('#avail').innerHTML=p.length+' disponibles · <b>'+p.filter(function(q){return !sn[q.id]}).length+'</b> aún sin ver · <b>'+dc+'</b> vencidas para repasar <button id="fgt" class="lnk">olvidar vistas</button>';var f=$('#fgt');if(f)f.onclick=function(){LS.s(uk('ex_seen'),'{}');av()}}av();$('#bank').onchange=av;
 $$('.tk').forEach(function(c){c.onchange=av});$('#flt').onchange=av;
 $('#all').onclick=function(){$$('.tk').forEach(function(c){c.checked=true});av()};$('#none').onclick=function(){$$('.tk').forEach(function(c){c.checked=false});av()};
 $$('.bsel').forEach(function(b){b.onclick=function(){$$('.tk').forEach(function(c){c.checked=c.value.indexOf('b'+b.dataset.b+'t')===0});av()}});
 $('#n').oninput=function(){$('#mins').value=Math.max(1,Math.round($('#n').value*1.2))};
 $('#start').onclick=function(){var p=pool(),n=Math.max(1,Math.min(+$('#n').value||20,p.length));if(!p.length){alert('No hay preguntas con esos filtros');return}
  LS.s(uk('ex_cfg'),JSON.stringify({sel:$$('.tk:checked').map(function(c){return c.value}),n:+$('#n').value,mins:+$('#mins').value}));
  if($('#mode').value==='srs'){var m=srsAll(),now=Date.now(),dueL=p.filter(function(q){return m[q.id]&&Rt(m[q.id],now)<0.9}).sort(function(a,b){return Rt(m[a.id],now)-Rt(m[b.id],now)}),
    newL=shuf(p.filter(function(q){return !m[q.id]})).sort(function(a,b){return (b.x+b.i>0)-(a.x+a.i>0)}),okL=p.filter(function(q){return m[q.id]&&Rt(m[q.id],now)>=0.9}).sort(function(a,b){return Rt(m[a.id],now)-Rt(m[b.id],now)}),
    nd=Math.min(dueL.length,Math.ceil(n*0.7)),pk=dueL.slice(0,nd);pk=pk.concat(newL.slice(0,n-pk.length));if(pk.length<n)pk=pk.concat(dueL.slice(nd,nd+n-pk.length));if(pk.length<n)pk=pk.concat(okL.slice(0,n-pk.length));
    var sn0=seen();pk.forEach(function(q){sn0[q.id]=1});LS.s(uk('ex_seen'),JSON.stringify(sn0));return start(shuf(pk),+$('#mins').value,$('#shf').checked)}
  var pr=$('#prio').checked,sn=seen(),U=p.filter(function(q){return !sn[q.id]}),S=p.filter(function(q){return sn[q.id]});
  function samp(arr,m){if(!pr)return shuf(arr).slice(0,m);var hi=shuf(arr.filter(function(q){return q.x||q.i})),lo=shuf(arr.filter(function(q){return !(q.x||q.i)})),r=[];
   while(r.length<m&&(hi.length||lo.length)){var useA=hi.length&&(!lo.length||Math.random()<2*hi.length/(2*hi.length+lo.length));r.push(useA?hi.shift():lo.shift())}return r}
  var pick=samp(U,n);if(pick.length<n)pick=pick.concat(samp(S,n-pick.length));pick=shuf(pick);
  pick.forEach(function(q){sn[q.id]=1});LS.s(uk('ex_seen'),JSON.stringify(sn));
  start(pick,+$('#mins').value,$('#shf').checked)}}

/* ---------- examen ---------- */
function start(list,mins,shuffleOpts){
 var items=list.map(function(q){var ord=q.o.map(function(_,i){return i});
  if(shuffleOpts&&!/anteriores|ninguna de|ambas|todas las|ninguna es|ambos/i.test(q.o.join(' ')))ord=shuf(ord);
  return {q:q,ord:ord,ans:-1,flag:false}});
 cur={items:items,i:0,total:mins*60,left:mins*60,t0:Date.now()};render();
 clearInterval(tick);tick=setInterval(function(){if(!cur||cur.done)return;var el=Math.round((Date.now()-cur.t0)/1000);cur.left=cur.total?cur.total-el:el;var t=$('#clock');if(t)t.textContent=fmt(Math.abs(cur.left));
  if(cur.total&&cur.left<=60&&t)t.classList.add('ko');if(cur.total&&cur.left<=0){finish(true)}},500)}
function render(){var c=cur,it=c.items[c.i],L='ABCD',q=it.q;
 var ans=c.items.filter(function(x){return x.ans>=0}).length;
 var h='<div class="exbar"><b>Pregunta '+(c.i+1)+' / '+c.items.length+'</b><span>'+ans+' contestadas</span><span class="clk">⏱ <b id="clock">'+fmt(Math.abs(c.left))+'</b>'+(c.total?'':' (sin límite)')+'</span><button id="fin" class="go">Terminar</button></div>';
 h+='<div class="qgrid">'+c.items.map(function(x,i){return '<button class="qn'+(i===c.i?' cur':'')+(x.ans>=0?' ans':'')+(x.flag?' flg':'')+'" data-i="'+i+'">'+(i+1)+'</button>'}).join('')+'</div>';
 h+='<section class="pcard"><div class="qmeta">'+'B'+q.k.charAt(1)+' · Tema '+T.filter(function(t){return t.key===q.k})[0].t+' · '+(q.x?' <i class="E">EXAMEN</i>':'')+(q.i?' <i class="I">IMPORTANTE</i>':'')+'</div><p class="qq">'+q.q+'</p><div class="opts">'
  +it.ord.map(function(oi,p){return '<div class="opt'+(it.ans===p?' sel':'')+'"><button class="pick" data-p="'+p+'"><span class="L">'+L[p]+'</span><span class="ot">'+q.o[oi]+'</span></button></div>'}).join('')
  +'</div><div class="row"><button id="prev"'+(c.i?'':' disabled')+'>← Anterior</button><button id="clr">Borrar respuesta</button><button id="flag">'+(it.flag?'🚩 Quitar marca':'⚑ Marcar para revisar')+'</button><button id="next"'+(c.i<c.items.length-1?'':' disabled')+'>Siguiente →</button></div></section>';
 app.innerHTML=h;
 $$('.pick').forEach(function(b){b.onclick=function(){it.ans=+b.dataset.p;if(c.i<c.items.length-1&&false)c.i++;render()}});
 $$('.qn').forEach(function(b){b.onclick=function(){c.i=+b.dataset.i;render()}});
 $('#prev').onclick=function(){c.i--;render()};$('#next').onclick=function(){c.i++;render()};
 $('#clr').onclick=function(){it.ans=-1;render()};$('#flag').onclick=function(){it.flag=!it.flag;render()};
 $('#fin').onclick=function(){var b=c.items.filter(function(x){return x.ans<0}).length;if(!b||confirm('Te quedan '+b+' sin contestar (no restan). ¿Terminar el examen?'))finish(false)}}
function finish(auto){var c=cur;if(!c||c.done)return;c.done=true;clearInterval(tick);
 var A=0,E=0,B=0,per={},fl=fails();
 c.items.forEach(function(it){var q=it.q,b=q.k.charAt(1);per[b]=per[b]||{a:0,e:0,b:0};
  if(it.ans<0){B++;per[b].b++}else if(it.ord[it.ans]===q.c){A++;per[b].a++;delete fl[q.id]}else{E++;per[b].e++;fl[q.id]=1}});
 LS.s(uk('ex_fail'),JSON.stringify(fl));
 var sm=srsAll(),nw=Date.now();c.items.forEach(function(it){if(it.ans>=0)srsUpd(sm,it.q.id,it.ord[it.ans]===it.q.c,nw)});LS.s(uk('ex_srs'),JSON.stringify(sm));
 var N=c.items.length,pts=A-E/3,nota=Math.max(0,pts/N*10);
 var hs=hist();hs.push({t:Date.now(),a:A,e:E,b:B,n:N,nota:nota});LS.s(uk('ex_hist'),JSON.stringify(hs.slice(-50)));
 var used=Math.round((Date.now()-c.t0)/1000);
 var h='<section class="pcard res"><h2>Resultado'+(auto?' <small class="ko">(se acabó el tiempo)</small>':'')+'</h2><div class="nota '+(nota>=5?'ok':'ko')+'">'+nota.toFixed(2)+' <small>/ 10</small></div>'
  +'<p>Puntos: <b>'+pts.toFixed(2)+'</b> sobre '+N+' &nbsp; <small>(= '+A+' aciertos − '+E+' errores ÷ 3)</small></p>'
  +'<div class="stats"><span class="ok">✔ '+A+' aciertos</span><span class="ko">✘ '+E+' errores</span><span>○ '+B+' en blanco</span><span>⏱ '+fmt(used)+'</span></div>'
  +'<table class="pt"><tr><th>Bloque</th><th>✔</th><th>✘</th><th>○</th></tr>'+Object.keys(per).sort().map(function(b){return '<tr><td>Bloque '+b+'</td><td>'+per[b].a+'</td><td>'+per[b].e+'</td><td>'+per[b].b+'</td></tr>'}).join('')+'</table>'
  +'<div class="row"><button id="again" class="go">Nuevo examen</button><button id="rf">Repetir solo las falladas/en blanco</button></div></section>';
 h+='<section class="pcard"><h2>Revisión</h2><div class="row"><label class="tchk"><input type="checkbox" id="onlyw" checked> Mostrar solo errores y en blanco</label></div><div id="rev"></div></section>';
 app.innerHTML=h;
 function rev(){var w=$('#onlyw').checked,L='ABCD';$('#rev').innerHTML=c.items.map(function(it,i){var q=it.q,ok=it.ans>=0&&it.ord[it.ans]===q.c;if(w&&ok)return '';
  return '<div class="rv '+(ok?'g':it.ans<0?'n':'b')+'"><div class="qmeta">#'+(i+1)+' · B'+q.k.charAt(1)+' · Tema '+T.filter(function(t){return t.key===q.k})[0].t+(q.x?' <i class="E">EXAMEN</i>':'')+(q.i?' <i class="I">IMPORTANTE</i>':'')+'</div><p class="qq">'+q.q+'</p>'
   +it.ord.map(function(oi,p){var good=oi===q.c,mine=p===it.ans;return '<div class="ro'+(good?' good':mine?' bad':'')+'"><b>'+L[p]+')</b> '+q.o[oi]+(good?' ✔':'')+(mine&&!good?' ✘ <small>(tu respuesta)</small>':'')+'</div>'}).join('')
   +(it.ans<0?'<div class="sub">Sin contestar</div>':'')+'<div class="why">'+(q.e||'')+(q.p?'<br><small><i>('+esc(q.p)+')</i></small>':'')+'</div></div>'}).join('')||'<p class="ok">¡Sin errores! 🎉</p>'}
 rev();$('#onlyw').onchange=rev;
 $('#again').onclick=config;
 $('#rf').onclick=function(){var l=c.items.filter(function(it){return !(it.ans>=0&&it.ord[it.ans]===it.q.c)}).map(function(it){return it.q});if(!l.length){alert('No hay falladas 🎉');return}start(shuf(l),c.total?Math.ceil(c.total/60*l.length/N):0,true)}}
window.addEventListener('beforeunload',function(e){if(cur&&!cur.done){e.preventDefault();e.returnValue=''}});
})();
