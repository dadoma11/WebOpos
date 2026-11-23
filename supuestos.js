/* Zona «Supuestos de examen» de Prácticas: lanza un supuesto práctico suelto (como la parte 2 del simulacro). */
(function(){
var $=function(i){return document.getElementById(i)};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function show(z,keep){var b=z==='s';$('zp').hidden=b;$('zs').hidden=!b;$('tzp').className=b?'':'on';$('tzs').className=b?'on':'';$('tzp').setAttribute('aria-selected',!b);$('tzs').setAttribute('aria-selected',b);if(!keep){try{history.replaceState(null,'',b?'#supuestos':location.pathname+location.search)}catch(e){}}if(b)hist()}
$('tzp').onclick=function(){show('p')};$('tzs').onclick=function(){show('s')};
function bloque(){return document.querySelector('input[name=sb]:checked').value}
function fill(){var b=bloque(),l=window.CASOS?CASOS.info.filter(function(c){return String(c.b)===b}):[];$('scase').innerHTML='<option value="">Aleatorio (uno distinto cada vez)</option>'+l.map(function(c){return '<option value="'+esc(c.id)+'">'+esc(c.t)+(c.db?' · con base de datos':'')+'</option>'}).join('');lab()}
function lab(){var o=$('scase'),t=o.value?o.options[o.selectedIndex].text.replace(/ · con base de datos$/,''):'Bloque '+(bloque()==='3'?'III':'IV')+' al azar';$('sgo').textContent='▶ Empezar · '+t+' · 20 preguntas · 24 min'}
document.querySelectorAll('input[name=sb]').forEach(function(r){r.onchange=fill});$('scase').onchange=lab;
$('sgo').onclick=function(){var u='examinate.html?supuesto='+bloque()+($('scase').value?'&caso='+encodeURIComponent($('scase').value):'')+($('sest').checked?'&estudio=1':'');location.href=u};
function hist(){var l=[];try{l=JSON.parse(localStorage.getItem(AUTH.key('ex_hist'))||'[]')}catch(e){}l=l.filter(function(x){return x.m==='sup'}).slice(-8).reverse();if(!l.length)return;
 var avg=l.reduce(function(a,x){return a+x.nota},0)/l.length;
 $('shl').innerHTML='<p class="sub">Nota media de los últimos '+l.length+': <b>'+avg.toFixed(2)+'</b> sobre 10</p>'+l.map(function(x){var n=x.n||1,d=x.a-x.e/3,M=.3*n,g=d>=M?25+25*(d-M)/(n-M):25*Math.max(d,0)/M;return '<div class="shr"><b class="'+(g>=25?'ok':'ko')+'">'+g.toFixed(1)+' / 50</b><span>✔'+x.a+' ✘'+x.e+' ○'+x.b+' de '+n+' · '+(g>=25?'apto':'no apto')+'</span><small>'+new Date(x.t).toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+'</small></div>'}).join('')}
fill();if(/supuestos/.test(location.hash))show('s',true);window.addEventListener('hashchange',function(){show(/supuestos/.test(location.hash)?'s':'p',true)});
})();
