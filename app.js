(function(){
var ls={g:function(k){try{return localStorage.getItem(k)}catch(e){return null}},s:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
var t=document.getElementById('thm');if(t)t.onclick=function(){var d=document.documentElement,c=d.dataset.theme||'dark',n=c==='dark'?'light':'dark';d.dataset.theme=n;ls.s('theme',n)};
var done=JSON.parse(ls.g('done')||'{}');
var doc=document.querySelector('.doc');
if(doc){var rs=document.createElement('script');rs.src=(document.currentScript&&document.currentScript.src||'').replace(/app\.js.*$/,'')+'reader.js';document.body.appendChild(rs);var ts=document.createElement('script');ts.src=rs.src.replace('reader.js','tts.js');document.body.appendChild(ts);var rcs=document.createElement('script');rcs.src=rs.src.replace('reader.js','recall.js');document.body.appendChild(rcs);var key=doc.dataset.key,cb=document.getElementById('done'),on=document.getElementById('only');
 cb.checked=!!done[key];cb.onchange=function(){done[key]=cb.checked;ls.s('done',JSON.stringify(done))};
 on.checked=ls.g('only')==='1';function ap(){document.body.classList.toggle('only',on.checked)}ap();on.onchange=function(){ls.s('only',on.checked?'1':'0');ap()};
 if(location.hash){var el=document.querySelector(location.hash);if(el)el.scrollIntoView()}}
var tb=document.getElementById('tocbtn'),tc=document.querySelector('.toc');if(tb&&tc){tb.onclick=function(){tc.classList.toggle('open')};tc.onclick=function(e){if(e.target.tagName==='A'||e.target===tc||e.target.className==='tochead')tc.classList.remove('open')}}
var cards=document.querySelectorAll('.card');
if(cards.length){var n=0;cards.forEach(function(c){if(done[c.dataset.key]){c.classList.add('done');n++}});
 var pc=Math.round(100*n/cards.length),g=function(i){return document.getElementById(i)};if(g('pb'))g('pb').style.width=pc+'%';if(g('pt'))g('pt').textContent=n+' de '+cards.length+' temas estudiados';if(g('sdone'))g('sdone').textContent=n+' / '+cards.length;if(g('spct'))g('spct').textContent=pc+'%';if(g('sring'))g('sring').style.setProperty('--p',pc);

 var filter = document.getElementById('topic-filter');
 if (filter) {
   var state = document.getElementById('topic-state');
   var count = document.getElementById('topic-count');
   function filterTopics() {
     var total = 0;
     cards.forEach(function(card) {
       var studied = card.classList.contains('done');
       card.hidden = (state.value === 'done' && !studied) || (state.value === 'pending' && studied);
       if (!card.hidden) total++;
     });
     document.querySelectorAll('.blk').forEach(function(block) {
       block.hidden = !block.querySelector('.card:not([hidden])');
       var link = document.querySelector('.block-jump a[href="#' + block.id + '"]');
       if (link) link.hidden = block.hidden;
     });
     count.textContent = total ? total + (total === 1 ? ' tema' : ' temas') :
       (state.value === 'done' ? 'Todavía no has marcado temas como estudiados.' : 'Has completado todo el temario.');
   }
   state.addEventListener('change', filterTopics);
   filter.hidden = false;
   filterTopics();
 }
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
