/* Dificultad de las preguntas: 1 fácil · 2 media · 3 difícil.
   Las del banco traen q.df (calculado con tools/difficulty.py); las generadas (casos) lo reciben de casos.js.
   Planificación de tests por dificultad: DIFF.plan(pool, n, modo) con modo any|easy|mid|hard|real. */
(function(){
var N={1:'Fácil',2:'Media',3:'Difícil'},ICO={1:'🟢',2:'🟡',3:'🔴'};
function lvl(q){return q.df||2}
function chip(q){var l=lvl(q);return '<i class="df df'+l+'" title="Dificultad estimada: '+N[l].toLowerCase()+'">'+ICO[l]+' '+N[l]+'</i>'}
function shuf(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
var REAL=[.30,.45,.25]; // reparto de un examen realista: 30 % fáciles · 45 % medias · 25 % difíciles
/* cuántas de cada nivel para n preguntas según el modo */
var SOFT={easy:[.55,.35,.10],mid:[.20,.60,.20],hard:[.10,.35,.55],real:REAL}; // para casos generados (pocas candidatas): inclinación en vez de nivel puro
function counts(n,mode,have,soft){var w=soft?SOFT[mode]:mode==='easy'?[1,0,0]:mode==='mid'?[0,1,0]:mode==='hard'?[0,0,1]:REAL,c=w.map(function(x){return Math.floor(n*x)}),r=n-c[0]-c[1]-c[2],ord=[0,1,2].sort(function(a,b){return w[b]-w[a]}),i;
 for(i=0;r>0;i=(i+1)%3){if(w[ord[i]]>0){c[ord[i]]++;r--}}
 /* si falta de un nivel, se completa con el más cercano */
 var order=mode==='easy'?[0,1,2]:mode==='hard'?[2,1,0]:mode==='mid'?[1,0,2]:[1,0,2],short=0,out=c.slice();
 for(i=0;i<3;i++){if(out[i]>have[i]){short+=out[i]-have[i];out[i]=have[i]}}
 for(var k=0;k<3&&short>0;k++){var l=order[k];var room=have[l]-out[l];if(room>0){var t=Math.min(room,short);out[l]+=t;short-=t}}
 return out}
/* orden profesional: arranque suave, difíciles repartidas, sin rachas del mismo nivel ni del mismo tema seguidos */
function interleave(lv){var tot=lv.map(function(x){return x.length}),N0=tot[0]+tot[1]+tot[2],tk=[0,0,0],res=[],run=0,last=-1;
 for(var i=0;i<N0;i++){var b=-1,bd=-1e9;for(var l=0;l<3;l++){if(tk[l]>=tot[l])continue;var d=tot[l]*(i+1)/N0-tk[l]+Math.random()*.4;
   if(l===last&&run>=2)d-=5;if(l===2&&i<2)d-=5;if(l===2&&i===N0-1&&tot[1]>tk[1])d-=1;if(d>bd){bd=d;b=l}}
  run=b===last?run+1:1;last=b;res.push(lv[b][tk[b]++])}
 for(var j=1;j<res.length-1;j++){if(res[j].k===res[j-1].k){for(var m=j+1;m<res.length;m++){if(res[m].k!==res[j-1].k&&lvl(res[m])===lvl(res[j])&&res[m].k!==(res[j+1]||{}).k){var t=res[j];res[j]=res[m];res[m]=t;break}}}}
 return res}
/* pool: preguntas candidatas; pick(arr,n) elige n de un nivel (por defecto al azar). Devuelve {list, got:[f,m,d], want:[f,m,d]} */
/* ordena las listas por nivel [f,m,d]: realista = intercalado; resto = al azar */
function arrange(lv,mode){return mode==='real'?interleave(lv):shuf([].concat(lv[0],lv[1],lv[2]))}
function plan(pool,n,mode,pick){pick=pick||function(a,k){return shuf(a).slice(0,k)};n=Math.min(n,pool.length);
 if(!mode||mode==='any')return {list:pick(pool,n),got:null,want:null};
 var by=[[],[],[]];pool.forEach(function(q){by[lvl(q)-1].push(q)});
 var want=counts(n,mode,[n,n,n]),got=counts(n,mode,by.map(function(a){return a.length})),lv=by.map(function(a,i){return pick(a,got[i])});
 return {list:arrange(lv,mode),lv:lv,got:got,want:want}}
window.DIFF={N:N,ICO:ICO,lvl:lvl,chip:chip,plan:plan,arrange:arrange,counts:counts,REAL:REAL,NAMES:{any:'Cualquiera',easy:'Fácil',mid:'Media',hard:'Difícil',real:'Realista'}};
})();
