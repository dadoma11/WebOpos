(function(){
var ls={g:function(k){try{return localStorage.getItem(k)}catch(e){return null}},s:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
var t=document.getElementById('thm');if(t)t.onclick=function(){var d=document.documentElement,c=d.dataset.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'),n=c==='dark'?'light':'dark';d.dataset.theme=n;ls.s('theme',n)};
var done=JSON.parse(ls.g('done')||'{}');
var doc=document.querySelector('.doc');
if(doc){var key=doc.dataset.key,cb=document.getElementById('done'),on=document.getElementById('only');
 cb.checked=!!done[key];cb.onchange=function(){done[key]=cb.checked;ls.s('done',JSON.stringify(done))};
 on.checked=ls.g('only')==='1';function ap(){document.body.classList.toggle('only',on.checked)}ap();on.onchange=function(){ls.s('only',on.checked?'1':'0');ap()};
 if(location.hash){var el=document.querySelector(location.hash);if(el)el.scrollIntoView()}}
var cards=document.querySelectorAll('.card');
if(cards.length){var n=0;cards.forEach(function(c){if(done[c.dataset.key]){c.classList.add('done');n++}});
 document.getElementById('pb').style.width=(100*n/cards.length)+'%';document.getElementById('pt').textContent=n+' de '+cards.length+' temas estudiados';
 var q=document.getElementById('q'),res=document.getElementById('res'),idx=null,tm;
 function esc(s){return s.replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
 function norm(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
 function run(){var v=norm(q.value.trim());if(v.length<2){res.innerHTML='';return}
  var go=function(){var w=v.split(/\s+/),out=[];
   for(var i=0;i<idx.length;i++){var e=idx[i],tx=e.n||(e.n=norm(e.h+' '+e.x)),sc=0,ok=true;
    for(var j=0;j<w.length;j++){var p=tx.indexOf(w[j]);if(p<0){ok=false;break}sc+=1+(norm(e.h).indexOf(w[j])>=0?3:0)}
    if(ok)out.push([sc,e,tx.indexOf(w[0])])}
   out.sort(function(a,b){return b[0]-a[0]});
   res.innerHTML=out.slice(0,25).map(function(o){var e=o[1],p=Math.max(0,o[2]-50),sn=esc(e.x.substr(p,170));
    sn=sn.replace(new RegExp('('+w[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig'),'<mark>$1</mark>');
    return '<a href="t/'+e.k+'.html'+(e.s>=0?'#s'+e.s:'')+'"><b>'+e.l+'</b> · '+esc(e.h)+'<small>…'+sn+'…</small></a>'}).join('')||'<p class="sub">Sin resultados</p>'};
  if(idx)go();else fetch('data/search.json').then(function(r){return r.json()}).then(function(j){idx=j;go()})}
 q.oninput=function(){clearTimeout(tm);tm=setTimeout(run,150)}}
})();
