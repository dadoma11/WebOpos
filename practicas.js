(function(){
function $(i){return document.getElementById(i)}
function esc(s){return String(s).replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
var ls={g:function(k){try{return localStorage.getItem(k)}catch(e){return null}},s:function(k,v){try{localStorage.setItem(k,v)}catch(e){}},d:function(k){try{localStorage.removeItem(k)}catch(e){}}};
/* ---------- SQL ---------- */
var SQL,db,base,cfg,cur=0;
function resTable(r){if(!r.length)return '<p class="sub">Sin filas.</p>';var o='';r.forEach(function(x){o+='<table><tr>'+x.columns.map(function(c){return '<th>'+esc(c)+'</th>'}).join('')+'</tr>'+x.values.map(function(v){return '<tr>'+v.map(function(c){return '<td>'+(c===null?'<i>NULL</i>':esc(c))+'</td>'}).join('')+'</tr>'}).join('')+'</table>'});return o}
function newDb(){if(db)db.close();db=new SQL.Database();db.run(cfg.schema)}
function norm(r){return JSON.stringify(r.length?r[r.length-1].values.map(function(v){return JSON.stringify(v)}).sort():[])}
function renderList(){$('exlist').innerHTML=cfg.exercises.map(function(e,i){return '<button class="'+(i===cur?'on':'')+'" data-i="'+i+'">'+(i+1)+'. '+esc(e.title)+'</button>'}).join('');
 Array.prototype.forEach.call($('exlist').children,function(b){b.onclick=function(){cur=+b.dataset.i;show()}})}
function show(){var e=cfg.exercises[cur];renderList();if(!e){$('stmt').innerHTML='<i>No hay ejercicios.</i>';return}
 $('stmt').innerHTML='<b>'+esc(e.title)+'</b><br>'+esc(e.statement);$('hint').textContent=e.hint||'(sin pista)';$('sol').textContent=e.solution;$('sqlout').innerHTML='';$('verdict').textContent='';$('sqlin').value='';
 $('ed_title').value=e.title;$('ed_st').value=e.statement;$('ed_sol').value=e.solution;$('ed_hint').value=e.hint||''}
function run(check){try{newDb();var r=db.exec($('sqlin').value);$('sqlout').innerHTML='<div class="sqlres">'+resTable(r)+'</div>';
  if(check){var e=cfg.exercises[cur];var s=db.exec(e.solution);$('verdict').innerHTML=norm(r)===norm(s)?'<span class="ok">✔ Correcto: el resultado coincide</span>':'<span class="ko">✘ El resultado no coincide con el esperado</span>'}}
 catch(x){$('sqlout').innerHTML='<div class="out ko">'+esc(x.message)+'</div>';$('verdict').textContent=''}}
function save(){ls.s('sqlcfg',JSON.stringify(cfg))}
function initSql(){
 var saved=ls.g('sqlcfg');
 fetch('data/sql.json').then(function(r){return r.json()}).then(function(j){base=j;cfg=saved?JSON.parse(saved):JSON.parse(JSON.stringify(j));
  initSqlJs({locateFile:function(f){return 'vendor/'+f}}).then(function(m){SQL=m;newDb();$('schema').value=cfg.schema;show();
   $('run').onclick=function(){run(false)};$('check').onclick=function(){run(true)};
   $('schemaSave').onclick=function(){try{cfg.schema=$('schema').value;newDb();save();$('schemaMsg').innerHTML='<span class="ok">Esquema guardado</span>'}catch(x){$('schemaMsg').innerHTML='<span class="ko">'+esc(x.message)+'</span>'}};
   $('tables').onclick=function(){newDb();$('sqlout').innerHTML='<div class="sqlres">'+resTable(db.exec("SELECT name AS tabla, sql FROM sqlite_master WHERE type='table'"))+'</div>'};
   $('edSave').onclick=function(){var e=cfg.exercises[cur]||(cfg.exercises[cur]={});e.id=e.id||('x'+Date.now());e.title=$('ed_title').value;e.statement=$('ed_st').value;e.solution=$('ed_sol').value;e.hint=$('ed_hint').value;save();show()};
   $('edNew').onclick=function(){cfg.exercises.push({id:'x'+Date.now(),title:'Nuevo ejercicio',statement:'Escribe el enunciado',solution:'SELECT 1;',hint:''});cur=cfg.exercises.length-1;save();show();$('edit').open=true};
   $('edDel').onclick=function(){if(cfg.exercises.length&&confirm('¿Borrar este ejercicio?')){cfg.exercises.splice(cur,1);cur=0;save();show()}};
   $('exp').onclick=function(){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(cfg,null,1)],{type:'application/json'}));a.download='sql.json';a.click()};
   $('imp').onchange=function(){var f=this.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{cfg=JSON.parse(r.result);save();cur=0;newDb();$('schema').value=cfg.schema;show()}catch(x){alert('JSON no válido')}};r.readAsText(f)};
   $('reset').onclick=function(){if(confirm('Se perderán tus cambios locales y se recargarán los ejercicios originales del repositorio.')){ls.d('sqlcfg');cfg=JSON.parse(JSON.stringify(base));cur=0;newDb();$('schema').value=cfg.schema;show()}};
  })})}
