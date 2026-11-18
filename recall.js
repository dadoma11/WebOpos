/* Modo recordar: oculta los términos en negrita del resumen; toca uno para ver la respuesta */
(function(){var doc=document.querySelector('.doc'),bar=doc&&doc.querySelector('.bar');if(!bar)return;
var LS={g:function(k){try{return localStorage.getItem(k)}catch(e){return null}},s:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
var lab=document.createElement('label');lab.className='chip';lab.innerHTML='<input type="checkbox" id="rcl"> 🧠 Modo recordar';
var all=document.createElement('button');all.className='chip rcall';all.hidden=true;all.type='button';
bar.appendChild(lab);bar.appendChild(all);var cb=lab.querySelector('input');
function bolds(){return doc.querySelectorAll('li b,p b,td b')}
function stat(){var n=bolds().length,v=doc.querySelectorAll('.rv').length;all.textContent=v>=n?'Ocultar todo':'Revelar todo ('+(n-v)+' ocultos)'}
function ap(){document.body.classList.toggle('recall',cb.checked);all.hidden=!cb.checked;if(cb.checked)stat()}
cb.checked=LS.g('recall')==='1';ap();
cb.onchange=function(){LS.s('recall',cb.checked?'1':'0');doc.querySelectorAll('.rv').forEach(function(e){e.classList.remove('rv')});ap()};
doc.addEventListener('click',function(e){if(!document.body.classList.contains('recall'))return;var b=e.target.closest&&e.target.closest('li b,p b,td b');if(!b)return;b.classList.toggle('rv');stat()});
all.onclick=function(){var n=bolds().length,v=doc.querySelectorAll('.rv').length,show=v<n;bolds().forEach(function(b){b.classList.toggle('rv',show)});stat()}})();
