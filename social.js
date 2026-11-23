/* Compañeros de estudio: perfil con imagen, lista, presencia, estadísticas compartidas, chat y test conjuntos. */
(function(){
var app=document.getElementById('app'),chatw=document.getElementById('chatw'),modal=document.getElementById('modal');
var addMsg={c:'sub',t:''},S=null,chat=null,pollS=null,pollC=null,imgCache={},MODE={rnd:'Aleatorio',srs:'Repaso',weak:'Puntos débiles',sim:'Simulacro',sup:'Supuesto',rep:'Repaso',flash:'Flashcards'};
function $(i){return document.getElementById(i)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function api(p,o){return AUTH.api(p,o)}
function J(o){return JSON.stringify(o)}
function ini(n){return esc((n||'?').trim().charAt(0).toUpperCase())}
function av(u,cls){return u.avatar?'<img class="av '+(cls||'')+'" src="'+esc(u.avatar)+'" alt="">':'<span class="av ph '+(cls||'')+'">'+ini(u.name)+'</span>'}
function ago(t){if(!t)return '';var s=Math.max(0,(Date.now()-t)/1000);if(s<90)return 'hace un momento';if(s<3600)return 'hace '+Math.round(s/60)+' min';if(s<86400)return 'hace '+Math.round(s/3600)+' h';return 'hace '+Math.round(s/86400)+' d'}
function hhmm(t){var d=new Date(t),n=new Date(),h=('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);return d.toDateString()===n.toDateString()?h:d.toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit'})+' '+h}
function toast(t){var e=document.createElement('div');e.className='stoast';e.textContent=t;document.body.appendChild(e);setTimeout(function(){e.remove()},2600)}

/* ---------- imágenes (perfil y capturas) ---------- */
function loadImg(file){return new Promise(function(res,rej){var u=URL.createObjectURL(file),i=new Image();i.onload=function(){URL.revokeObjectURL(u);res(i)};i.onerror=function(){URL.revokeObjectURL(u);rej(new Error('No se pudo leer la imagen'))};i.src=u})}
function shrink(file,o){return loadImg(file).then(function(im){var w=im.naturalWidth,h=im.naturalHeight,c=document.createElement('canvas'),x=c.getContext('2d'),q=o.q,side=o.max;
 function draw(){if(o.square){var m=Math.min(w,h);c.width=c.height=side;x.drawImage(im,(w-m)/2,(h-m)/2,m,m,0,0,side,side)}else{var k=Math.min(1,side/Math.max(w,h));c.width=Math.round(w*k);c.height=Math.round(h*k);x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height)}}
 for(var n=0;n<8;n++){draw();var d=c.toDataURL('image/jpeg',q);if(d.length<=o.limit)return d;q=Math.max(.4,q-.1);side=Math.round(side*.85)}
 throw new Error('La imagen es demasiado grande')})}

/* ---------- carga ---------- */
function load(background){return api('/api/social').then(function(r){var input=$('addu');
 if(background===true && input && (document.activeElement===input || input.value.trim()))return;
 S=r;render();if(chat)refreshChatHead()}).catch(function(e){if(!S)app.innerHTML='<section class="pcard"><p class="ko">'+esc(e.message)+'</p></section>'})}
function render(){
 if(!S)return;var me=S.me,h='';
 h+='<section class="pcard prof"><h2>Mi perfil</h2><div class="pr"><button class="avbtn" id="avb" title="Cambiar imagen">'+av(me,'big')+'<span class="avc">📷</span></button><div><b class="pn">'+esc(me.name)+'</b><div class="row tight"><button id="avc">Cambiar imagen</button>'+(me.avatar?'<button id="avx">Quitar</button>':'')+'</div></div></div><input type="file" id="avf" accept="image/*" hidden>'
  +'<h3>Privacidad</h3><p class="sub">Solo te ven tus compañeros aceptados. Puedes cambiarlo cuando quieras.</p>'
  +'<label class="sw"><input type="checkbox" id="p1"'+(me.share_online?' checked':'')+'><span></span> Mostrar cuándo estoy conectado</label>'
  +'<label class="sw"><input type="checkbox" id="p2"'+(me.share_topic?' checked':'')+'><span></span> Mostrar qué tema estoy repasando</label>'
  +'<label class="sw"><input type="checkbox" id="p3"'+(me.share_stats?' checked':'')+'><span></span> Compartir mis estadísticas de exámenes y progreso</label></section>';
 h+='<section class="pcard"><h2>Añadir compañero</h2><form id="addf" class="row"><div class="f grow acw"><label for="addu">Buscar usuario</label><span class="sbar"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="addu" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Busca por nombre de usuario" role="combobox" aria-expanded="false" aria-controls="acl"></span><div id="acl" class="acl" role="listbox" hidden></div></div><button class="go" type="submit">Enviar solicitud</button></form><p role="status" id="addm" class="'+addMsg.c+'">'+esc(addMsg.t)+'</p></section>';
 if(S.incoming.length)h+='<section class="pcard rq"><h2>Solicitudes recibidas <i class="cnt">'+S.incoming.length+'</i></h2>'+S.incoming.map(function(u){return '<div class="fr">'+av(u)+'<b class="fn">'+esc(u.name)+'</b><span class="fa"><button class="go" data-ac="'+esc(u.name)+'">Aceptar</button><button data-rm="'+esc(u.name)+'">Rechazar</button></span></div>'}).join('')+'</section>';
 if(S.invites.length)h+='<section class="pcard"><h2>Invitaciones a test conjunto <i class="cnt">'+S.invites.length+'</i></h2>'+S.invites.map(function(i){return '<div class="fr"><span class="av ph">👥</span><span class="fn"><b>'+esc(i.from)+'</b> te invita a un test<small>'+(i.title?esc(i.title)+' · ':'')+i.n+' preguntas · '+ago(i.created)+'</small></span><span class="fa"><a class="chip go" href="sala.html?c='+esc(i.code)+'">Unirme</a><button data-ig="'+esc(i.code)+'">Ignorar</button></span></div>'}).join('')+'</section>';
 h+='<section class="pcard fl"><h2>Mis compañeros <small class="sub">('+S.friends.length+')</small></h2>';
 if(!S.friends.length)h+='<p class="sub">Todavía no tienes compañeros. Añade a alguien con su nombre de usuario.</p>';
 h+=S.friends.map(function(f){
  var st=f.online===true?'<span class="dot on"></span>':f.online===false?'<span class="dot"></span>':'';
  var line=f.online===true?(f.label?'📖 '+esc(f.label):'Conectado'):f.online===false?(f.last?'Última vez '+ago(f.last):'Desconectado'):'<i>Actividad oculta</i>';
  return '<div class="fr" data-f="'+esc(f.name)+'"><span class="avw">'+av(f)+st+'</span><span class="fn"><b>'+esc(f.name)+'</b><small>'+line+'</small></span><span class="fa">'
   +'<button data-chat="'+esc(f.name)+'">💬 Chat'+(f.unread?' <i class="cnt">'+f.unread+'</i>':'')+'</button>'
   +'<button data-st="'+esc(f.name)+'"'+(f.canStats?'':' disabled title="No comparte sus estadísticas"')+'>📊 Estadísticas</button>'
   +'<a class="chip" href="sala.html?invitar='+encodeURIComponent(f.name)+'">👥 Test conjunto</a>'
   +'<button class="x" data-rm="'+esc(f.name)+'" data-del="1" title="Eliminar compañero">✕</button></span></div>'}).join('')+'</section>';
 if(S.outgoing.length)h+='<section class="pcard"><h2>Solicitudes enviadas</h2>'+S.outgoing.map(function(u){return '<div class="fr">'+av(u)+'<b class="fn">'+esc(u.name)+' <small>pendiente</small></b><span class="fa"><button data-rm="'+esc(u.name)+'">Cancelar</button></span></div>'}).join('')+'</section>';
 app.innerHTML=h;bind();if(document.documentElement.classList.contains('embed'))app.querySelectorAll('.fl .fr[data-f]').forEach(function(r){r.style.cursor='pointer';r.onclick=function(e){if(!e.target.closest('[data-chat]'))openChat(r.dataset.f)}})}

function bind(){
 var f=$('avf');$('avb').onclick=$('avc').onclick=function(){f.click()};
 f.onchange=function(){var file=f.files[0];f.value='';if(!file)return;shrink(file,{square:1,max:160,q:.82,limit:30000}).then(function(d){return api('/api/profile',{method:'PUT',body:J({avatar:d})})}).then(function(){toast('Imagen actualizada');load()}).catch(function(e){toast(e.message)})};
 var x=$('avx');if(x)x.onclick=function(){api('/api/profile',{method:'PUT',body:J({avatar:''})}).then(load)};
 [['p1','share_online'],['p2','share_topic'],['p3','share_stats']].forEach(function(p){$(p[0]).onchange=function(){var o={};o[p[1]]=this.checked?1:0;api('/api/profile',{method:'PUT',body:J(o)}).then(function(r){S.me=r;toast('Guardado')}).catch(function(e){toast(e.message)})}});
 (function(){var inp=$('addu'),l=$('acl'),tm=null,seq=0,hi=-1,items=[];
  function hide(){l.hidden=true;inp.setAttribute('aria-expanded','false');hi=-1}
  function mark(){[].forEach.call(l.children,function(c,i){c.classList.toggle('hi',i===hi)})}
  function pick(n){inp.value=n;hide();inp.focus()}
  function show(u){items=u;if(!u.length){l.innerHTML='<div class="aco">'+(inp.value.trim()?'Ningún usuario coincide':'No hay más usuarios para añadir')+'</div>';l.hidden=false;return}
   l.innerHTML=u.map(function(x,i){return '<button type="button" role="option" class="ao" data-n="'+esc(x.name)+'">'+av(x,'sm')+'<b>'+esc(x.name)+'</b></button>'}).join('');l.hidden=false;inp.setAttribute('aria-expanded','true');hi=-1;
   [].forEach.call(l.querySelectorAll('.ao'),function(b){b.onmousedown=function(e){e.preventDefault();pick(b.dataset.n)};b.ontouchstart=function(){pick(b.dataset.n)}})}
  inp.oninput=function(){clearTimeout(tm);var q=inp.value.trim(),my=++seq;tm=setTimeout(function(){api('/api/users?q='+encodeURIComponent(q)).then(function(r){if(my===seq&&document.activeElement===inp)show(r.users)}).catch(function(){})},180)};
  inp.onfocus=function(){inp.oninput()};inp.onblur=function(){setTimeout(hide,150)};
  inp.onkeydown=function(e){if(l.hidden||!items.length)return;if(e.key==='ArrowDown'){e.preventDefault();hi=(hi+1)%items.length;mark()}else if(e.key==='ArrowUp'){e.preventDefault();hi=(hi-1+items.length)%items.length;mark()}else if(e.key==='Enter'&&hi>=0){e.preventDefault();pick(items[hi].name)}else if(e.key==='Escape')hide()}})();
 $('addf').onsubmit=function(e){e.preventDefault();var u=$('addu').value.trim(),m=$('addm');if(!u)return;m.className='sub';m.textContent='Enviando…';api('/api/friends',{method:'POST',body:J({user:u})}).then(function(r){addMsg={c:'sub ok',t:r.accepted?'¡Ahora sois compañeros!':'Solicitud enviada a '+r.name};return load()}).catch(function(e){addMsg={c:'sub ko',t:e.message};m.className=addMsg.c;m.textContent=addMsg.t})};
 app.querySelectorAll('[data-ac]').forEach(function(b){b.onclick=function(){api('/api/friends/'+encodeURIComponent(b.dataset.ac)+'/accept',{method:'POST'}).then(load).catch(function(e){toast(e.message)})}});
 app.querySelectorAll('[data-rm]').forEach(function(b){b.onclick=function(){var nm=b.dataset.rm,doIt=function(){api('/api/friends/'+encodeURIComponent(nm),{method:'DELETE'}).then(function(){if(chat&&chat.name===nm)closeChat();load()}).catch(function(e){toast(e.message)})};if(b.dataset.del)ask('Eliminar compañero','¿Eliminar a <b>'+esc(nm)+'</b> de tus compañeros? Dejaréis de veros y se perderá el acceso al chat. Tendrías que volver a enviar una solicitud.','Sí, eliminar',doIt);else doIt()}});
 app.querySelectorAll('[data-ig]').forEach(function(b){b.onclick=function(){api('/api/invites/'+b.dataset.ig,{method:'DELETE'}).then(load)}});
 app.querySelectorAll('[data-chat]').forEach(function(b){b.onclick=function(){openChat(b.dataset.chat)}});
 app.querySelectorAll('[data-st]').forEach(function(b){b.onclick=function(){showStats(b.dataset.st)}})}

/* ---------- estadísticas ---------- */
function closeModal(){modal.hidden=true;modal.innerHTML=''}
function ask(title,html,okTxt,fn){modal.hidden=false;modal.innerHTML='<div class="cfm" role="alertdialog"><h3>'+title+'</h3><p>'+html+'</p><div class="cfr"><button type="button" id="cfn">Cancelar</button><button type="button" class="dng" id="cfy">'+okTxt+'</button></div></div>';$('cfn').onclick=closeModal;$('cfy').onclick=function(){closeModal();fn()};$('cfn').focus()}
function showStats(name){modal.hidden=false;modal.innerHTML='<div class="sbox"><button class="sx" id="mx">✕</button><p class="sub">Cargando…</p></div>';$('mx').onclick=closeModal;
 api('/api/friends/'+encodeURIComponent(name)+'/stats').then(function(r){var s=r.stats,mx=Math.max(5,Math.max.apply(null,s.last7.map(function(d){return d.n})));
  var k=function(v,l){return '<div class="kp"><b>'+v+'</b><small>'+l+'</small></div>'};
  modal.innerHTML='<div class="sbox"><button class="sx" id="mx">✕</button><h2>📊 '+esc(r.name)+'</h2><p class="sub">Datos de su última sincronización'+(r.updated?' ('+ago(r.updated)+')':'')+'.</p>'
   +'<div class="kps">'+k('🔥 '+s.streak,'días de racha')+k(s.today,'respondidas hoy')+k(s.total,'respondidas en total')+k(s.tests,'tests hechos')+k(s.acc==null?'–':Math.round(s.acc*100)+'%','aciertos')+k(s.avg10==null?'–':s.avg10.toFixed(1),'nota media (últ. 10)')+k(s.topicsDone,'temas estudiados')+k(s.learned,'preguntas aprendidas')+'</div>'
   +'<h3>Últimos 7 días</h3><div class="bars">'+s.last7.map(function(d){return '<div class="bc"><i style="height:'+Math.round(d.n/mx*100)+'%"></i><small>'+d.n+'</small><em>'+d.d.slice(8)+'</em></div>'}).join('')+'</div>'
   +'<h3>Últimos exámenes</h3>'+(s.exams.length?'<div class="exl">'+s.exams.slice().reverse().map(function(e){return '<div><b class="'+(e.nota>=5?'ok':'ko')+'">'+e.nota.toFixed(2)+'</b> <span>✔'+e.a+' ✘'+e.e+' ○'+e.b+' de '+e.n+'</span><small>'+(MODE[e.m]||'')+(e.t?' · '+new Date(e.t).toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit'}):'')+'</small></div>'}).join('')+'</div>':'<p class="sub">Aún no ha hecho exámenes.</p>')+'</div>';
  $('mx').onclick=closeModal}).catch(function(e){modal.innerHTML='<div class="sbox"><button class="sx" id="mx">✕</button><p class="ko">'+esc(e.message)+'</p></div>';$('mx').onclick=closeModal})}
modal.onclick=function(e){if(e.target===modal)closeModal()};

/* ---------- chat ---------- */
function lastRes(){try{return JSON.parse(localStorage.getItem(AUTH.key('rx_last'))||'[]')}catch(e){return[]}}
function openChat(name){chat={name:name,last:0,msgs:[],busy:false};var f=S.friends.filter(function(x){return x.name===name})[0]||{name:name};
 chatw.hidden=false;document.body.classList.add('noscroll');
 chatw.innerHTML='<div class="cbox"><div class="chd"><button id="cb" aria-label="Volver">←</button><span id="chh"></span></div><div class="cms" id="cms"><p class="sub">Cargando…</p></div>'
  +'<div class="cmp" id="cmp" hidden></div><form class="cin" id="cf"><button type="button" id="cimg" title="Enviar imagen o captura">📎</button><button type="button" id="cres" title="Enviar un resultado de test">📝</button><textarea id="ct" rows="1" maxlength="1000" aria-label="Mensaje" placeholder="Escribe un mensaje…  (puedes pegar capturas)"></textarea><button class="go" id="cs" type="submit">Enviar</button></form><p class="send-status" role="status" id="send-status"></p><input type="file" id="cfi" accept="image/*" hidden></div>';
 refreshChatHead();
 $('cb').onclick=closeChat;
 var field=$('ct'), submit=$('cs'), status=$('send-status'), sending=false;
 function updateSend(){submit.disabled=sending || !field.value.trim()}
 field.oninput=updateSend;
 updateSend();
 $('cf').onsubmit=async function(e){
   e.preventDefault();
   var draft=field.value, recipient=chat;
   if(sending || !draft.trim())return;
   sending=true;
   updateSend();
   status.textContent='Enviando…';
   try {
     await postMessageTo(recipient,'text',draft.trim());
     if(field.value===draft)field.value='';
     status.textContent='';
   } catch(error) {
     status.textContent='No se pudo enviar. '+error.message;
   } finally {
     sending=false;
     updateSend();
   }
 };
 field.onkeydown=function(e){if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('cf').requestSubmit()}};
 $('cimg').onclick=function(){$('cfi').click()};$('cfi').onchange=function(){var f=this.files[0];this.value='';if(f)sendImg(f)};
 $('ct').onpaste=function(e){var it=[].slice.call((e.clipboardData||{}).items||[]).filter(function(x){return /^image\//.test(x.type)})[0];if(it){e.preventDefault();sendImg(it.getAsFile())}};
 $('cres').onclick=pickResult;
 fetchMsgs(true);clearInterval(pollC);pollC=setInterval(function(){if(!document.hidden)fetchMsgs(false)},4000)}
function refreshChatHead(){if(!chat)return;var f=S.friends.filter(function(x){return x.name===chat.name})[0]||{name:chat.name};var st=f.online===true?'<span class="dot on"></span>':f.online===false?'<span class="dot"></span>':'';
 $('chh').innerHTML='<span class="avw">'+av(f,'sm')+st+'</span><span class="fn"><b>'+esc(f.name)+'</b><small>'+(f.online===true?(f.label?'📖 '+esc(f.label):'Conectado'):f.online===false?(f.last?'Última vez '+ago(f.last):'Desconectado'):'')+'</small></span>'}
function closeChat(){chat=null;clearInterval(pollC);chatw.hidden=true;chatw.innerHTML='';document.body.classList.remove('noscroll');load()}
function fetchMsgs(first){if(!chat)return;var c=chat;return api('/api/chat/'+encodeURIComponent(c.name)+(c.last?'?after='+c.last:'')).then(function(r){if(chat!==c)return;var box=$('cms');if(!box)return;applyMeta(box,r);if(!r.messages.length&&!first)return;var bottom=first||box.scrollHeight-box.scrollTop-box.clientHeight<80;
  if(first&&c.last)return;
  if(first||!c.last)box.innerHTML='';
  r.messages.forEach(function(m){if(m.id<=c.last)return;c.last=m.id;var d=bubble(m);box.appendChild(d);if(r.reacts&&r.reacts[m.id])drawReacts(d,r.reacts[m.id])});
  if(first&&!r.messages.length)box.innerHTML='<p class="sub cempty">Aún no hay mensajes. Escribe algo, pega una captura o envía el resultado de un test.</p>';
  else{var e=box.querySelector('.cempty');if(e)e.remove()}
  if(bottom)box.scrollTop=box.scrollHeight}).catch(function(e){if(first&&chat===c)$('cms').innerHTML='<p class="ko">'+esc(e.message)+'</p>'})}
function bubble(m){var d=document.createElement('div');d.className='msg '+(m.mine?'me':'ot');d.dataset.id=m.id;d.dataset.mine=m.mine?1:0;var t='<time>'+hhmm(m.created)+'</time>';
 if(m.kind==='del'){d.classList.add('gone');d.innerHTML='<p class="mdel">🚫 Mensaje eliminado</p>'+t;return d}
 if(m.kind==='text')d.innerHTML='<p>'+esc(m.body).replace(/\n/g,'<br>')+'</p>'+t;
 else if(m.kind==='img'){d.innerHTML='<div class="mi"><span class="sub">Cargando imagen…</span></div>'+t;getImg(m.id).then(function(u){var i=d.querySelector('.mi');i.innerHTML='<img src="'+esc(u)+'" alt="Imagen">';i.firstChild.onclick=function(){zoom(u)}}).catch(function(){d.querySelector('.mi').textContent='No se pudo cargar la imagen'})}
 else if(m.kind==='result'){var r={};try{r=JSON.parse(m.body)}catch(e){}var ok=r.nota>=5;
  d.innerHTML='<div class="rc"><div class="rh"><b class="'+(ok?'ok':'ko')+'">'+(+r.nota||0).toFixed(2)+'</b><span>'+(r.title?esc(r.title)+'<br>':'')+'<small>✔ '+(r.a|0)+' · ✘ '+(r.e|0)+' · ○ '+(r.b|0)+' de '+(r.n|0)+(MODE[r.m]?' · '+MODE[r.m]:'')+'</small></span></div><button class="go same">🔁 Hacer el mismo test</button></div>'+t;
  d.querySelector('.same').onclick=function(){try{localStorage.setItem('rx_same',J({qids:r.qids,pen:r.pen,title:r.title,from:chat?chat.name:''}))}catch(e){}location.href='examinate.html?mismo=1'}}

 var ab=document.createElement('button');ab.type='button';ab.className='mact';ab.title='Reaccionar o borrar';ab.setAttribute('aria-label','Opciones del mensaje');ab.textContent='⋯';ab.onclick=function(e){e.stopPropagation();msgMenu(d,ab)};d.appendChild(ab);
 return d}
var RX=['👍','❤️','😂','😮','😢','🙏'];
function closeMenu(){var o=document.querySelector('.mmenu');if(o)o.remove()}
document.addEventListener('click',closeMenu);
function msgMenu(d,ab){var had=document.querySelector('.mmenu');closeMenu();if(had&&had._for===d)return;var id=+d.dataset.id,mine=d.dataset.mine==='1',m=document.createElement('div');m.className='mmenu';m._for=d;
 m.innerHTML='<div class="mrx">'+RX.map(function(e){return '<button type="button" data-e="'+e+'">'+e+'</button>'}).join('')+'</div>'+(mine?'<button type="button" class="mdl">🗑 Eliminar mensaje</button>':'');
 m.onclick=function(e){e.stopPropagation()};
 m.querySelectorAll('[data-e]').forEach(function(b){b.onclick=function(){closeMenu();api('/api/chat/msg/'+id+'/react',{method:'POST',body:J({emoji:b.dataset.e})}).then(function(){return fetchMsgs(false)}).catch(function(e){toast(e.message)})}});
 var dl=m.querySelector('.mdl');if(dl)dl.onclick=function(){closeMenu();ask('Eliminar mensaje','¿Eliminar este mensaje para los dos? No se puede deshacer.','Eliminar',function(){api('/api/chat/msg/'+id,{method:'DELETE'}).then(function(){return fetchMsgs(false)}).catch(function(e){toast(e.message)})})};
 d.appendChild(m)}
function drawReacts(d,list){var o=d.querySelector('.rxs');if(o)o.remove();if(!list||!list.length||d.classList.contains('gone'))return;var g={};list.forEach(function(x){var k=g[x.e]||(g[x.e]={n:0,mine:false});k.n++;if(x.mine)k.mine=true});
 var w=document.createElement('div');w.className='rxs';Object.keys(g).forEach(function(e){var b=document.createElement('button');b.type='button';b.className='rxc'+(g[e].mine?' on':'');b.textContent=e+(g[e].n>1?' '+g[e].n:'');b.onclick=function(ev){ev.stopPropagation();api('/api/chat/msg/'+d.dataset.id+'/react',{method:'POST',body:J({emoji:e})}).then(function(){return fetchMsgs(false)}).catch(function(x){toast(x.message)})};w.appendChild(b)});d.appendChild(w)}
function applyMeta(box,r){(r.dels||[]).forEach(function(id){var d=box.querySelector('.msg[data-id="'+id+'"]');if(d&&!d.classList.contains('gone')){var nd=bubble({id:id,mine:d.dataset.mine==='1',kind:'del',created:Date.now()});var t=d.querySelector('time');if(t)nd.querySelector('time').textContent=t.textContent;d.replaceWith(nd)}});
 box.querySelectorAll('.msg:not(.gone)').forEach(function(d){if(r.reacts||r.dels)drawReacts(d,(r.reacts||{})[d.dataset.id]||[])})}
function getImg(id){if(imgCache[id])return Promise.resolve(imgCache[id]);return api('/api/chat/image/'+id).then(function(r){imgCache[id]=r.data;return r.data})}
function zoom(u){modal.hidden=false;modal.innerHTML='<div class="zoom"><img src="'+esc(u)+'" alt=""><button class="sx" id="mx">✕</button></div>';$('mx').onclick=closeModal}
async function postMessageTo(recipient,kind,body){
 await api('/api/chat/'+encodeURIComponent(recipient.name),{method:'POST',body:J({kind:kind,body:body})});
 if(chat===recipient)await fetchMsgs(false);
}
function sendMsg(kind,body){if(chat)return postMessageTo(chat,kind,body).catch(function(e){toast(e.message)})}
function sendImg(file){
 var recipient=chat;
 toast('Preparando imagen…');
 shrink(file,{max:1100,q:.72,limit:140000}).then(function(data){
   if(chat===recipient)return postMessageTo(recipient,'img',data);
 }).catch(function(e){toast(e.message)})
}
function pickResult(){var l=lastRes(),p=$('cmp');if(!p.hidden){p.hidden=true;return}
 if(!l.length){toast('Aún no tienes resultados guardados. Termina un test y vuelve.');return}
 p.hidden=false;p.innerHTML='<div class="cph"><b>Elige el resultado a enviar</b><button type="button" id="cpx">✕</button></div>'+l.map(function(r,i){return '<button type="button" class="cpi" data-i="'+i+'"><b class="'+(r.nota>=5?'ok':'ko')+'">'+(+r.nota||0).toFixed(2)+'</b> <span>✔'+r.a+' ✘'+r.e+' ○'+r.b+' de '+r.qids.length+(MODE[r.m]?' · '+MODE[r.m]:'')+'</span><small>'+new Date(r.t).toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+'</small></button>'}).join('');
 $('cpx').onclick=function(){p.hidden=true};p.querySelectorAll('.cpi').forEach(function(b){b.onclick=function(){p.hidden=true;sendMsg('result',l[+b.dataset.i])}})}

/* ---------- arranque ---------- */
if(!AUTH.remote||!AUTH.canSocial()){app.innerHTML='<section class="pcard"><h2>Inicia sesión para usar los compañeros</h2><p class="sub">Esta función necesita tu cuenta en el servidor. Estás en modo sin conexión: cierra sesión e inicia sesión con conexión.</p></section>'}
else{load().then(function(){var q=new URLSearchParams(location.search).get('chat');if(q&&S&&S.friends.some(function(f){return f.name===q}))openChat(q)});pollS=setInterval(function(){if(!document.hidden&&!chat)load(true)},20000)}
})();
