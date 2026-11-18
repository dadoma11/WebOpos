/* Leer en voz alta el resumen del tema (Web Speech API del navegador, sin servidor). */
(function(){
var doc=document.querySelector('.doc');if(!doc||!('speechSynthesis' in window))return;
var bar=doc.querySelector('.bar');if(!bar)return;
var S=window.speechSynthesis;
var LS={g:function(k){try{return localStorage.getItem(k)}catch(e){return null}},s:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
var KEY=doc.dataset.key,rate=parseFloat(LS.g('tts_rate'))||1,voiceName=LS.g('tts_voice')||'',onlyKey=LS.g('tts_only')==='1';
var units=[],chunks=[],ci=0,playing=false,gen=0,player=null,voices=[];
function clean(n){var c=n.cloneNode(true);Array.prototype.forEach.call(c.querySelectorAll('.nb,.mynote,script,style,svg'),function(x){x.remove()});return c.textContent.replace(/\s+/g,' ').trim()}
function say(t){return t.replace(/\bp\.\s?ej\./gi,'por ejemplo').replace(/\bart\.\s?(\d)/gi,'artículo $1').replace(/\barts\.\s?(\d)/gi,'artículos $1').replace(/\bapdo\./gi,'apartado').replace(/\bLO\s(\d)/g,'Ley Orgánica $1').replace(/\bRD\s(\d)/g,'Real Decreto $1').replace(/\bCE\b/g,'Constitución Española').replace(/→/g,', ').replace(/[•·]/g,', ').replace(/\s[–—-]\s/g,', ').replace(/[“”«»]/g,'"').replace(/\(([^)]{0,80})\)/g,', $1, ')}
function build(){units=[];var last=null;
 Array.prototype.forEach.call(doc.children,function(n){
  var tag=n.tagName,cls=n.classList;
  if(cls.contains('bar')||cls.contains('mynote')||cls.contains('tqbar')||cls.contains('tqpop')||cls.contains('crumb'))return;
  var t=null,kind='p';
  if(tag==='H1'){t=clean(n);kind='h'}
  else if(tag==='H2'||tag==='H3'){t=clean(n);kind='h'}
  else if(cls.contains('box')){var lbl=cls.contains('E')?'Examen. ':'Importante. ';t=lbl+clean(n);kind=cls.contains('E')?'E':'I'}
  else if(tag==='P'||tag==='UL'||tag==='OL'||tag==='BLOCKQUOTE'){t=clean(n)}
  else if(cls.contains('tw')||tag==='TABLE'){t=null;kind='t'}
  if(!t&&kind!=='t')return;
  if(kind==='t'){if(!onlyKey)units.push({el:n,txt:'Aquí hay una tabla; consúltala en pantalla.',kind:'t'});return}
  units.push({el:n,txt:t,kind:kind})});
 if(onlyKey){var out=[];units.forEach(function(u,i){if(u.kind==='E'||u.kind==='I'){var p=out[out.length-1];var h=null;for(var j=i-1;j>=0;j--){if(units[j].kind==='h'){h=units[j];break}}if(h&&out.indexOf(h)<0)out.push(h);out.push(u)}});units=out}
 chunks=[];units.forEach(function(u,ui){var s=say(u.txt),parts=s.match(/[^.!?;:]+[.!?;:]*\s*/g)||[s],cur='';
  parts.forEach(function(p){if((cur+p).length>200&&cur){chunks.push({u:ui,t:cur.trim()});cur=p}else cur+=p});
  if(cur.trim())chunks.push({u:ui,t:cur.trim()})})}
function loadVoices(){voices=S.getVoices().filter(function(v){return /^es/i.test(v.lang)});if(!voices.length)voices=S.getVoices();var sel=player&&player.querySelector('.tv');if(!sel)return;
 sel.innerHTML=voices.map(function(v){return '<option value="'+v.name+'"'+(v.name===voiceName?' selected':'')+'>'+v.name+' ('+v.lang+')</option>'}).join('')||'<option>Voz del sistema</option>'}
function pickVoice(){var v=voices.filter(function(x){return x.name===voiceName})[0];if(!v){v=voices.filter(function(x){return /^es[-_]ES/i.test(x.lang)})[0]||voices[0]}return v}
var curEl=null;
function mark(){if(curEl)curEl.classList.remove('tts-now');var u=units[chunks[ci]&&chunks[ci].u];curEl=u?u.el:null;if(curEl){curEl.classList.add('tts-now');var r=curEl.getBoundingClientRect();if(r.top<70||r.bottom>innerHeight-110)curEl.scrollIntoView({behavior:'smooth',block:'center'})}
 var pg=player&&player.querySelector('.tp');if(pg){var ui=chunks[ci]?chunks[ci].u:units.length;pg.textContent=(Math.min(ui+1,units.length))+' / '+units.length;player.querySelector('.tbar i').style.width=(units.length?Math.min(100,ui/units.length*100):0)+'%'}}
function speakCur(){if(!playing)return;if(ci>=chunks.length){stopAll(true);return}
 var my=++gen,u=new SpeechSynthesisUtterance(chunks[ci].t);u.lang='es-ES';u.rate=rate;var v=pickVoice();if(v){u.voice=v;u.lang=v.lang}
 u.onend=function(){if(my!==gen||!playing)return;ci++;mark();speakCur()};u.onerror=function(e){if(my!==gen)return;if(e.error==='interrupted'||e.error==='canceled')return;playing=false;ui();var pg=player&&player.querySelector('.tp');if(pg)pg.textContent='Tu navegador no pudo reproducir la voz'};
 mark();S.cancel();S.speak(u)}
function play(from){if(!units.length)build();if(typeof from==='number')ci=from;if(ci>=chunks.length)ci=0;playing=true;ui();speakCur();media()}
function pause(){playing=false;gen++;S.cancel();ui()}
function stopAll(done){playing=false;gen++;S.cancel();if(done)ci=0;if(curEl){curEl.classList.remove('tts-now');curEl=null}ui()}
function jumpUnit(d){if(!chunks.length)build();var u=(chunks[ci]?chunks[ci].u:0)+d;u=Math.max(0,Math.min(units.length-1,u));var idx=chunks.findIndex(function(c){return c.u===u});ci=idx<0?0:idx;mark();if(playing){gen++;S.cancel();speakCur()}}
function rebuild(){var uEl=chunks[ci]&&units[chunks[ci].u]?units[chunks[ci].u].el:null;var was=playing;gen++;S.cancel();build();ci=0;if(uEl){var k=chunks.findIndex(function(c){return units[c.u].el===uEl});if(k>=0)ci=k}playing=was;mark();if(was)speakCur()}
function ui(){if(!player)return;var b=player.querySelector('.tpl');b.textContent=playing?'⏸':'▶';b.title=playing?'Pausa':'Reproducir';btn.classList.toggle('on',!!player.parentNode)}
function media(){try{if('mediaSession' in navigator){navigator.mediaSession.metadata=new MediaMetadata({title:doc.querySelector('h1').textContent,artist:'Oposiciones TAI'});navigator.mediaSession.setActionHandler('play',function(){play()});navigator.mediaSession.setActionHandler('pause',pause);navigator.mediaSession.setActionHandler('nexttrack',function(){jumpUnit(1)});navigator.mediaSession.setActionHandler('previoustrack',function(){jumpUnit(-1)})}}catch(e){}}
function open(){if(player&&player.parentNode)return;
 player=document.createElement('div');player.className='ttsp';
 player.innerHTML='<div class="tbar"><i></i></div><div class="trow"><button class="tpv" title="Sección anterior">⏮</button><button class="tpl go" title="Reproducir">▶</button><button class="tnx" title="Sección siguiente">⏭</button><span class="tp">0 / 0</span>'
  +'<label class="tl">Velocidad <select class="tr">'+[0.8,0.9,1,1.1,1.25,1.5,1.75,2].map(function(x){return '<option value="'+x+'"'+(x===rate?' selected':'')+'>'+x+'×</option>'}).join('')+'</select></label>'
  +'<label class="tl tvl">Voz <select class="tv"></select></label>'
  +'<label class="tl"><input type="checkbox" class="to"'+(onlyKey?' checked':'')+'> Solo EXAMEN / IMPORTANTE</label><button class="tx" title="Cerrar">✕</button></div>';
 document.body.appendChild(player);document.body.classList.add('has-tts');
 player.querySelector('.tpl').onclick=function(){playing?pause():play()};
 player.querySelector('.tpv').onclick=function(){jumpUnit(-1)};player.querySelector('.tnx').onclick=function(){jumpUnit(1)};
 player.querySelector('.tr').onchange=function(e){rate=parseFloat(e.target.value);LS.s('tts_rate',rate);if(playing){gen++;S.cancel();speakCur()}};
 player.querySelector('.tv').onchange=function(e){voiceName=e.target.value;LS.s('tts_voice',voiceName);if(playing){gen++;S.cancel();speakCur()}};
 player.querySelector('.to').onchange=function(e){onlyKey=e.target.checked;LS.s('tts_only',onlyKey?'1':'0');rebuild()};
 player.querySelector('.tx').onclick=close;
 loadVoices();build();ci=0;mark();ui()}
function close(){stopAll(true);if(player){player.remove();player=null}document.body.classList.remove('has-tts');btn.classList.remove('on')}
var btn=document.createElement('button');btn.className='chip ttsb';btn.type='button';btn.textContent='🔊 Leer en voz alta';
btn.onclick=function(){if(player&&player.parentNode){close()}else{open();play(0)}};
bar.appendChild(btn);
if(S.onvoiceschanged!==undefined)S.onvoiceschanged=loadVoices;
document.addEventListener('keydown',function(e){if(!player||/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName))return;if(e.key===' '&&e.shiftKey){e.preventDefault();playing?pause():play()}});
window.addEventListener('pagehide',function(){try{S.cancel()}catch(e){}});
doc.addEventListener('click',function(e){if(!player||!player.parentNode)return;if(e.target.closest('a,button,input,textarea,.mynote,.nb'))return;var n=e.target;while(n&&n.parentNode!==doc)n=n.parentNode;if(!n||!(e.detail===2))return;var ui2=units.findIndex(function(u){return u.el===n});if(ui2>=0){var k=chunks.findIndex(function(c){return c.u===ui2});if(k>=0)play(k)}});
})();
