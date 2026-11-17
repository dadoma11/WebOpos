(function(){
var ROOT=(document.currentScript&&document.currentScript.src||'').replace(/sqlab\.js.*$/,'');
var LS={g:function(k){try{return localStorage.getItem(k)}catch(e){return null}},s:function(k,v){try{localStorage.setItem(k,v)}catch(e){}},d:function(k){try{localStorage.removeItem(k)}catch(e){}}};
var CATS={basico:'SELECT básico',joins:'JOIN',subconsultas:'Subconsultas',vistas:'Vistas',ddl:'DDL',dml:'DML',triggers:'Triggers',transacciones:'Transacciones',algebra:'Álgebra relacional'};
var SQL,base,cfg,done=JSON.parse(LS.g('sqldone')||'{}'),waiters=[],loading=false;
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function load(cb){if(cfg&&SQL)return cb();waiters.push(cb);if(loading)return;loading=true;
 var sc=document.createElement('script');sc.src=ROOT+'vendor/sql-wasm.js';
 sc.onload=function(){Promise.all([initSqlJs({locateFile:function(f){return ROOT+'vendor/'+f}}),fetch(ROOT+'data/sql.json').then(function(r){return r.json()})]).then(function(a){SQL=a[0];base=a[1];var sv=LS.g('sqlcfg2');try{cfg=sv?JSON.parse(sv):JSON.parse(JSON.stringify(base))}catch(e){cfg=JSON.parse(JSON.stringify(base))}waiters.forEach(function(f){f()});waiters=[]})};
 document.head.appendChild(sc)}
function save(){LS.s('sqlcfg2',JSON.stringify(cfg))}
function fresh(){var d=new SQL.Database();d.run(cfg.schema);return d}
/* ---------- esquema ---------- */
function info(db){var out={};var t=db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid");
 (t.length?t[0].values:[]).forEach(function(r){var n=r[0],o={name:n,cols:[],fks:[],uq:{}};
  db.exec("SELECT name,type,\"notnull\",pk FROM pragma_table_info('"+n+"')")[0].values.forEach(function(c){o.cols.push({n:c[0],t:c[1]||'',nn:!!c[2],pk:c[3]>0})});
  var f=db.exec("SELECT \"from\",\"table\",\"to\" FROM pragma_foreign_key_list('"+n+"')");if(f.length)f[0].values.forEach(function(x){o.fks.push({from:x[0],table:x[1],to:x[2]})});
  var il=db.exec("SELECT name FROM pragma_index_list('"+n+"') WHERE \"unique\"=1 AND origin='u'");if(il.length)il[0].values.forEach(function(x){var ii=db.exec("SELECT name FROM pragma_index_info('"+x[0]+"')")[0].values;if(ii.length===1)o.uq[ii[0][0]]=1});
  out[n]=o});return out}
function theme(){var s=getComputedStyle(document.documentElement);function v(k,d){return(s.getPropertyValue(k)||d).trim()||d}
 return{card:v('--card','#fff'),fg:v('--fg','#1d2733'),mu:v('--mu','#5b6b7a'),bd:v('--bd','#d6dee6'),th:v('--th','#2d8a9e'),ac:v('--ac','#2d8a9e'),E:v('--E','#d9822b')}}
function svg(inf,names){var C=theme(),T=names.filter(function(n){return inf[n]}).map(function(n){return inf[n]});if(!T.length)return '';
 var col={};T.forEach(function(t){col[t.name]=0});
 for(var it=0;it<T.length;it++)T.forEach(function(t){t.fks.forEach(function(f){if(f.table!==t.name&&col[f.table]!==undefined&&col[f.table]<=col[t.name])col[f.table]=col[t.name]+1})});
 var HH=28,RH=21,GAP=90,VG=26,PAD=16,cols=[];
 T.forEach(function(t){var fkk={};t.fks.forEach(function(f){fkk[f.from]=1});t.w=Math.max(200,Math.max.apply(null,t.cols.map(function(c){var g=(c.pk?1:0)+(fkk[c.n]?1:0)+(t.uq[c.n]?1:0)+(c.nn&&!c.pk?1:0);return(c.n.length+c.t.length)*7.4+40+g*27}).concat([t.name.length*9+30])));t.h=HH+t.cols.length*RH;(cols[col[t.name]]=cols[col[t.name]]||[]).push(t)});
 cols=cols.filter(Boolean);var x=PAD,W=0,H=0;
 cols.forEach(function(c){var w=Math.max.apply(null,c.map(function(t){return t.w})),y=PAD;c.forEach(function(t){t.x=x;t.y=y;t.cw=w;y+=t.h+VG});H=Math.max(H,y);x+=w+GAP});W=x-GAP+PAD+34;H=H-VG+PAD;
 var o='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" font-family="system-ui,Segoe UI,Arial,sans-serif" font-size="12"><rect width="100%" height="100%" fill="'+C.card+'"/>';
 var by={};T.forEach(function(t){by[t.name]=t});
 function ry(t,cn){var i=0;t.cols.forEach(function(c,k){if(c.n===cn)i=k});return t.y+HH+i*RH+RH/2}
 T.forEach(function(t){t.fks.forEach(function(f){var r=by[f.table];if(!r)return;var rc=f.to;if(!rc){var p=r.cols.filter(function(c){return c.pk})[0];rc=p?p.n:r.cols[0].n}
  if(r===t){var y1=ry(t,f.from),y2=ry(t,rc),x1=t.x+t.w;o+='<path d="M'+x1+' '+y1+' C'+(x1+34)+' '+y1+' '+(x1+34)+' '+y2+' '+x1+' '+y2+'" fill="none" stroke="'+C.E+'" stroke-width="1.6"/><text x="'+(x1+4)+'" y="'+(y1-3)+'" fill="'+C.E+'" font-size="10" font-weight="700">N</text><text x="'+(x1+4)+'" y="'+(y2-3)+'" fill="'+C.E+'" font-size="10" font-weight="700">1</text>';return}
  var x1=t.x+t.w,y1=ry(t,f.from),x2=r.x,y2=ry(r,rc),dx=Math.max(40,(x2-x1)/2);
  o+='<path d="M'+x1+' '+y1+' C'+(x1+dx)+' '+y1+' '+(x2-dx)+' '+y2+' '+x2+' '+y2+'" fill="none" stroke="'+C.E+'" stroke-width="1.6"/><circle cx="'+x1+'" cy="'+y1+'" r="3.2" fill="'+C.E+'"/><text x="'+(x1+6)+'" y="'+(y1-5)+'" fill="'+C.E+'" font-size="10" font-weight="700">N</text><path d="M'+(x2-9)+' '+(y2-5)+' L'+x2+' '+y2+' L'+(x2-9)+' '+(y2+5)+'" fill="none" stroke="'+C.E+'" stroke-width="1.6"/><text x="'+(x2-18)+'" y="'+(y2-6)+'" fill="'+C.E+'" font-size="10" font-weight="700">1</text>'})});
 T.forEach(function(t){var fk={};t.fks.forEach(function(f){fk[f.from]=1});
  o+='<rect x="'+t.x+'" y="'+t.y+'" width="'+t.w+'" height="'+t.h+'" rx="6" fill="'+C.card+'" stroke="'+C.th+'" stroke-width="1.5"/><path d="M'+t.x+' '+(t.y+HH)+' V'+(t.y+6)+' Q'+t.x+' '+t.y+' '+(t.x+6)+' '+t.y+' H'+(t.x+t.w-6)+' Q'+(t.x+t.w)+' '+t.y+' '+(t.x+t.w)+' '+(t.y+6)+' V'+(t.y+HH)+' Z" fill="'+C.th+'"/><text x="'+(t.x+10)+'" y="'+(t.y+18)+'" fill="#fff" font-size="13" font-weight="700">'+esc(t.name)+'</text>';
  t.cols.forEach(function(c,i){var y=t.y+HH+i*RH;if(i)o+='<line x1="'+t.x+'" x2="'+(t.x+t.w)+'" y1="'+y+'" y2="'+y+'" stroke="'+C.bd+'"/>';
   var tags=[];if(c.pk)tags.push('PK');if(fk[c.n])tags.push('FK');if(t.uq[c.n])tags.push('UQ');if(c.nn&&!c.pk)tags.push('NN');
   o+='<text x="'+(t.x+10)+'" y="'+(y+15)+'" fill="'+C.fg+'" font-weight="'+(c.pk?700:400)+'"'+(c.pk?' text-decoration="underline"':'')+'>'+(c.pk?'🔑 ':'')+esc(c.n)+'</text><text x="'+(t.x+10+(c.n.length+(c.pk?3:0))*7.2+8)+'" y="'+(y+15)+'" fill="'+C.mu+'" font-size="11">'+esc(c.t)+'</text>';
   tags.forEach(function(g,k){var tx=t.x+t.w-8-(tags.length-k)*27;o+='<rect x="'+tx+'" y="'+(y+4)+'" width="25" height="13" rx="3" fill="'+(g==='PK'?C.th:g==='FK'?C.E:C.bd)+'"/><text x="'+(tx+12.5)+'" y="'+(y+14)+'" fill="'+(g==='UQ'||g==='NN'?C.fg:'#fff')+'" font-size="9" font-weight="700" text-anchor="middle">'+g+'</text>'})})});
 return o+'</svg>'}
function legend(){return '<div class="lgd"><b>Leyenda:</b> 🔑 <b>PK</b> clave primaria · <b class="fkc">FK</b> clave foránea (línea naranja: <b>N</b> lado hijo → <b>1</b> lado padre) · <b>UQ</b> único · <b>NN</b> NOT NULL</div>'}
function dl(box){var s=box.querySelector('svg');if(!s)return;var img=new Image(),w=+s.getAttribute('width'),h=+s.getAttribute('height');img.onload=function(){var c=document.createElement('canvas');c.width=w*2;c.height=h*2;var x=c.getContext('2d');x.scale(2,2);x.drawImage(img,0,0);var a=document.createElement('a');a.href=c.toDataURL('image/png');a.download='esquema.png';a.click()};img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(s))}
function diagram(inf,names,title){var h=svg(inf,names);if(!h)return '';return '<div class="erd"><div class="erdh"><b>'+esc(title)+'</b><button class="dlp">⬇ PNG</button></div><div class="erdb">'+h+'</div>'+legend()+'</div>'}
function mentioned(inf,ex){var txt=ex.statement+' '+ex.solution+' '+(ex.tablas||''),r=[];Object.keys(inf).forEach(function(n){if(new RegExp('\\b'+n+'\\b','i').test(txt))r.push(n)});r.slice().forEach(function(n){inf[n].fks.forEach(function(f){if(inf[f.table]&&r.indexOf(f.table)<0)r.push(f.table)})});return r}
/* ---------- resultados ---------- */
function resTable(r){if(!r.length)return '<p class="sub">Ejecutado correctamente (sin filas que mostrar).</p>';return r.map(function(x){return '<div class="sqlres"><table><tr>'+x.columns.map(function(c){return '<th>'+esc(c)+'</th>'}).join('')+'</tr>'+x.values.map(function(v){return '<tr>'+v.map(function(c){return '<td>'+(c===null?'<i>NULL</i>':esc(c))+'</td>'}).join('')+'</tr>'}).join('')+'</table></div><div class="sub">'+x.values.length+' fila(s)</div>'}).join('')}
function sig(r,ordered){var l=r.length?r[r.length-1]:null;if(!l)return 'NONE';var rows=l.values.map(function(v){return JSON.stringify(v.map(function(c){return typeof c==='number'?Math.round(c*1e4)/1e4:c}))});if(!ordered)rows.sort();return JSON.stringify(rows)}
function exec(db,sql,verify){var r=db.exec(sql);if(verify)r=db.exec(verify);return r}
/* ---------- tarjeta de ejercicio ---------- */
function card(ex,blk){var d=document.createElement('div');d.className='ex';d.dataset.id=ex.id;
 var stars='★★★'.slice(0,ex.nivel||1);
 d.innerHTML='<div class="exh"><span class="lv" title="Dificultad">'+stars+'</span><b>'+esc(ex.title)+'</b><span class="st">'+(done[ex.id]?'✔':'')+'</span></div><p class="stm">'+esc(ex.statement)+'</p>'+
 '<details class="erdw" open><summary>📐 Esquema de la BD de este ejercicio</summary><div class="erdhost"></div></details>'+
 '<textarea spellcheck="false" placeholder="Escribe aquí tu SQL (Ctrl+Enter para ejecutar)"></textarea>'+
 '<div class="row"><button class="run">▶ Ejecutar</button><button class="chk">✔ Comprobar</button><button class="hnt">💡 Pista</button><button class="sol">👁 Solución</button><button class="edt">✏️</button><span class="vd"></span></div><div class="hn" hidden></div><div class="so" hidden></div><div class="o"></div><div class="edf" hidden></div>';
 var ta=d.querySelector('textarea');ta.value=LS.g('sqldraft_'+ex.id)||'';ta.oninput=function(){LS.s('sqldraft_'+ex.id,ta.value)};
 var db0=fresh(),inf=info(db0),nm=mentioned(inf,ex);if(!nm.length)nm=Object.keys(inf);
 d.querySelector('.erdhost').innerHTML=diagram(inf,nm,'Tablas implicadas');
 function run(chk){var o=d.querySelector('.o'),v=d.querySelector('.vd');v.textContent='';try{var db=fresh();var r=exec(db,ta.value,ex.verify&&chk?ex.verify:null);
   o.innerHTML=resTable(r);if(chk){var d2=fresh(),s=exec(d2,ex.solution,ex.verify),ord=/order by/i.test(ex.solution)&&!ex.verify;var ok=sig(r,ord)===sig(s,ord);v.innerHTML=ok?'<span class="ok">✔ Correcto</span>':'<span class="ko">✘ No coincide con el resultado esperado</span>';
    if(ok){done[ex.id]=1;LS.s('sqldone',JSON.stringify(done));d.querySelector('.st').textContent='✔';progress(blk)}}
  }catch(x){o.innerHTML='<div class="out ko">'+esc(x.message)+'</div>'}}
 d.querySelector('.run').onclick=function(){run(false)};d.querySelector('.chk').onclick=function(){run(true)};
 ta.onkeydown=function(e){if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();run(false)}};
 d.querySelector('.hnt').onclick=function(){var h=d.querySelector('.hn');h.hidden=!h.hidden;h.textContent='💡 '+(ex.hint||'Sin pista.')};
 d.querySelector('.sol').onclick=function(){var s=d.querySelector('.so');if(!s.hidden){s.hidden=true;return}s.hidden=false;
  var html='<div class="out">'+esc(ex.solution)+'</div>';
  try{var db=fresh();db.exec(ex.solution);var inf2=info(db),n2=Object.keys(inf2).filter(function(n){return !inf[n]||nm.indexOf(n)>=0});
   var newt=Object.keys(inf2).filter(function(n){return !inf[n]});if(newt.length||/alter|index/i.test(ex.solution)){var names=nm.filter(function(n){return inf2[n]}).concat(newt);html+=diagram(inf2,names,'Estructura resultante tras la solución')}}catch(e){}
  if(ex.verify)html+='<div class="sub">Comprobación: <code>'+esc(ex.verify)+'</code></div>';s.innerHTML=html;bindDl(s)};
 var ef=d.querySelector('.edf');d.querySelector('.edt').onclick=function(){ef.hidden=!ef.hidden;if(ef.hidden)return;
  ef.innerHTML='<label class="f">Categoría<select class="e_cat">'+Object.keys(CATS).map(function(k){return '<option value="'+k+'"'+(k===ex.cat?' selected':'')+'>'+CATS[k]+'</option>'}).join('')+'</select></label><label class="f">Título<input type="text" class="e_t" value="'+esc(ex.title)+'"></label><label class="f">Enunciado<textarea class="e_s" style="min-height:60px">'+esc(ex.statement)+'</textarea></label><label class="f">Solución<textarea class="e_so" style="min-height:70px">'+esc(ex.solution)+'</textarea></label><label class="f">Comprobación opcional (SELECT que se ejecuta tras el script)<textarea class="e_v" style="min-height:44px">'+esc(ex.verify||'')+'</textarea></label><label class="f">Pista<input type="text" class="e_h" value="'+esc(ex.hint||'')+'"></label><label class="f">Tablas a mostrar en el esquema (separadas por coma; vacío = automático)<input type="text" class="e_tb" value="'+esc(ex.tablas||'')+'"></label><div class="row"><button class="e_ok">Guardar</button><button class="e_del">Borrar ejercicio</button></div>';
  ef.querySelector('.e_ok').onclick=function(){ex.cat=ef.querySelector('.e_cat').value;ex.title=ef.querySelector('.e_t').value;ex.statement=ef.querySelector('.e_s').value;ex.solution=ef.querySelector('.e_so').value;ex.verify=ef.querySelector('.e_v').value||undefined;ex.hint=ef.querySelector('.e_h').value;ex.tablas=ef.querySelector('.e_tb').value||undefined;save();blk.render()};
  ef.querySelector('.e_del').onclick=function(){if(confirm('¿Borrar este ejercicio?')){cfg.exercises.splice(cfg.exercises.indexOf(ex),1);save();blk.render()}}};
 bindDl(d);return d}
