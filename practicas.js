(function(){
function $(i){return document.getElementById(i)}
function esc(s){return String(s).replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
var ls={g:function(k){try{return localStorage.getItem(k)}catch(e){return null}},s:function(k,v){try{localStorage.setItem(k,v)}catch(e){}},d:function(k){try{localStorage.removeItem(k)}catch(e){}}};
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

/* ---------- Test de 4 opciones ---------- */
function ri(a,b){return a+Math.floor(Math.random()*(b-a+1))}
function pk(a){return a[ri(0,a.length-1)]}
function shuf(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=ri(0,i),t=a[i];a[i]=a[j];a[j]=t}return a}
function four(correct,cands){var seen={},out=[];seen[String(correct)]=1;shuf(cands).forEach(function(c){var k=String(c);if(!seen[k]&&out.length<3){seen[k]=1;out.push(c)}});return out.length<3?null:[correct].concat(out)}
function maskStr(c){return n2ip(c===0?0:(0xFFFFFFFF<<(32-c))>>>0)}
function qSubnet(){var c=ri(20,29),a=pk([[10,ri(0,255),ri(0,255)],[172,ri(16,31),ri(0,255)],[192,168,ri(0,255)]]),n=((a[0]*256+a[1])*256+a[2])*256+ri(1,254);n=n>>>0;
 var mask=(0xFFFFFFFF<<(32-c))>>>0,net=(n&mask)>>>0,bc=(net|(~mask>>>0))>>>0,blk=Math.pow(2,32-c),ip=n2ip(n)+'/'+c,t=pk(['net','bc','mask','hosts','first','last','wild','nsub','prefix','class']),r;
 if(t==='net')r={q:'¿Cuál es la dirección de red de '+ip+'?',c:n2ip(net),w:[n2ip(net+blk),n2ip(net>=blk?net-blk:net+2*blk),n2ip(bc),n2ip(n===net?net+1:n),n2ip(net+1)],e:'Dirección de red = IP AND máscara ('+maskStr(c)+').'};
 if(t==='bc')r={q:'¿Cuál es la dirección de broadcast de '+ip+'?',c:n2ip(bc),w:[n2ip(net),n2ip(bc+blk),n2ip(bc-1),n2ip(bc-blk),n2ip(net+blk-2)],e:'Broadcast = dirección de red con todos los bits de host a 1.'};
 if(t==='mask')r={q:'¿Qué máscara corresponde a /'+c+'?',c:maskStr(c),w:[maskStr(c-1),maskStr(c+1),maskStr(c-2),maskStr(c+2),maskStr(c-3)],e:'/'+c+' = '+c+' bits a 1.'};
 if(t==='hosts')r={q:'¿Cuántos hosts útiles tiene una red /'+c+'?',c:String(blk-2),w:[String(blk),String(blk-1),String(blk*2-2),String(blk/2-2),String(blk-4)],e:'2^(32-'+c+') − 2 (red y broadcast no son utilizables).'};
 if(t==='first')r={q:'¿Cuál es el primer host utilizable de '+ip+'?',c:n2ip(net+1),w:[n2ip(net),n2ip(net+2),n2ip(bc-1),n2ip(bc),n2ip(net+blk+1)],e:'Primer host = dirección de red + 1.'};
 if(t==='last')r={q:'¿Cuál es el último host utilizable de '+ip+'?',c:n2ip(bc-1),w:[n2ip(bc),n2ip(bc-2),n2ip(net+1),n2ip(net),n2ip(bc+blk-1)],e:'Último host = broadcast − 1.'};
 if(t==='wild')r={q:'¿Cuál es la máscara wildcard (inversa) de /'+c+'?',c:n2ip(~mask>>>0),w:[maskStr(c),n2ip(~(0xFFFFFFFF<<(32-c-1))>>>0),n2ip(~(0xFFFFFFFF<<(32-c+1))>>>0),n2ip(~(0xFFFFFFFF<<(32-c+2))>>>0),n2ip(~(0xFFFFFFFF<<(32-c-2))>>>0)],e:'Wildcard = complemento de la máscara.'};
 if(t==='nsub'){var k=ri(1,4);r={q:'Si divides una red /'+c+' en subredes /'+(c+k)+', ¿cuántas subredes obtienes?',c:String(Math.pow(2,k)),w:[String(Math.pow(2,k+1)),String(Math.pow(2,k-1)||3),String(k*2),String(k+2),String(Math.pow(2,k)+2)],e:'2^'+k+' subredes (cada bit que tomas del host duplica el número).'}}
 if(t==='prefix')r={q:'¿Qué prefijo CIDR corresponde a la máscara '+maskStr(c)+'?',c:'/'+c,w:['/'+(c-1),'/'+(c+1),'/'+(c-2),'/'+(c+2),'/'+(c+3)],e:'Cuenta los bits a 1 de la máscara.'};
 if(t==='class'){var f=pk([ri(1,126),ri(128,191),ri(192,223),ri(224,239)]),cl=f<128?'A':f<192?'B':f<224?'C':'D (multicast)';r={q:'¿A qué clase pertenece una dirección IPv4 que empieza por '+f+'.x.x.x?',c:'Clase '+cl,w:['Clase A','Clase B','Clase C','Clase D (multicast)','Clase E (reservada)'].filter(function(x){return x!=='Clase '+cl}),e:'A: 1-126 · B: 128-191 · C: 192-223 · D: 224-239 · E: 240-255.'}}
 var o=four(r.c,r.w);return o?{q:r.q,o:o,e:r.e}:qSubnet()}
function flip(b){var a=b.split(''),k=ri(1,2);while(k--){var i=ri(0,a.length-1);a[i]=a[i]==='0'?'1':'0'}return a.join('')}
function qConv(){var t=pk(['d2b','b2d','d2h','h2d','c2']),v=ri(17,254),r;
 if(t==='d2b'){var b=v.toString(2).padStart(8,'0');r={q:'Pasa a binario (8 bits) el número decimal '+v+'.',c:b,w:[flip(b),flip(b),flip(b),(v+1).toString(2).padStart(8,'0'),(v-1).toString(2).padStart(8,'0')],e:'Divisiones sucesivas entre 2 (o suma de potencias de 2).'}}
 if(t==='b2d'){var b2=v.toString(2).padStart(8,'0');r={q:'Pasa a decimal el número binario '+b2+'.',c:String(v),w:[String(v+1),String(v-1),String(v+16),String(v-16),String(v^255),String(v^1)],e:'Suma las potencias de 2 de los bits a 1.'}}
 if(t==='d2h')r={q:'Pasa a hexadecimal el decimal '+v+'.',c:v.toString(16).toUpperCase(),w:[(v+1).toString(16).toUpperCase(),(v-1).toString(16).toUpperCase(),(v+16).toString(16).toUpperCase(),(v^255).toString(16).toUpperCase(),(v^15).toString(16).toUpperCase()],e:'Cada dígito hex = 4 bits.'};
 if(t==='h2d')r={q:'Pasa a decimal el hexadecimal '+v.toString(16).toUpperCase()+'.',c:String(v),w:[String(v+1),String(v-1),String(v+16),String(v-16),String(v^255)],e:'Dígito alto × 16 + dígito bajo.'};
 if(t==='c2'){var x=ri(1,100),neg=((~x+1)&255).toString(2).padStart(8,'0');r={q:'Representa −'+x+' en complemento a 2 con 8 bits.',c:neg,w:[x.toString(2).padStart(8,'0'),(~x&255).toString(2).padStart(8,'0'),('1'+x.toString(2).padStart(7,'0')).slice(0,8),flip(neg)],e:'Invierte los bits de '+x+' y suma 1.'}}
 var o=four(r.c,r.w);return o?{q:r.q,o:o,e:r.e}:qConv()}
function qRaid(){var lv=pk(['0','1','5','6','10']),n=ri(2,8),s=pk([500,1000,2000,4000]),t=pk(['cap','tol','min','cap']);var min={'0':2,'1':2,'5':3,'6':4,'10':4};if(n<min[lv])n=min[lv]+ri(0,3);if(lv==='10'&&n%2)n++;
 var cap={'0':n*s,'1':s,'5':(n-1)*s,'6':(n-2)*s,'10':n/2*s}[lv],r;
 if(t==='cap')r={q:'Un RAID '+lv+' con '+n+' discos de '+s+' GB: ¿cuál es la capacidad útil?',c:cap+' GB',w:[n*s,s,(n-1)*s,(n-2)*s,n/2*s,(n+1)*s].map(function(v){return v+' GB'}),e:{'0':'RAID 0: n × tamaño (sin redundancia).','1':'RAID 1: espejo, la capacidad de un disco.','5':'RAID 5: (n−1) × tamaño (paridad distribuida).','6':'RAID 6: (n−2) × tamaño (doble paridad).','10':'RAID 10: n/2 × tamaño (espejos con stripe).'}[lv]};
 if(t==='tol'){var tol={'0':'0 discos (ninguno)','1':'n−1 discos (mientras quede uno)','5':'1 disco','6':'2 discos','10':'1 por espejo (hasta n/2 si son de espejos distintos)'}[lv];r={q:'¿Cuántos discos pueden fallar sin perder datos en un RAID '+lv+'?',c:tol,w:['0 discos (ninguno)','n−1 discos (mientras quede uno)','1 disco','2 discos','1 por espejo (hasta n/2 si son de espejos distintos)','Todos menos 2'],e:'Tolerancia a fallos de cada nivel RAID.'}}
 if(t==='min')r={q:'¿Cuál es el número mínimo de discos de un RAID '+lv+'?',c:String(min[lv]),w:['2','3','4','5','6'],e:'RAID 0/1: 2 · RAID 5: 3 · RAID 6 y 10: 4.'};
 var o=four(r.c,r.w);return o?{q:r.q,o:o,e:r.e}:qRaid()}
var WORDS=['redes','oposicion','router','switch','firewall','kerberos','servidor','criptografia','paquete','subred'];
function mutW(w){var a=w.split(''),i=ri(0,a.length-1);a[i]=String.fromCharCode(97+(a[i].charCodeAt(0)-97+ri(1,5))%26);return a.join('')}
function qHash(){var t=pk(['bits','b64','sha']),w=pk(WORDS);
 if(t==='bits'){var A=[['MD5',128],['SHA-1',160],['SHA-256',256],['SHA-384',384],['SHA-512',512]],a=pk(A);var o=four(a[1]+' bits',A.map(function(x){return x[1]+' bits'}).concat(['64 bits','224 bits']));return Promise.resolve({q:'¿Cuántos bits tiene el resumen (hash) de '+a[0]+'?',o:o,e:'MD5 128 · SHA-1 160 · SHA-256 256 · SHA-384 384 · SHA-512 512.'})}
 if(t==='b64'){var b=btoa(w),o2=four(b,[btoa(mutW(w)),btoa(mutW(w)),btoa(w+'x'),btoa(w.slice(0,-1)),b.replace(/=+$/,'')+'A',btoa(w.toUpperCase())]);return Promise.resolve(o2?{q:'¿Cuál es la codificación Base64 de «'+w+'»?',o:o2,e:'Base64 agrupa de 3 bytes en 4 caracteres; añade «=» como relleno.'}:qHash())}
 var enc=function(x){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(x)).then(function(d){return hex(d).slice(0,16)})};
 return Promise.all([enc(w),enc(mutW(w)),enc(w+'1'),enc(w.toUpperCase()),enc(w.slice(1))]).then(function(h){var o3=four(h[0],h.slice(1));return o3?{q:'¿Cuáles son los 16 primeros caracteres hexadecimales del SHA-256 de «'+w+'»?',o:o3,e:'Cualquier cambio mínimo en la entrada cambia por completo el hash (efecto avalancha).'}:qHash()})}
function mountQuiz(el,gen,key){var st=JSON.parse(ls.g('pq_'+key)||'{"a":0,"n":0}');
 function show(q){var o=shuf(q.o),L='ABCD',answered=false;
  el.innerHTML='<div class="qzh"><b>🧠 Test de 4 opciones</b><span class="bp">'+st.a+' aciertos / '+st.n+' intentos</span></div><p class="qq">'+esc(q.q)+'</p><div class="opts">'+o.map(function(x,i){return '<div class="opt"><button class="pick"><span class="L">'+L[i]+'</span><pre>'+esc(x)+'</pre></button></div>'}).join('')+'</div><div class="fb" hidden></div><div class="row"><button class="nxt">↻ Otra pregunta</button></div>';
  Array.prototype.forEach.call(el.querySelectorAll('.pick'),function(b,i){b.onclick=function(){if(answered)return;answered=true;var ok=o[i]===q.o[0];st.n++;if(ok)st.a++;ls.s('pq_'+key,JSON.stringify(st));
   Array.prototype.forEach.call(el.querySelectorAll('.opt'),function(e2,j){var good=o[j]===q.o[0];e2.classList.add(good?'good':'dim');if(j===i&&!good)e2.classList.add('bad')});
   var fb=el.querySelector('.fb');fb.hidden=false;fb.innerHTML=(ok?'<span class="ok">✔ ¡Correcto!</span> ':'<span class="ko">✘ Incorrecto.</span> La correcta era la <b>'+L[o.indexOf(q.o[0])]+'</b>. ')+esc(q.e||'');el.querySelector('.bp').textContent=st.a+' aciertos / '+st.n+' intentos'}});
  el.querySelector('.nxt').onclick=next}
 function next(){Promise.resolve(gen()).then(show)}next()}
function esc(s){return String(s).replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}

document.addEventListener('DOMContentLoaded',function(){ [['qz_red',qSubnet,'red'],['qz_conv',qConv,'conv'],['qz_raid',qRaid,'raid'],['qz_hash',qHash,'hash']].forEach(function(x){var e=$(x[0]);if(e)mountQuiz(e,x[1],x[2])});
$('sub').onclick=subnet;$('ip').oninput=subnet;$('nsub').oninput=subnet;subnet();
 ['cd','cb','ch','co'].forEach(function(i){$(i).oninput=function(){conv(i)}});$('cd').value=192;conv('cd');
 ['rl','rn','rs'].forEach(function(i){$(i).oninput=raid});raid();
 $('hgo').onclick=hash;$('benc').onclick=function(){b64(true)};$('bdec').onclick=function(){b64(false)};
 var thm=$('thm');if(thm)thm.onclick=function(){var d=document.documentElement,c=d.dataset.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'),n=c==='dark'?'light':'dark';d.dataset.theme=n;ls.s('theme',n)}});
})();