/* ---------- Subnetting ---------- */
function ip2n(s){var p=s.trim().split('.');if(p.length!==4)return null;var n=0;for(var i=0;i<4;i++){var v=+p[i];if(!/^\d+$/.test(p[i])||v>255)return null;n=n*256+v}return n}
function n2ip(n){return [n>>>24&255,n>>>16&255,n>>>8&255,n&255].join('.')}
function subnet(){var m=$('ip').value.trim().match(/^([\d.]+)\/(\d+)$/),n=m?ip2n(m[1]):null,c=m?+m[2]:-1;if(n===null||c<0||c>32){$('netout').innerHTML='<span class="ko">Formato: 192.168.1.10/24</span>';return}
 var mask=c===0?0:(0xFFFFFFFF<<(32-c))>>>0,net=(n&mask)>>>0,bc=(net|(~mask>>>0))>>>0,hosts=c>=31?(c===32?1:2):Math.pow(2,32-c)-2;
 var o='Dirección de red: '+n2ip(net)+'/'+c+'\nMáscara: '+n2ip(mask)+'\nWildcard: '+n2ip(~mask>>>0)+'\nBroadcast: '+n2ip(bc)+'\nRango de hosts: '+(c>=31?'—':n2ip(net+1)+' – '+n2ip(bc-1))+'\nHosts útiles: '+hosts+'\nNúmero binario máscara: '+mask.toString(2).padStart(32,'0').replace(/(.{8})(?=.)/g,'$1.');
 var first=n>>>24,cl=first<128?'A':first<192?'B':first<224?'C':first<240?'D (multicast)':'E (reservada)';o+='\nClase (classful): '+cl;
 var priv=(n>>>24===10)||((n>>>20)===0xAC1)||((n>>>16)===0xC0A8);o+='\nPrivada (RFC 1918): '+(priv?'sí':'no');
 var k=+$('nsub').value;if(k>1){var bits=Math.ceil(Math.log2(k)),nc=c+bits;if(nc>32)o+='\n\nNo se puede dividir en tantas subredes.';else{o+='\n\nDivisión en '+Math.pow(2,bits)+' subredes /'+nc+':';for(var i=0;i<Math.pow(2,bits)&&i<64;i++){var s=(net+i*Math.pow(2,32-nc))>>>0;o+='\n  '+n2ip(s)+'/'+nc+'  ('+n2ip(s+1)+' – '+n2ip(s+Math.pow(2,32-nc)-2)+')'}}}
 $('netout').textContent=o}
/* ---------- Conversor ---------- */
function conv(src){var v=$(src).value.trim(),n;if(!v){['cd','cb','ch','co'].forEach(function(i){if(i!==src)$(i).value=''});return}
 var b={cd:10,cb:2,ch:16,co:8}[src];n=parseInt(v.replace(/[\s:.-]/g,''),b);if(isNaN(n)){$('convmsg').textContent='Valor no válido';return}$('convmsg').textContent='';
 if(src!=='cd')$('cd').value=n.toString(10);if(src!=='cb')$('cb').value=n.toString(2);if(src!=='ch')$('ch').value=n.toString(16).toUpperCase();if(src!=='co')$('co').value=n.toString(8);
 $('convx').textContent='Complemento a 2 (8 bits) de '+(n&255)+': '+((~n+1)&255).toString(2).padStart(8,'0')+'   ·   ASCII: '+(n>31&&n<127?String.fromCharCode(n):'—')}
/* ---------- RAID ---------- */
function raid(){var l=$('rl').value,n=+$('rn').value,s=+$('rs').value,u,f,min,txt;
 var T={'0':[1,'0 (sin tolerancia)',2,function(){return n*s}],'1':[1,'1 disco por espejo (n-1 en total)',2,function(){return s}],'5':[1,'1 disco',3,function(){return (n-1)*s}],'6':[1,'2 discos',4,function(){return (n-2)*s}],'10':[1,'1 por cada espejo (mín. 1, hasta n/2)',4,function(){return n/2*s}]}[l];
 if(n<T[2]){$('raidout').innerHTML='<span class="ko">RAID '+l+' necesita al menos '+T[2]+' discos</span>';return}
 $('raidout').textContent='Capacidad útil: '+T[3]()+' GB de '+(n*s)+' GB ('+Math.round(100*T[3]()/(n*s))+'%)\nTolerancia a fallos: '+T[1]+'\nMínimo de discos: '+T[2]}
/* ---------- Hash / Base64 ---------- */
function hex(b){return Array.prototype.map.call(new Uint8Array(b),function(x){return x.toString(16).padStart(2,'0')}).join('')}
function hash(){var t=new TextEncoder().encode($('ht').value),a=$('ha').value;crypto.subtle.digest(a,t).then(function(d){$('hout').textContent=a+':\n'+hex(d)+'\n\nLongitud: '+d.byteLength*8+' bits'})}
function b64(enc){try{$('hout').textContent=enc?btoa(unescape(encodeURIComponent($('ht').value))):decodeURIComponent(escape(atob($('ht').value)))}catch(e){$('hout').textContent='Entrada no válida'}}
document.addEventListener('DOMContentLoaded',function(){
 initSql();$('sub').onclick=subnet;$('ip').oninput=subnet;$('nsub').oninput=subnet;subnet();
 ['cd','cb','ch','co'].forEach(function(i){$(i).oninput=function(){conv(i)}});$('cd').value=192;conv('cd');
 ['rl','rn','rs'].forEach(function(i){$(i).oninput=raid});raid();
 $('hgo').onclick=hash;$('benc').onclick=function(){b64(true)};$('bdec').onclick=function(){b64(false)};
 var thm=$('thm');if(thm)thm.onclick=function(){var d=document.documentElement,c=d.dataset.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'),n=c==='dark'?'light':'dark';d.dataset.theme=n;ls.s('theme',n)}});
})();