function bindDl(root){Array.prototype.forEach.call(root.querySelectorAll('.erd'),function(b){var bt=b.querySelector('.dlp');if(bt)bt.onclick=function(){dl(b)}})}
function progress(blk){var l=blk.list.filter(function(e){return done[e.id]}).length;var p=blk.el.querySelector('.bp');if(p)p.textContent=l+' / '+blk.list.length+' resueltos'}
/* ---------- bloque ---------- */
function mount(el){var cats=(el.dataset.cats||'').split(',').filter(Boolean),all=!cats.length,blk={el:el,list:[]};
 blk.render=function(){var cs=all?Object.keys(CATS):cats;blk.list=cfg.exercises.filter(function(e){return cs.indexOf(e.cat)>=0});
  var cur=el.dataset.cur||(all?'':'*');
  var h='<div class="sqlh"><b>🧪 Practica SQL'+(el.dataset.title?' · '+esc(el.dataset.title):'')+'</b><span class="bp"></span></div><p class="sub">Cada ejercicio parte de una base de datos nueva (SQLite en tu navegador). <b>Ejecutar</b> prueba tu consulta; <b>Comprobar</b> la compara con la solución.</p>';
  if(all){h+='<div class="exlist"><button data-c="" class="'+(cur===''?'on':'')+'">Todos</button>'+cs.map(function(c){return '<button data-c="'+c+'" class="'+(cur===c?'on':'')+'">'+CATS[c]+'</button>'}).join('')+'</div>'}
  h+='<details class="erdw" open><summary>📐 Esquema completo de la base de datos de prácticas</summary><div class="fullerd"></div></details><div class="exs"></div><div class="row"><button class="newex">+ Nuevo ejercicio</button></div>';
  el.innerHTML=h;
  var inf=info(fresh());el.querySelector('.fullerd').innerHTML=diagram(inf,Object.keys(inf),'Base de datos de prácticas: tablas, claves y relaciones');bindDl(el);
  var box=el.querySelector('.exs');blk.list.filter(function(e){return all?(!cur||e.cat===cur):true}).forEach(function(e){box.appendChild(card(e,blk))});progress(blk);
  Array.prototype.forEach.call(el.querySelectorAll('.exlist button'),function(b){b.onclick=function(){el.dataset.cur=b.dataset.c;blk.render()}});
  el.querySelector('.newex').onclick=function(){cfg.exercises.push({id:'x'+Date.now(),cat:cats[0]||el.dataset.cur||'basico',nivel:1,title:'Nuevo ejercicio',statement:'Escribe el enunciado',solution:'SELECT 1;',hint:''});save();blk.render();var cs=el.querySelectorAll('.ex');if(cs.length){var l=cs[cs.length-1];l.scrollIntoView();l.querySelector('.edt').click()}}};
 blk.render()}
/* ---------- consola libre ---------- */
function mountConsole(el){var db;function reset(){db=fresh()}reset();
 el.innerHTML='<div class="sqlh"><b>🖥️ Consola SQL libre</b></div><p class="sub">Base de datos persistente mientras no la reinicies (los INSERT, UPDATE, CREATE… se conservan entre ejecuciones). Ctrl+Enter ejecuta.</p><details class="erdw" open><summary>📐 Esquema actual</summary><div class="cerd"></div></details><textarea spellcheck="false" id="cin">SELECT * FROM Empleados;</textarea><div class="row"><button class="run">▶ Ejecutar</button><button class="rst">↺ Reiniciar BD</button><button class="sch">Editar esquema/datos</button><button class="exp">⬇ Exportar ejercicios</button><label class="chip">⬆ Importar<input type="file" accept=".json" hidden></label><button class="rall">Restaurar ejercicios originales</button></div><div class="o"></div><div class="sce" hidden><textarea class="sct" style="min-height:200px"></textarea><div class="row"><button class="scs">Guardar y reiniciar</button><span class="scm"></span></div></div>';
 function er(){var inf=info(db);el.querySelector('.cerd').innerHTML=diagram(inf,Object.keys(inf),'Estado actual de la BD');bindDl(el)}er();
 var ta=el.querySelector('#cin');function run(){try{var r=db.exec(ta.value);el.querySelector('.o').innerHTML=resTable(r);er()}catch(x){el.querySelector('.o').innerHTML='<div class="out ko">'+esc(x.message)+'</div>'}}
 el.querySelector('.run').onclick=run;ta.onkeydown=function(e){if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();run()}};
 el.querySelector('.rst').onclick=function(){reset();er();el.querySelector('.o').innerHTML='<p class="sub">BD reiniciada.</p>'};
 var sc=el.querySelector('.sce');el.querySelector('.sch').onclick=function(){sc.hidden=!sc.hidden;el.querySelector('.sct').value=cfg.schema};
 el.querySelector('.scs').onclick=function(){try{cfg.schema=el.querySelector('.sct').value;fresh();save();reset();er();el.querySelector('.scm').innerHTML='<span class="ok">Esquema guardado (los ejercicios usarán esta BD)</span>'}catch(x){el.querySelector('.scm').innerHTML='<span class="ko">'+esc(x.message)+'</span>'}};
 el.querySelector('.exp').onclick=function(){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(cfg,null,1)],{type:'application/json'}));a.download='sql.json';a.click()};
 el.querySelector('input[type=file]').onchange=function(){var f=this.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{cfg=JSON.parse(r.result);save();location.reload()}catch(x){alert('JSON no válido')}};r.readAsText(f)};
 el.querySelector('.rall').onclick=function(){if(confirm('Se perderán tus cambios locales en ejercicios y esquema.')){LS.d('sqlcfg2');location.reload()}}}
/* ---------- fragmentos SQL del temario ---------- */
function inlineRun(){var doc=document.querySelector('.doc');if(!doc||!document.querySelector('.sqlab'))return;
 var re=/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|BEGIN|COMMIT|ROLLBACK|WITH)\b/i;
 Array.prototype.forEach.call(doc.querySelectorAll('code'),function(c){var t=c.textContent.trim();if(!re.test(t)||t.length<12||c.closest('.sqlab'))return;
  var b=document.createElement('button');b.className='tryb';b.textContent='▶ Probar';b.title='Ejecuta este fragmento en la BD de prácticas';c.after(b);
  b.onclick=function(){var nx=b.nextElementSibling;if(nx&&nx.classList.contains('tryw')){nx.remove();return}
   var w=document.createElement('div');w.className='tryw';w.innerHTML='<textarea spellcheck="false"></textarea><div class="row"><button class="run">▶ Ejecutar</button><span class="sub">BD de prácticas nueva en cada ejecución · edítalo libremente</span></div><div class="o"></div>';
   var ta=w.querySelector('textarea');ta.value=t.replace(/…/g,'').replace(/\s*;?$/,';');b.after(w);
   var go=function(){try{w.querySelector('.o').innerHTML=resTable(fresh().exec(ta.value))}catch(x){w.querySelector('.o').innerHTML='<div class="out ko">'+esc(x.message)+'</div>'}};w.querySelector('.run').onclick=go;ta.onkeydown=function(e){if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();go()}};
   var ts=Object.keys(info(fresh()));w.querySelector('.sub').insertAdjacentHTML('beforeend',' · tablas: '+ts.join(', '))}})}
document.addEventListener('DOMContentLoaded',function(){var bl=document.querySelectorAll('.sqlab');if(!bl.length)return;
 load(function(){Array.prototype.forEach.call(bl,function(el){if(el.dataset.console)mountConsole(el);else mount(el)});inlineRun()})});
})();
