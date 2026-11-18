/* Generador ilimitado de supuestos prácticos (datos y enunciados aleatorios; las respuestas se calculan) */
(function(root){
'use strict';
var R=Math.random;
function rnd(n){return Math.floor(R()*n)}
function pick(a){return a[rnd(a.length)]}
function shuf(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=rnd(i+1),t=a[i];a[i]=a[j];a[j]=t}return a}
function take(a,n){return shuf(a).slice(0,n)}
function ri(a,b){return a+rnd(b-a+1)}
function esc(s){return String(s).replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
function fmt(x){x=Math.round(x*100)/100;return String(x).replace('.',',')}
function mk(text,ok,bad,e){var o=[ok];bad.forEach(function(b){if(o.indexOf(b)<0)o.push(b)});if(o.length<4)throw new Error('opciones insuficientes: '+text);o=o.slice(0,4);var s=shuf(o);return {q:text,o:s,c:s.indexOf(ok),e:e||''}}
function near(n,cands){var r=[];cands.forEach(function(x){if(x!==n&&x>=0&&r.indexOf(x)<0)r.push(x)});var k=1;while(r.length<3){[n+k,n-k,n+2*k+1].forEach(function(x){if(x!==n&&x>=0&&r.length<3&&r.indexOf(x)<0)r.push(x)});k++}return r.slice(0,3)}
function nq(text,n,cands,e,suf){suf=suf||'';return mk(text,n+suf,near(n,cands).map(function(x){return x+suf}),e)}
function pad(n){return n<10?'0'+n:''+n}
function dstr(y,m,d){return y+'-'+pad(m)+'-'+pad(d)}
function addDays(s,n){var d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return dstr(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate())}
function chooseMix(fixed,dyn,total){ // mezcla de conceptuales (fixed) y calculadas (dyn), siempre 'total'
  var nd=Math.min(dyn.length,total-Math.min(fixed.length,6)),nf=total-nd,F=shuf(fixed),D=shuf(dyn),out=F.slice(0,nf).concat(D.slice(0,nd));
  var rest=F.slice(nf).concat(D.slice(nd));while(out.length<total&&rest.length)out.push(rest.shift());return shuf(out)}
function hrs(n){return n+(n===1?' hora':' horas')}
function tbl(name,cols,rows,pk,fk){return {name:name,cols:cols,rows:rows,pk:pk||[],fk:fk||{}}}

/* ================= BLOQUE III · base de datos: préstamos ================= */
var NOMB=['Ana Ruiz','Luis Gil','Marta Sanz','Pedro Mora','Lucía Vega','Raúl Cano','Irene Lara','Sergio Pons','Elena Cruz','Hugo Marín','Carla Nieto','Iván Soto','Rosa Pardo','Diego Bravo','Nuria Calvo','Óscar Ibáñez'];
var LOCA=['Toledo','Madrid','Getafe','Alcalá','Leganés','Talavera','Illescas','Ocaña'];
var LIBR=[['Redes de computadores','Tanenbaum','Informática',2012],['Bases de datos','Date','Informática',2004],['Sistemas operativos','Silberschatz','Informática',2018],['Compiladores','Aho','Informática',2006],['Ingeniería del software','Sommerville','Informática',2011],['Algoritmos','Cormen','Informática',2009],['Cien años de soledad','García Márquez','Novela',1967],['El Quijote','Cervantes','Novela',1605],['La Regenta','Clarín','Novela',1885],['Fortunata y Jacinta','Galdós','Novela',1887],['La sombra del viento','Ruiz Zafón','Novela',2001],['Historia de España','Fusi','Historia',2000],['Los Austrias','Elliott','Historia',1963],['Cosmos','Sagan','Ciencia',1980],['El gen egoísta','Dawkins','Ciencia',1976]];
var MUN=['Toledo','Getafe','Alcalá de Henares','Talavera de la Reina','Illescas','Ocaña','Leganés'];

function genPrestamos(){
  var ent=pick(['biblioteca municipal','biblioteca universitaria','biblioteca de la delegación','biblioteca del organismo']),mun=pick(MUN);
  var nS=ri(6,8),socios=take(NOMB,nS),locs=take(LOCA,3);
  var S=socios.map(function(n,i){return [i+1,n,pick(locs),dstr(ri(2019,2024),ri(1,12),ri(1,28))]});
  var nL=ri(8,9),L=take(LIBR,nL).map(function(l,i){return ['L'+pad(i+1),l[0],l[1],l[2],l[3],ri(1,5)]});
  var nuncaS=S[S.length-1][0],nuncaL=L[L.length-1][0],P=[],nP=ri(12,15),f=ri(0,40),prevD='2024-01-05';
  for(var i=0;i<nP;i++){var s=pick(S.slice(0,S.length-1))[0],l=pick(L.slice(0,L.length-1))[0];prevD=addDays(prevD,ri(2,9));P.push([i+1,s,l,prevD,R()<.35?null:addDays(prevD,14)])}
  var sCnt={},lCnt={};P.forEach(function(p){sCnt[p[1]]=(sCnt[p[1]]||0)+1;lCnt[p[2]]=(lCnt[p[2]]||0)+1});
  function tops(c){var m=0,ks=[];Object.keys(c).forEach(function(k){if(c[k]>m){m=c[k];ks=[k]}else if(c[k]===m)ks.push(k)});return {m:m,ks:ks}}
  var tl=tops(lCnt);if(tl.ks.length!==1)return null;
  var gSum={};L.forEach(function(l){gSum[l[3]]=(gSum[l[3]]||0)+l[5]});var gk=Object.keys(gSum).sort(function(a,b){return gSum[b]-gSum[a]});if(gSum[gk[0]]===gSum[gk[1]])return null;
  var db=[tbl('SOCIO',['id_socio','nombre','localidad','fecha_alta'],S,['id_socio']),tbl('LIBRO',['isbn','titulo','autor','genero','anio','ejemplares'],L,['isbn']),tbl('PRESTAMO',['id_prestamo','id_socio','isbn','f_prestamo','f_devolucion'],P,['id_prestamo'],{id_socio:'SOCIO.id_socio',isbn:'LIBRO.isbn'})];
  var T=function(i){return L.filter(function(l){return l[0]===i})[0][1]};
  var fixed=[],dyn=[];
  fixed.push(mk('¿Cuál es la clave primaria más adecuada de la tabla PRESTAMO?','id_prestamo',['id_socio','(id_socio, isbn), porque un socio no puede llevarse dos veces el mismo libro','f_prestamo'],'Un mismo socio puede pedir el mismo libro varias veces, así que (id_socio, isbn) no es único.'));
  fixed.push(mk('¿Cuántas claves foráneas tiene PRESTAMO y a qué tablas apunta?','Dos: id_socio → SOCIO e isbn → LIBRO',['Una: id_socio → SOCIO','Tres: id_socio, isbn e id_prestamo','Ninguna: las claves foráneas solo se definen en las tablas maestras'],'PRESTAMO resuelve la relación N:M entre SOCIO y LIBRO y contiene las dos claves foráneas.'));
  fixed.push(mk("Si el campo 'autor' de LIBRO guardara varios autores separados por comas, ¿qué forma normal incumpliría?",'La 1FN, porque el atributo no es atómico',['La 2FN, por dependencia parcial de la clave','La 3FN, por dependencia transitiva','Solo la forma normal de Boyce-Codd'],'La 1FN exige valores atómicos: una sola cosa por celda.'));
  fixed.push(mk('Con FOREIGN KEY (id_socio) REFERENCES SOCIO ON DELETE RESTRICT, ¿qué ocurre al borrar un socio que tiene préstamos?','El SGBD rechaza el borrado',['Se borran también sus préstamos','Los préstamos pasan a tener id_socio = NULL','El borrado se hace y queda un préstamo huérfano'],'RESTRICT impide borrar la fila referenciada; CASCADE borraría en cascada y SET NULL anularía la clave.'));
  fixed.push(mk('Se consultan a menudo los préstamos por rango de fechas. ¿Qué es lo más adecuado?','Crear un índice sobre PRESTAMO(f_prestamo)',['Crear un índice sobre LIBRO(titulo)','Eliminar la clave primaria de PRESTAMO','Duplicar la fecha en la tabla SOCIO'],'Un índice (B-tree) sobre la columna del filtro acelera consultas por rango.'));
  fixed.push(mk('Registrar un préstamo y restar un ejemplar disponible debe hacerse como una unidad: o ambas cosas o ninguna. ¿Qué propiedad ACID lo garantiza?','Atomicidad',['Consistencia','Aislamiento','Durabilidad'],'La atomicidad hace que la transacción sea «todo o nada».'));
  fixed.push(mk('¿Qué tipo de relación hay entre SOCIO y LIBRO y cómo se resuelve en el modelo relacional?','N:M, mediante la tabla intermedia PRESTAMO',['1:N, mediante una clave foránea en SOCIO','1:1, fusionando ambas tablas','N:M, mediante una vista'],'Un socio se lleva muchos libros y un libro lo llevan muchos socios.'));
  fixed.push(mk('¿Qué sentencia añade a LIBRO una columna «editorial»?','ALTER TABLE LIBRO ADD editorial VARCHAR(60);',['UPDATE LIBRO ADD editorial VARCHAR(60);','INSERT INTO LIBRO (editorial) VARCHAR(60);','MODIFY TABLE LIBRO NEW editorial;'],'ALTER TABLE es DDL y modifica la estructura.'));
  fixed.push(mk('¿Qué sentencia concede a un usuario solo lectura sobre LIBRO?','GRANT SELECT ON LIBRO TO consulta;',['ALTER USER consulta SELECT ON LIBRO;','COMMIT SELECT ON LIBRO TO consulta;','REVOKE ALL ON LIBRO FROM consulta;'],'GRANT/REVOKE son DCL (control de acceso).'));
  fixed.push(mk('Para ofrecer una consulta ya preparada de «préstamos sin devolver» sin dar acceso a las tablas completas, ¿qué objeto conviene crear?','Una vista (CREATE VIEW)',['Un disparador de lectura','Un índice agrupado','Una copia física de la tabla PRESTAMO'],'Una vista guarda una consulta y limita las filas y columnas visibles.'));
  fixed.push(mk('Una lectura SELECT dentro de una transacción devuelve datos de otra transacción que luego hace ROLLBACK. ¿Cómo se llama el problema?','Lectura sucia (dirty read)',['Lectura no repetible','Lectura fantasma','Interbloqueo (deadlock)'],'READ COMMITTED y superiores evitan las lecturas sucias.'));
  var pend=P.filter(function(p){return p[4]===null}).length,devo=P.length-pend;
  dyn.push(nq('¿Qué devuelve SELECT COUNT(*) FROM PRESTAMO WHERE f_devolucion IS NULL;?',pend,[devo,P.length,0],'IS NULL localiza los préstamos sin devolver: hay '+pend+'.'));
  dyn.push(nq('¿Qué devuelve SELECT COUNT(f_devolucion) FROM PRESTAMO;?',devo,[P.length,pend,0],'COUNT(columna) no cuenta los NULL: COUNT(*) devuelve '+P.length+' y COUNT(f_devolucion) '+devo+'.'));
  var tid=tl.ks[0],dS={};P.filter(function(p){return p[2]===tid}).forEach(function(p){dS[p[1]]=1});var nd=Object.keys(dS).length;
  dyn.push(nq("¿Cuántos socios distintos han retirado alguna vez el libro '"+tid+"'?",nd,[lCnt[tid],nd+2,1],'Hay '+lCnt[tid]+' préstamos de '+tid+', de '+nd+' socios distintos; DISTINCT cuenta cada socio una vez.'));
  var k=2,ok=socios.length?S.filter(function(s){return (sCnt[s[0]]||0)>=k}).map(function(s){return s[1]}).sort():[];
  if(ok.length>=1&&ok.length<S.length-1){var allS=S.filter(function(s){return sCnt[s[0]]}).map(function(s){return s[1]}).sort().join(', ');dyn.push(mk('¿Qué socios devuelve SELECT s.nombre FROM SOCIO s JOIN PRESTAMO p ON p.id_socio=s.id_socio GROUP BY s.id_socio HAVING COUNT(*)>='+k+'?',ok.join(', '),[allS,S.map(function(s){return s[1]}).sort().join(', '),'Ninguno: HAVING no admite COUNT'],'HAVING filtra grupos tras agrupar: socios con '+k+' o más préstamos.'))}
  dyn.push(mk('¿Qué consulta lista los socios que nunca han pedido un libro?','SELECT s.nombre FROM SOCIO s LEFT JOIN PRESTAMO p ON p.id_socio=s.id_socio WHERE p.id_prestamo IS NULL;',['SELECT s.nombre FROM SOCIO s INNER JOIN PRESTAMO p ON p.id_socio=s.id_socio WHERE p.id_prestamo IS NULL;','SELECT s.nombre FROM SOCIO s RIGHT JOIN PRESTAMO p ON p.id_socio=s.id_socio;','SELECT nombre FROM SOCIO WHERE id_socio = ALL (SELECT id_socio FROM PRESTAMO);'],'LEFT JOIN conserva todos los socios y los que no tienen préstamo salen con NULL: aquí, '+S[S.length-1][1]+'.'));
  dyn.push(mk('¿Qué género suma más ejemplares en total (SUM de ejemplares agrupado por género)?',gk[0]+' ('+gSum[gk[0]]+')',gk.slice(1,4).map(function(g){return g+' ('+gSum[g]+')'}).concat([gk[0]+' ('+(gSum[gk[0]]+3)+')']),'Suma de ejemplares por género: '+gk.map(function(g){return g+' '+gSum[g]}).join(' · ')+'.'));
  var nunca=L.filter(function(l){return !lCnt[l[0]]}).length;
  dyn.push(nq('¿Cuántos libros no se han prestado nunca? (WHERE isbn NOT IN (SELECT isbn FROM PRESTAMO))',nunca,[nunca+1,nunca+2,0],'Son los que no aparecen en ninguna fila de PRESTAMO.'));
  dyn.push(mk('¿Qué título aparece al agrupar PRESTAMO por libro, ordenar por COUNT(*) descendente y aplicar LIMIT 1?',T(tid),take(L.filter(function(l){return l[0]!==tid}).map(function(l){return l[1]}),3),'«'+T(tid)+'» ('+tid+') tiene '+tl.m+' préstamos, más que ningún otro.'));
  var nl=Object.keys(S.reduce(function(a,s){a[s[2]]=1;return a},{})).length;
  dyn.push(nq('¿Cuántas localidades distintas hay entre los socios (SELECT COUNT(DISTINCT localidad) FROM SOCIO)?',nl,[S.length,2,4],'DISTINCT elimina localidades repetidas.'));
  var loc=pick(locs),fd=dstr(ri(2020,2022),ri(1,12),1),cnt=S.filter(function(s){return s[2]===loc&&s[3]>=fd}).length;
  dyn.push(nq("¿Cuántos socios hay con localidad = '"+loc+"' y fecha_alta posterior o igual al "+fd+"?",cnt,[1,2,3,0],'Se cuentan las filas de SOCIO que cumplen a la vez ambas condiciones.'));
  var ts=S[ri(0,S.length-2)],c2=sCnt[ts[0]]||0;
  dyn.push(nq('¿Cuántos préstamos ha realizado '+ts[1]+' (SELECT COUNT(*) FROM PRESTAMO WHERE id_socio='+ts[0]+')?',c2,[c2+1,c2+2,P.length],'Se cuentan sus filas en PRESTAMO.'));
  var tot=L.reduce(function(a,l){return a+l[5]},0);
  dyn.push(nq('¿Qué devuelve SELECT SUM(ejemplares) FROM LIBRO;?',tot,[tot+L.length,tot-3,L.length],'Suma de la columna ejemplares de los '+L.length+' libros.'));
  var mes=P[ri(0,P.length-1)][3].slice(0,7),cm=P.filter(function(p){return p[3].slice(0,7)===mes}).length;
  dyn.push(nq("¿Cuántos préstamos se hicieron en el mes "+mes+" (f_prestamo LIKE '"+mes+"%')?",cm,[cm+1,cm+2,cm+3],'Se cuentan las filas cuya fecha empieza por ese año-mes.'));
  var enun='<p>La '+ent+' de '+mun+' gestiona sus préstamos con una base de datos relacional. Cada <b>socio</b> puede llevarse varios <b>libros</b>; cada vez que lo hace se registra un <b>préstamo</b> con su fecha, y mientras el libro no se devuelve <code>f_devolucion</code> vale <code>NULL</code>.</p><p>Como Técnico Auxiliar de Informática mantienes la base de datos y resuelves las consultas del personal. El esquema y los datos actuales están en la tercera columna.</p>';
  return {id:'prestamos',b:3,title:'Gestión de la '+ent+' de '+mun,enun:enun,db:db,qs:chooseMix(fixed,dyn,20)}}

/* ================= BLOQUE III · base de datos: pedidos ================= */
var CLIE=[['Informática Sol','Madrid'],['Talleres Vega','Sevilla'],['Colegio Cervantes','Toledo'],['Clínica Mar','Valencia'],['Estudio Norte','Bilbao'],['Ayuntamiento de Ocaña','Toledo'],['Gestoría Ruiz','Getafe'],['Farmacia Lara','Madrid']];
var PROD=[['Portátil 15"','Equipos',600,900],['Servidor torre','Equipos',1200,1800],['Impresora láser','Equipos',150,300],['Monitor 24"','Periféricos',120,200],['Teclado USB','Periféricos',15,30],['Ratón óptico','Periféricos',8,15],['Cable HDMI','Periféricos',6,12],['Webcam HD','Periféricos',25,50],['Switch 24 puertos','Redes',180,260],['Router WiFi 6','Redes',80,120],['Punto de acceso','Redes',90,150],['SSD 1 TB','Componentes',60,100],['Memoria RAM 16 GB','Componentes',40,70],['Disco duro 4 TB','Componentes',80,120]];
function genPedidos(){
  var nC=ri(5,6),C=take(CLIE,nC).map(function(c,i){return [i+1,c[0],c[1]]});
  var nP=ri(8,9),P=take(PROD,nP).map(function(p,i){return ['P'+pad(i+1),p[0],p[1],ri(p[2],p[3]),ri(2,60)]});
  var nPe=ri(7,9),PE=[],LI=[],d='2024-05-01',nunca=P[P.length-1][0];
  var est=['ENVIADO','ENVIADO','PENDIENTE','CANCELADO','ENVIADO'];
  for(var i=0;i<nPe;i++){d=addDays(d,ri(1,4));var cl=pick(C.slice(0,C.length-1))[0];PE.push([100+i+1,cl,d,i===3?'CANCELADO':pick(est.slice(0,3))]);
    var np=ri(1,3);take(P.slice(0,P.length-1),np).forEach(function(pr){LI.push([100+i+1,pr[0],ri(1,10)])})}
  var price={};P.forEach(function(p){price[p[0]]=p[3]});
  var imp={};LI.forEach(function(l){imp[l[0]]=(imp[l[0]]||0)+l[2]*price[l[1]]});
  var ik=Object.keys(imp).sort(function(a,b){return imp[b]-imp[a]});if(imp[ik[0]]===imp[ik[1]])return null;
  var cat={};P.forEach(function(p){(cat[p[2]]=cat[p[2]]||[]).push(p[3])});var ca=Object.keys(cat).map(function(k){return [k,cat[k].reduce(function(a,b){return a+b},0)/cat[k].length]}).sort(function(a,b){return b[1]-a[1]});
  if(ca.length<3||ca[0][1]===ca[1][1])return null;
  var cc={};PE.forEach(function(p){cc[p[1]]=(cc[p[1]]||0)+1});
  var db=[tbl('CLIENTE',['id_cliente','nombre','ciudad'],C,['id_cliente']),tbl('PRODUCTO',['cod','nombre','categoria','precio','stock'],P,['cod']),tbl('PEDIDO',['id_pedido','id_cliente','fecha','estado'],PE,['id_pedido'],{id_cliente:'CLIENTE.id_cliente'}),tbl('LINEA',['id_pedido','cod','unidades'],LI,['id_pedido','cod'],{id_pedido:'PEDIDO.id_pedido',cod:'PRODUCTO.cod'})];
  var fixed=[],dyn=[];
  fixed.push(mk('¿Cuál es la clave primaria de la tabla LINEA?','(id_pedido, cod): clave compuesta',['id_pedido, porque cada línea pertenece a un solo pedido','cod, porque identifica al producto','unidades'],'Un pedido tiene varias líneas y un producto está en varios pedidos; solo la combinación identifica la fila.'));
  fixed.push(mk('Si LINEA guardara también nombre_producto (LINEA(id_pedido, cod, nombre_producto, unidades)), ¿qué problema de normalización aparece?','Dependencia parcial de la clave (incumple 2FN): nombre_producto depende solo de cod',['Incumple 1FN porque hay una clave compuesta','Dependencia transitiva (incumple 3FN) entre id_pedido y unidades','Ninguno: es la forma correcta para evitar JOINs'],'nombre_producto depende de una parte de la clave compuesta, no de toda.'));
  fixed.push(mk('Si PEDIDO incluyera «ciudad_cliente» además de id_cliente, ¿qué forma normal se incumpliría?','La 3FN: dependencia transitiva id_pedido → id_cliente → ciudad',['La 1FN','La 2FN, porque la clave es compuesta','Ninguna'],'La ciudad depende del cliente, que depende del pedido: dependencia transitiva.'));
  fixed.push(mk('Al confirmar un pedido hay que descontar el stock automáticamente. ¿Qué mecanismo lo hace sin intervención de la aplicación?','Un disparador (TRIGGER) sobre LINEA',['Una vista materializada de PRODUCTO','Un índice sobre PRODUCTO(stock)','Una clave foránea con ON DELETE CASCADE'],'Un trigger se ejecuta ante INSERT/UPDATE/DELETE y puede actualizar el stock.'));
  fixed.push(mk('Una transacción lee el stock modificado por otra que aún no ha confirmado y que luego hace ROLLBACK. ¿Cómo se llama el fenómeno?','Lectura sucia (dirty read)',['Lectura no repetible','Lectura fantasma','Interbloqueo (deadlock)'],'Lo evita el nivel de aislamiento READ COMMITTED y superiores.'));
  fixed.push(mk('Para mostrar siempre las líneas con el nombre del producto y su importe sin repetir el JOIN, ¿qué conviene definir?','Una vista con el JOIN entre LINEA y PRODUCTO',['Un índice único sobre LINEA.unidades','Una segunda base de datos réplica','Una columna calculada en CLIENTE'],'Las vistas encapsulan consultas complejas y las hacen reutilizables.'));
  fixed.push(mk('Un cliente hace muchos pedidos y cada pedido es de un único cliente. La cardinalidad CLIENTE–PEDIDO es:','1:N (uno a muchos)',['N:M (muchos a muchos)','1:1 (uno a uno)','N:1 desde CLIENTE hacia PEDIDO'],'La clave foránea id_cliente en PEDIDO implementa la relación 1:N.'));
  fixed.push(mk('En un diagrama de clases UML, «un PEDIDO se compone de varias LINEA y estas no existen sin él» se representa mediante:','Composición (rombo relleno)',['Herencia (flecha con triángulo vacío)','Dependencia (línea discontinua)','Agregación (rombo vacío)'],'En la composición la parte no puede existir sin el todo; en la agregación sí.'));
  fixed.push(mk('En Java, Portatil y Servidor extienden la clase abstracta Equipo, que declara precioConIva(). Una List<Equipo> llama a ese método en cada elemento. ¿Qué principio se aplica?','Polimorfismo: se ejecuta la versión de la clase real de cada objeto',['Encapsulamiento: se ocultan los atributos de Equipo','Sobrecarga: se elige el método por el número de parámetros','Herencia múltiple entre Portatil y Servidor'],'El enlace dinámico elige la implementación en tiempo de ejecución según el tipo real.'));
  var n=pick([1000,50000,1000000,1000000000]),lg=Math.ceil(Math.log(n)/Math.log(2));
  fixed.push(mk('El catálogo tiene '+n.toLocaleString('es-ES')+' productos ordenados por código. ¿Cuántas comparaciones necesita aproximadamente una búsqueda binaria en el peor caso?','Unas '+lg,['Unas '+Math.round(Math.sqrt(n)),String(Math.round(n/2).toLocaleString('es-ES')),n.toLocaleString('es-ES')],'Cada comparación descarta la mitad: ⌈log₂ '+n.toLocaleString('es-ES')+'⌉ = '+lg+'.'));
  fixed.push(mk('Los informes mensuales recorren toda la tabla LINEA y tardan mucho. Sin cambiar las consultas, ¿qué opción es más razonable?','Crear índices sobre las columnas usadas en JOIN y filtros',['Convertir todas las tablas en una sola con muchas columnas','Eliminar las claves foráneas','Cambiar INT por VARCHAR en las claves'],'Los índices reducen los accesos a disco; desnormalizar del todo o quitar claves foráneas daña la integridad.'));
  var t=ik[0],pc=PE.filter(function(p){return p[3]!=='CANCELADO'}).length;
  var tp=ri(0,LI.length-1),tl0=LI[tp],ped=tl0[0],ls=LI.filter(function(l){return l[0]===ped}),im=ls.reduce(function(a,l){return a+l[2]*price[l[1]]},0);
  dyn.push(mk('¿Cuál es el importe total del pedido '+ped+' (SUM de unidades × precio de sus líneas)?',im+' €',[(im+20)+' €',Math.max(1,im-50)+' €',(im+ls[0][2]*price[ls[0][1]])+' €'],ls.map(function(l){return l[2]+'×'+price[l[1]]}).join(' + ')+' = '+im+' €.'));
  dyn.push(nq("¿Qué devuelve SELECT COUNT(*) FROM PEDIDO WHERE estado <> 'CANCELADO';?",pc,[PE.length,pc+1,pc-1],'Hay '+PE.length+' pedidos; los cancelados no cuentan.'));
  var multi=C.filter(function(c){return cc[c[0]]>1}).map(function(c){return c[1]}).sort();
  if(multi.length&&multi.length<C.length)dyn.push(mk('¿Qué clientes tienen más de un pedido? (JOIN + GROUP BY id_cliente + HAVING COUNT(*) > 1)',multi.join(', '),[C.filter(function(c){return cc[c[0]]}).map(function(c){return c[1]}).sort().join(', ')===multi.join(', ')?C.map(function(c){return c[1]}).sort().join(', '):C.filter(function(c){return cc[c[0]]}).map(function(c){return c[1]}).sort().join(', '),take(multi,1).join(', ')===multi.join(', ')?'Ninguno':take(multi,1).join(', '),C.filter(function(c){return !cc[c[0]]}).map(function(c){return c[1]}).join(', ')||'Todos'],'HAVING se aplica tras agrupar: se quedan los clientes con 2 o más pedidos.'));
  dyn.push(mk('¿Qué categoría tiene el precio medio más alto?',ca[0][0]+' ('+fmt(ca[0][1])+' €)',ca.slice(1,3).map(function(x){return x[0]+' ('+fmt(x[1])+' €)'}).concat([ca[ca.length-1][0]+' ('+fmt(ca[ca.length-1][1]+40)+' €)']),'Medias por categoría: '+ca.map(function(x){return x[0]+' '+fmt(x[1])+' €'}).join(' · ')+'.'));
  var lim=pick([5,10,15]),low=P.filter(function(p){return p[4]<lim}).map(function(p){return p[1]}).sort();
  if(low.length&&low.length<P.length-2)dyn.push(mk('¿Qué productos devuelve SELECT nombre FROM PRODUCTO WHERE stock < '+lim+'?',low.join(', '),[P.filter(function(p){return p[4]<=lim}).length!==low.length?P.filter(function(p){return p[4]<=lim}).map(function(p){return p[1]}).sort().join(', '):take(P,low.length+1).map(function(p){return p[1]}).sort().join(', '),'Ninguno',take(P,Math.max(1,low.length-1)).map(function(p){return p[1]}).sort().join(', ')],'Se comparan los stocks: menores que '+lim+' (no iguales).'));
  var nv=P[P.length-1];
  dyn.push(mk('¿Qué producto nunca se ha vendido? (WHERE cod NOT IN (SELECT cod FROM LINEA))',nv[1],take(P.slice(0,P.length-1),3).map(function(p){return p[1]}),nv[0]+' no aparece en ninguna línea de pedido.'));
  var pr=pick(P.slice(0,P.length-1)),us=LI.filter(function(l){return l[1]===pr[0]}).reduce(function(a,l){return a+l[2]},0);
  if(us)dyn.push(nq("¿Cuántas unidades del producto '"+pr[0]+"' ("+pr[1]+") se han pedido en total?",us,[us+2,us-1,us+5],'Suma de las unidades de sus líneas.'));
  var cs=C.map(function(c){return c[2]}),dis=Object.keys(cs.reduce(function(a,x){a[x]=1;return a},{})),mad=pick(dis);
  dyn.push(nq("¿Cuántas filas devuelve SELECT ciudad FROM CLIENTE UNION SELECT '"+mad+"';?",dis.length,[C.length,dis.length+1,1],'UNION elimina duplicados: '+dis.length+' ciudades distintas, y '+mad+' ya está.'));
  dyn.push(nq("¿Cuántas filas devuelve SELECT ciudad FROM CLIENTE UNION ALL SELECT '"+mad+"';?",C.length+1,[C.length,dis.length,C.length+2],'UNION ALL conserva los duplicados: '+C.length+' + 1 filas.'));
  var bc=ik[0];
  dyn.push(mk('¿Qué pedido tiene el mayor importe total (SUM de unidades × precio)?','El pedido '+bc+' ('+imp[bc]+' €)',ik.slice(1,4).map(function(k){return 'El pedido '+k+' ('+imp[k]+' €)'}),'Importes por pedido: '+ik.slice(0,4).map(function(k){return k+' → '+imp[k]+' €'}).join(', ')+'…'));
  var cat0=pick(ca)[0],ncat=P.filter(function(p){return p[2]===cat0}).length;
  dyn.push(nq("¿Cuántos productos tiene la categoría '"+cat0+"' (SELECT COUNT(*) FROM PRODUCTO WHERE categoria='"+cat0+"')?",ncat,[ncat+1,ncat+2,P.length],'Se cuentan las filas de PRODUCTO con esa categoría.'));
  var mx=P.reduce(function(a,p){return Math.max(a,p[3])},0);
  dyn.push(nq('¿Qué devuelve SELECT MAX(precio) FROM PRODUCTO;?',mx,[mx-50,mx+100,Math.round(P.reduce(function(a,p){return a+p[3]},0)/P.length)],'El precio más alto del catálogo es '+mx+' €.',' €'));
  var enun='<p>Una pequeña empresa vende material informático a organismos y empresas. La aplicación web guarda <b>clientes</b>, <b>productos</b>, <b>pedidos</b> y las <b>líneas</b> de cada pedido (producto y unidades; el precio se toma de PRODUCTO). Un pedido puede estar <code>PENDIENTE</code>, <code>ENVIADO</code> o <code>CANCELADO</code>.</p><p>Se te encarga el soporte de la base de datos y de la aplicación (consultas, rendimiento, diseño y programación). La estructura y los datos están en la tercera columna.</p>';
  return {id:'pedidos',b:3,title:'Tienda online de material informático',enun:enun,db:db,qs:chooseMix(fixed,dyn,20)}}

/* ================= BLOQUE IV · red ================= */
var IPn=function(s){var p=s.split('.');return ((+p[0]<<24)>>>0)+(+p[1]<<16)+(+p[2]<<8)+(+p[3])};
var IPs=function(n){return [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.')};
var maskOf=function(p){return p?((0xFFFFFFFF<<(32-p))>>>0):0};
function pfxFor(h){var p=30;while(Math.pow(2,32-p)-2<h)p--;return p}
var DEPT=['Administración','Técnicos','Servidores','Invitados','Dirección','Contabilidad','Desarrollo','Soporte','Registro','Wi-Fi corporativa'];
function genRed(){
  var kind=pick([0,1,2]),base=kind===0?'192.168.'+ri(1,250)+'.0':kind===1?'10.'+ri(0,250)+'.'+ri(0,250)+'.0':'172.'+ri(16,31)+'.'+ri(0,250)+'.0';
  var nd=ri(4,5),names=take(DEPT,nd),hs=names.map(function(){return ri(5,60)}),tot=0,subs=[];
  var order=names.map(function(n,i){return {n:n,h:hs[i],p:pfxFor(hs[i])}}).sort(function(a,b){return b.h-a.h});
  order.forEach(function(o){o.size=Math.pow(2,32-o.p)});
  var need=order.reduce(function(a,o){return a+o.size},0)+4;if(need>256)return null;
  var cur=IPn(base);order.forEach(function(o,i){o.net=cur;o.vlan=(i+1)*10;cur+=o.size});
  var wan=cur;
  var uniqP={};order.forEach(function(o){uniqP[o.p]=(uniqP[o.p]||0)+1});
  var rows=order.map(function(o){return '<tr><td>'+o.vlan+'</td><td>'+esc(o.n)+'</td><td>'+o.h+'</td><td>'+IPs(o.net)+'/'+o.p+'</td></tr>'}).join('')+'<tr><td>—</td><td>Enlace WAN</td><td>2</td><td>'+IPs(wan)+'/30</td></tr>';
  var enun='<p>Un organismo abre una delegación provincial y te encargan diseñar y poner en marcha su red. Dispones del bloque <b>'+base+'/24</b> y de un enlace WAN con el proveedor. Debes crear '+nd+' VLAN y asignar sus subredes mediante <b>VLSM</b> de mayor a menor, empezando por el principio del bloque:</p><table class="tn"><tr><th>VLAN</th><th>Nombre</th><th>Equipos</th><th>Subred</th></tr>'+rows+'</table><p>Un router conecta las VLAN mediante un enlace troncal con los conmutadores y sale a Internet por el enlace WAN. El servidor DHCP, el DNS y el servidor web interno están en la VLAN de <b>'+esc(order[0].n)+'</b>.</p>';
  var fixed=[],dyn=[],A=order[0],B=order[order.length-1];
  var host=function(o){return IPs(o.net+ri(1,o.size-2))};
  fixed.push(mk('Al aplicar VLSM, ¿por qué se reparten primero las subredes más grandes?','Para alinear los bloques sin solapamientos y desperdiciar menos direcciones',['Porque el router solo admite máscaras decrecientes','Porque las subredes pequeñas no pueden ser contiguas','Porque así se necesita menos NAT'],'Asignar de mayor a menor mantiene cada bloque alineado en su frontera de tamaño.'));
  fixed.push(mk('Se quieren separar los grupos en redes de capa 2 distintas sobre los mismos conmutadores. ¿Qué estándar etiqueta las tramas en un enlace troncal?','IEEE 802.1Q',['IEEE 802.1X','IEEE 802.3af','IEEE 802.11ac'],'802.1Q añade una etiqueta de 4 bytes con el VID de 12 bits.'));
  fixed.push(mk('¿Cuántos identificadores de VLAN utilizables ofrece el campo VID de 12 bits de 802.1Q?','4094 (se reservan 0 y 4095)',['4096','1024','255'],'2^12 = 4096, menos los valores reservados 0 y 4095.'));
  fixed.push(mk('Las VLAN se comunican entre sí a través de un único enlace troncal con el router, con una subinterfaz por VLAN. Esta configuración se conoce como:','Router on a stick',['Port mirroring','Spanning tree','Link aggregation'],'Cada subinterfaz encapsula con 802.1Q y actúa de puerta de enlace de su VLAN.'));
  fixed.push(mk('El servidor DHCP está en una VLAN distinta de la de los clientes. ¿Qué hay que configurar en el router de la VLAN de los clientes?','Un agente de retransmisión DHCP (relay / ip helper-address)',['Un segundo servidor DNS','Una ruta por defecto hacia el servidor DHCP','Proxy ARP en todas las interfaces'],'Los DHCPDISCOVER son broadcast y no cruzan routers; el relay los reenvía por unicast.'));
  fixed.push(mk('Al conectar dos conmutadores por dos cables se forma un bucle de capa 2. ¿Qué protocolo lo evita bloqueando puertos redundantes?','STP (Spanning Tree Protocol, IEEE 802.1D)',['VTP','LACP','OSPF'],'STP elige un puente raíz y deja en bloqueo los puertos que crearían un bucle.'));
  fixed.push(mk('Los equipos usan direcciones privadas y salen a Internet con una sola IP pública compartida, diferenciando las conexiones por puerto. ¿Qué técnica es?','PAT / NAT con sobrecarga (overload)',['NAT estático uno a uno','Proxy inverso','Tunelización GRE'],'PAT traduce direcciones y puertos origen para multiplexar muchas conexiones en una IP.'));
  fixed.push(mk('Se quiere impedir que la VLAN '+esc(B.n)+' acceda a la VLAN '+esc(A.n)+' pero permitirle salir a Internet. ¿Qué mecanismo se emplea?','Una lista de control de acceso (ACL) que deniegue '+IPs(B.net)+'/'+B.p+' → '+IPs(A.net)+'/'+A.p+' y permita el resto',['Aumentar el TTL de los paquetes','Quitar la VLAN del troncal','Usar una máscara /32 en esa VLAN'],'Las ACL filtran por origen/destino/puerto.'));
  fixed.push(mk('Los servidores web públicos del organismo se colocan en un segmento aislado entre Internet y la red interna. ¿Cómo se denomina?','DMZ (zona desmilitarizada)',['VPN de acceso remoto','Honeypot','VLAN nativa'],'La DMZ limita el daño si un servidor expuesto es comprometido.'));
  fixed.push(mk('¿Qué tipo de registro DNS indica los servidores de correo de un dominio?','MX',['CNAME','PTR','NS'],'MX (Mail Exchanger) con prioridad; CNAME es alias, PTR resolución inversa, NS servidores de nombres.'));
  var pa=pick([99,99.5,99.9,99.95,99.99]),dh=(100-pa)/100*8760,dtxt=dh>=1?fmt(dh)+' horas':fmt(dh*60)+' minutos';
  var wrongs=[99,99.5,99.9,99.95,99.99].filter(function(x){return x!==pa}).map(function(x){var h=(100-x)/100*8760;return h>=1?fmt(h)+' horas':fmt(h*60)+' minutos'});
  fixed.push(mk('Se exige una disponibilidad del '+String(pa).replace('.',',')+' % anual. ¿Cuánto tiempo de caída máximo admite aproximadamente?','Unas '+dtxt+' al año',take(wrongs,3).map(function(x){return 'Unas '+x+' al año'}),'(100 − '+pa+') % de 8760 h = '+dtxt+'.'));
  var pf=pick([40,44,48]),pn=Math.pow(2,64-pf);
  fixed.push(mk('Si la delegación migrara a IPv6 con un prefijo /'+pf+', ¿cuántas subredes /64 podría crear?',pn.toLocaleString('es-ES')+' (2^'+(64-pf)+')',[Math.pow(2,64-pf-2).toLocaleString('es-ES'),Math.pow(2,64-pf+2).toLocaleString('es-ES'),'2^64'],(64-pf)+' bits de subred: 2^'+(64-pf)+'.'));
  // calculadas
  var o1=pick(order),o2=pick(order),o3=pick(order),o4=pick(order),o5=pick(order);
  var hostsOf=function(o){return o.size-2};
  dyn.push(mk('¿Cuál es la máscara de subred de '+IPs(o1.net)+'/'+o1.p+'?',IPs(maskOf(o1.p)),[IPs(maskOf(o1.p+1)),IPs(maskOf(o1.p-1)),IPs(maskOf(o1.p+2))],'/'+o1.p+' = '+o1.p+' unos seguidos.'));
  dyn.push(nq('¿Cuántos equipos pueden direccionarse en la VLAN '+esc(o2.n)+' ('+IPs(o2.net)+'/'+o2.p+')?',hostsOf(o2),[o2.size,o2.size-1,o2.size*2-2],'2^'+(32-o2.p)+' − 2 = '+hostsOf(o2)+' (se descuentan la dirección de red y la de difusión).'));
  dyn.push(mk('¿Cuál es la dirección de difusión (broadcast) de '+IPs(o3.net)+'/'+o3.p+'?',IPs(o3.net+o3.size-1),[IPs(o3.net+o3.size),IPs(o3.net),IPs(o3.net+o3.size-2)],'El bloque llega de '+IPs(o3.net)+' a '+IPs(o3.net+o3.size-1)+'; la última dirección es el broadcast.'));
  dyn.push(mk('¿Cuál es el rango de direcciones asignables a equipos en '+IPs(o4.net)+'/'+o4.p+'?',IPs(o4.net+1)+' – '+IPs(o4.net+o4.size-2),[IPs(o4.net)+' – '+IPs(o4.net+o4.size-1),IPs(o4.net+1)+' – '+IPs(o4.net+o4.size-1),IPs(o4.net)+' – '+IPs(o4.net+o4.size-2)],'La primera dirección es la de red y la última la de difusión.'));
  var hip=IPs(o5.net+ri(2,o5.size-3));
  dyn.push(mk('Un equipo tiene la IP '+hip+'/'+o5.p+'. ¿A qué red pertenece?',IPs(o5.net)+'/'+o5.p,[IPs(maskOf(o5.p+1)&IPn(hip))+'/'+(o5.p+1)!==IPs(o5.net)+'/'+o5.p?IPs(maskOf(o5.p+1)&IPn(hip))+'/'+(o5.p+1):IPs(o5.net+o5.size)+'/'+o5.p,hip+'/'+o5.p,IPs(maskOf(o5.p-1)&IPn(hip))+'/'+(o5.p-1)],'Se aplica la máscara /'+o5.p+' a la IP (AND bit a bit).'));
  dyn.push(mk('¿Cuál es la primera dirección utilizable de la VLAN '+esc(B.n)+' ('+IPs(B.net)+'/'+B.p+')?',IPs(B.net+1),[IPs(B.net),IPs(B.net+2),IPs(B.net-1)],'La primera es la dirección de red.'));
  dyn.push(mk('¿Cuál es la máscara wildcard (inversa) que se usaría en una ACL para '+IPs(o1.net)+'/'+o1.p+'?',IPs((~maskOf(o1.p))>>>0),[IPs(maskOf(o1.p)),IPs((~maskOf(o1.p+1))>>>0),IPs((~maskOf(o1.p-1))>>>0)],'La wildcard es la inversa de la máscara: '+IPs((~maskOf(o1.p))>>>0)+'.'));
  var hn=ri(10,100);
  dyn.push(mk('¿Cuál es el prefijo más ajustado para una subred con '+hn+' equipos?','/'+pfxFor(hn)+' ('+(Math.pow(2,32-pfxFor(hn))-2)+' direcciones utilizables)',['/'+(pfxFor(hn)+1)+' ('+(Math.pow(2,31-pfxFor(hn))-2)+' direcciones utilizables)','/'+(pfxFor(hn)-1)+' ('+(Math.pow(2,33-pfxFor(hn))-2)+' direcciones utilizables)','/'+(pfxFor(hn)+2)+' ('+(Math.pow(2,30-pfxFor(hn))-2)+' direcciones utilizables)'],'Hay que cumplir 2^(32−p) − 2 ≥ '+hn+'.'));
  dyn.push(nq('El enlace punto a punto con el proveedor usa '+IPs(wan)+'/30. ¿Cuántos equipos admite?',2,[4,1,6],'2^2 − 2 = 2: los dos extremos del enlace.'));
  var free=256-(order.reduce(function(a,o){return a+o.size},0)+4);
  dyn.push(nq('Tras repartir las '+nd+' VLAN y el enlace WAN de '+base+'/24, ¿cuántas direcciones quedan libres sin asignar?',free,[free+4,Math.max(0,free-4),free+16],'256 − ('+order.map(function(o){return o.size}).join(' + ')+' + 4) = '+free+'.'));
  dyn.push(mk('¿Qué subred se asigna a la VLAN '+esc(order[1].n)+' siguiendo VLSM de mayor a menor?',IPs(order[1].net)+'/'+order[1].p,[IPs(order[1].net+order[1].size)+'/'+order[1].p,IPs(order[1].net-order[1].size)+'/'+order[1].p,IPs(order[1].net)+'/'+(order[1].p+1)],'Cada bloque empieza donde acaba el anterior: tras '+esc(A.n)+' ('+IPs(A.net)+'/'+A.p+').'));
  return {id:'red',b:4,title:'Red de la nueva delegación provincial',enun:enun,db:null,qs:chooseMix(fixed,dyn,20)}}

/* ================= BLOQUE IV · servidores ================= */
var SOFN=['SRV-FICH','SRV-BD','SRV-BCK','SRV-AD','SRV-WEB','SRV-MAIL'],SFUN=['Ficheros','Base de datos','Copias de seguridad','Dominio y GPO','Web interna','Correo'],SOS=['Linux','Linux','Linux','Windows Server','Linux','Windows Server'];
function raidCap(l,n,s){return l===0?n*s:l===1?s:l===5?(n-1)*s:l===6?(n-2)*s:n*s/2}
var DAYN=['lunes','martes','miércoles','jueves','viernes','sábado'];
function sym(o){var s='';[o>>6&7,o>>3&7,o&7].forEach(function(d){s+=(d&4?'r':'-')+(d&2?'w':'-')+(d&1?'x':'-')});return s}
function genServidores(){
  var ns=4,idx=take([0,1,2,3,4,5],ns).sort(),S=idx.map(function(i){var l=pick([1,5,5,6,10]),n=l===1?2:l===10?pick([4,6,8]):l===6?ri(4,8):ri(3,8);return {n:SOFN[i],f:SFUN[i],os:SOS[i],l:l,nd:n,s:pick([2,4,8,12,16])}});
  var rows=S.map(function(x){return '<tr><td>'+x.n+'</td><td>'+x.f+'</td><td>RAID '+x.l+' · '+x.nd+' discos de '+x.s+' TB</td><td>'+x.os+'</td></tr>'}).join('');
  var diff=R()<.5,fd=ri(2,4),pa=pick([99,99.5,99.9,99.95,99.99]),rpo=pick([1,2,4,8,12,24]),rto=pick([1,2,4,6,8]);
  var enun='<p>Eres responsable de la sala de servidores de un organismo público, con este equipamiento:</p><table class="tn"><tr><th>Servidor</th><th>Función</th><th>Almacenamiento</th><th>Sistema</th></tr>'+rows+'</table><p>Los servidores corren sobre un hipervisor instalado directamente en el hardware. La política de copias es <b>completa los domingos y '+(diff?'diferencial':'incremental')+' de lunes a sábado</b>. El servicio debe tener una disponibilidad del '+String(pa).replace('.',',')+' %, con un RPO de '+rpo+' h y un RTO de '+rto+' h.</p>';
  var fixed=[],dyn=[];
  fixed.push(mk('¿Cuántos discos puede perder un RAID 5 sin perder datos?','Uno',['Dos','Ninguno','La mitad de los discos'],'RAID 5 soporta el fallo de un disco; RAID 6, de dos.'));
  fixed.push(mk('La regla de copias «3-2-1» recomienda:','3 copias de los datos, en 2 tipos de soporte distintos y 1 fuera de la sede',['3 copias completas, 2 incrementales y 1 diferencial','3 servidores, 2 SAI y 1 grupo electrógeno','3 copias diarias, 2 semanales y 1 mensual'],'Reduce el riesgo de perder a la vez los datos y todas sus copias.'));
  fixed.push(mk('Se fija que, tras un desastre, no se pueden perder más de '+hrs(rpo)+' de datos. ¿Qué indicador es?','RPO (Recovery Point Objective)',['RTO (Recovery Time Objective)','MTBF','SLA de disponibilidad'],'El RPO mide la pérdida de datos tolerable; el RTO, el tiempo máximo para restablecer el servicio.'));
  fixed.push(mk('Se exige restablecer el servicio en un máximo de '+hrs(rto)+' tras una caída. ¿Qué indicador es?','RTO (Recovery Time Objective)',['RPO (Recovery Point Objective)','MTTF','Nivel de RAID'],'RTO = tiempo objetivo de recuperación.'));
  fixed.push(mk('Se instala un hipervisor directamente sobre el hardware (KVM, Hyper-V, VMware ESXi). ¿De qué tipo es?','Tipo 1 (bare metal)',['Tipo 2 (alojado)','Contenedor sin kernel propio','Emulador de instrucciones'],'El tipo 2 (VirtualBox, VMware Workstation) se ejecuta sobre un sistema operativo anfitrión.'));
  fixed.push(mk('En el dominio Windows se quiere aplicar a todos los equipos de una unidad organizativa la misma configuración de seguridad. ¿Qué se usa?','Directivas de grupo (GPO) de Active Directory',['Un script de arranque en cada PC','Sitios y servicios de Active Directory','Un perfil móvil'],'Las GPO se enlazan a sitios, dominios o unidades organizativas.'));
  fixed.push(mk('¿Qué comando de Linux muestra el espacio libre y usado de los sistemas de ficheros en formato legible?','df -h',['du -h /','free -h','fdisk -l'],'df informa por sistema de ficheros; du, por directorio; free, de memoria.'));
  fixed.push(mk('Para vigilar CPU, disco y servicios y recibir alertas, ¿qué tipo de herramienta se emplea?','Un sistema de monitorización como Nagios o Zabbix, que puede usar SNMP',['Un balanceador de carga como HAProxy','Un sistema de control de versiones como Git','Un gestor de arranque como GRUB'],'SNMP (preferiblemente v3, con autenticación y cifrado) es el protocolo habitual de métricas.'));
  fixed.push(mk('Las caídas de un servicio se repiten cada pocas semanas. Para hallar y eliminar la causa raíz, ¿qué proceso de ITIL se aplica?','Gestión de problemas',['Gestión de incidentes','Gestión de cambios','Gestión de peticiones de servicio'],'Un incidente se resuelve restaurando el servicio; el problema es la causa subyacente.'));
  fixed.push(mk('Para administrar remotamente los servidores Linux por consola de forma cifrada, ¿qué protocolo y puerto por defecto se utilizan?','SSH, puerto TCP 22',['Telnet, puerto TCP 23','RDP, puerto TCP 3389','FTP, puerto TCP 21'],'Telnet y FTP envían las credenciales en claro; RDP es el escritorio remoto de Windows.'));
  S.forEach(function(x){var cap=raidCap(x.l,x.nd,x.s),bruto=x.nd*x.s;
    var cands=[bruto,bruto-x.s,bruto-2*x.s,bruto/2,x.s];
    dyn.push(nq('El servidor '+x.n+' usa RAID '+x.l+' con '+x.nd+' discos de '+x.s+' TB. ¿Cuál es su capacidad útil?',cap,cands,x.l===1?'RAID 1 es un espejo: ambos discos guardan lo mismo.':x.l===5?'RAID 5 reserva un disco de paridad: (n − 1) × tamaño.':x.l===6?'RAID 6 reserva dos discos de paridad: (n − 2) × tamaño.':'RAID 10 duplica y reparte: la mitad de la capacidad bruta.',' TB'))});
  var fl=ri(2,4),sets=diff?2:1+fl;
  dyn.push(mk('Con la política de copias del enunciado, si un servidor falla el '+DAYN[fl]+' por la mañana, ¿qué hay que restaurar?',diff?'La copia completa del domingo y la diferencial del '+DAYN[fl-1]:'La completa del domingo y las incrementales de '+DAYN.slice(0,fl).join(', ').replace(/, ([^,]*)$/,' y $1'),diff?['Solo la diferencial del '+DAYN[fl-1],'La completa del domingo y las diferenciales de '+DAYN.slice(0,fl).join(', ').replace(/, ([^,]*)$/,' y $1'),'Solo la completa del domingo']:['La completa del domingo y la incremental del '+DAYN[fl-1],'Solo la incremental del '+DAYN[fl-1],'Solo la completa del domingo'],diff?'Una diferencial contiene todo lo cambiado desde la última completa: basta la última diferencial.':'Cada incremental solo guarda los cambios desde la copia anterior: hay que aplicar toda la cadena.'));
  dyn.push(nq('¿Cuántos juegos de copias hay que restaurar para recuperar el estado del '+DAYN[fl-1]+' por la noche con esta política?',sets===2&&diff?2:sets,[1,2,3,4,5],diff?'La completa y la última diferencial.':'La completa y todas las incrementales hasta ese día.'));
  var dh=(100-pa)/100*8760,dtxt=dh>=1?fmt(dh)+' horas':fmt(dh*60)+' minutos';
  var pw=[99,99.5,99.9,99.95,99.99].filter(function(x){return x!==pa}).map(function(x){var h=(100-x)/100*8760;return h>=1?fmt(h)+' horas':fmt(h*60)+' minutos'});
  dyn.push(mk('Con la disponibilidad exigida ('+String(pa).replace('.',',')+' %), ¿cuánto tiempo de indisponibilidad anual se admite aproximadamente?','Unas '+dtxt,take(pw,3).map(function(x){return 'Unas '+x}),'(100 − '+pa+') % de 8760 horas = '+dtxt+'.'));
  var po=pick([640,644,750,754,755,664,600,700,775]),pon=parseInt(String(po),8);
  dyn.push(mk('Un fichero de configuración tiene permisos '+po+' en Linux. ¿Qué significan?',['Propietario ','Grupo ','Otros '].map(function(w,i){var m=sym(pon).slice(i*3,i*3+3);return w+m}).join(', '),[[ 'Propietario ','Grupo ','Otros '].map(function(w,i){var m=sym(pon^7).slice(i*3,i*3+3);return w+m}).join(', '),['Propietario ','Grupo ','Otros '].map(function(w,i){var m=sym(((pon&7)<<6)|((pon>>6&7)<<3)|(pon>>3&7)).slice(i*3,i*3+3);return w+m}).join(', '),['Propietario ','Grupo ','Otros '].map(function(w,i){var m=sym(pon|0o44).slice(i*3,i*3+3);return w+m}).join(', ')],'Cada dígito octal suma r=4, w=2, x=1: '+po+' = '+sym(pon)+'.'));
  var um=pick([22,27,77,2]),fm=(0o666&~parseInt(String(um),8)).toString(8),dm=(0o777&~parseInt(String(um),8)).toString(8);
  dyn.push(mk('Con umask 0'+pad(um)+', ¿qué permisos tendrá un fichero nuevo creado con los permisos base 666?',fm,[dm,(0o666&~parseInt(String(um===22?2:22),8)).toString(8),(0o666&~parseInt('077',8)).toString(8)],'666 con la máscara '+pad(um)+' = '+fm+'; los directorios (base 777) quedarían en '+dm+'.'));
  var mi=pick([0,15,30,45]),h=ri(1,5),dw=pick([['1-5','de lunes a viernes'],['0','los domingos'],['6','los sábados'],['*','todos los días']]);
  dyn.push(mk('¿Cuándo se ejecuta la tarea de cron «'+mi+' '+h+' * * '+dw[0]+'»?','A las '+pad(h)+':'+pad(mi)+' '+dw[1],['A las '+pad(mi)+':'+pad(h)+' '+dw[1],'A las '+pad(h)+':'+pad(mi)+' el día '+dw[0].replace(/\D.*/,'')+' de cada mes','Cada '+(mi||5)+' minutos a partir de las '+pad(h)+':00'],'Orden de campos: minuto, hora, día del mes, mes, día de la semana.'));
  return {id:'servidores',b:4,title:'Sala de servidores del organismo',enun:enun,db:null,qs:chooseMix(fixed,dyn,20)}}


/* ================= BLOQUE III · desarrollo (estilo supuesto oficial: stack Java/Spring + Oracle + REST) ================= */
var MINIS=['Ministerio de Educación','Ministerio de Sanidad','Ministerio de Cultura','Ministerio de Transportes','Ministerio de Hacienda','Ministerio de Industria'];
var PROGN=['Formación profesional digital','Competencias básicas','Idiomas','Programación para jóvenes','Orientación laboral','Robótica educativa','Alfabetización digital','Ciberseguridad básica'];
var CENT=['IES Cervantes','CEIP Miguel Hernández','IES Goya','CIFP Los Pinos','IES Clara Campoamor','CEIP Rosalía','IES Velázquez','CIFP La Vega'];
var PROV=['Toledo','Madrid','Sevilla','Valencia','León','Cádiz','Soria'];
function genDesarrollo(){
  var min=pick(MINIS),sis=pick(['EDU-TRACK','SEGUI-PRO','GESTIA','INFOPLAN','PROG-STAT'])+' '+ri(2027,2032);
  var nC=ri(3,4),C=take(CENT,nC).map(function(c,i){return [i+1,c,pick(PROV)]});
  var nP=ri(3,4),PR=take(PROGN,nP).map(function(p,i){return ['PF'+(i+1),p,pick([40,60,80,120])]});
  var nA=ri(7,9),A=take(NOMB,nA).map(function(n,i){return [i+1,n,pick(C)[0]]});
  var M=[],used={};
  A.slice(0,A.length-1).forEach(function(a){take(PR,ri(1,2)).forEach(function(p){M.push([a[0],p[0],ri(2023,2025),ri(2,10)])})});
  var mc={};M.forEach(function(m){mc[m[1]]=(mc[m[1]]||0)+1});var ks=Object.keys(mc).sort(function(a,b){return mc[b]-mc[a]});if(ks.length>1&&mc[ks[0]]===mc[ks[1]])return null;
  var db=[tbl('CENTRO_EDUCATIVO',['id_centro','nombre','provincia'],C,['id_centro']),tbl('PROGRAMA_FORMATIVO',['cod','nombre','horas'],PR,['cod']),tbl('ALUMNO',['id_alumno','nombre','id_centro'],A,['id_alumno'],{id_centro:'CENTRO_EDUCATIVO.id_centro'}),tbl('MATRICULA',['id_alumno','cod','anio','nota'],M,['id_alumno','cod','anio'],{id_alumno:'ALUMNO.id_alumno',cod:'PROGRAMA_FORMATIVO.cod'})];
  var enun='<p>El '+min+' desarrolla <b>'+sis+'</b>, un sistema para el seguimiento de programas formativos. Se compone de servicios <b>REST</b> en <b>Java 17 con Spring Boot</b> (compilados con <b>Maven</b> y desplegados en <b>Tomcat</b>), una base de datos <b>Oracle 19c</b>, procesos <b>ETL</b> nocturnos, un front-end <b>HTML5/CSS3/JavaScript</b>, un módulo de analítica en <b>Python</b> y una aplicación auxiliar en <b>C#/.NET</b>. El código está en <b>Git</b> y se integra con <b>Jenkins</b>.</p><p>El modelo de datos relaciona centros, programas, alumnos y matrículas (tercera columna). Eres el técnico que da soporte al equipo de desarrollo y a la base de datos.</p>';
  var fixed=[],dyn=[];
  var F=function(q,ok,bad,e){fixed.push(mk(q,ok,bad,e))};
  F('Un servicio REST crea un nuevo recurso con POST y debe indicarlo correctamente. ¿Qué código de estado HTTP es el más adecuado?','201 Created',['200 OK sin cuerpo','204 No Content','302 Found'],'201 indica que el recurso se ha creado (normalmente con la cabecera Location).');
  F('Un cliente llama a un endpoint protegido sin enviar credenciales. ¿Qué código devuelve el servidor?','401 Unauthorized',['403 Forbidden','404 Not Found','400 Bad Request'],'401 = falta autenticación; 403 = autenticado pero sin permiso.');
  F('En Spring, la anotación @RestController equivale a combinar:','@Controller y @ResponseBody',['@Service y @Repository','@Component y @Autowired','@Configuration y @Bean'],'Los métodos devuelven directamente el cuerpo de la respuesta (JSON/XML) sin resolver vistas.');
  F('¿Qué anotación de Spring enlaza un fragmento variable de la URL (/alumnos/{id}) con un parámetro del método?','@PathVariable',['@RequestBody','@RequestParam','@ModelAttribute'],'@PathVariable lee la variable de la ruta; @RequestParam, el parámetro de consulta (?x=1).');
  F('En JUnit 5, ¿qué anotación marca un método que debe ejecutarse antes de cada prueba?','@BeforeEach',['@BeforeAll','@AfterEach','@Test(before=true)'],'@BeforeAll se ejecuta una sola vez antes de todas las pruebas de la clase.');
  F('En Java, una excepción comprobada (checked) como IOException:','Debe capturarse o declararse con throws',['Solo puede lanzarla el compilador','No puede capturarse con try/catch','Se ignora siempre en tiempo de ejecución'],'Las RuntimeException (no comprobadas) no obligan a capturarlas ni declararlas.');
  F('¿Cuál es la diferencia entre git fetch y git pull?','fetch descarga los cambios remotos sin integrarlos; pull hace fetch y luego merge',['fetch sube los commits al remoto; pull los descarga','fetch crea una rama nueva; pull la elimina','No hay diferencia: son alias'],'pull = fetch + merge (o rebase si se configura).');
  F('¿Cuál de estos documentos XML está bien formado?','<a><b>texto</b></a>',['<a><b>texto</a></b>','<a><b>texto</b>','<a><b>texto</b></a><c/>'],'Debe haber un único elemento raíz y los elementos se cierran en orden inverso al de apertura.');
  F('Para estructurar una página con HTML5 semántico, ¿qué elementos se utilizan en lugar de div genéricos?','<header>, <nav>, <main>, <article>, <footer>',['<table>, <tr> y <td>','<font> y <center>','<frameset> y <frame>'],'Los elementos semánticos mejoran la accesibilidad y el SEO.');
  F('Según las WCAG, ¿cuáles son los cuatro principios de la accesibilidad web?','Perceptible, operable, comprensible y robusto',['Rápido, seguro, escalable y portable','Legible, usable, estable y gratuito','Confidencial, íntegro, disponible y trazable'],'Son los principios POUR; el RD 1112/2018 los aplica a los sitios web del sector público español.');
  F('Para prevenir ataques XSS en una aplicación web, lo más adecuado es:','Codificar (escapar) la salida y aplicar una política CSP',['Usar solo el método POST','Deshabilitar JavaScript en el servidor','Cifrar la base de datos'],'XSS inyecta scripts en la página; se evita escapando los datos al mostrarlos y limitando los orígenes de scripts.');
  F('¿Qué técnica previene la inyección SQL al construir consultas con datos del usuario?','Sentencias preparadas (consultas parametrizadas)',['Convertir todo a mayúsculas','Concatenar los parámetros entre comillas','Limitar la longitud del formulario'],'Los parámetros se envían separados de la sentencia y nunca se interpretan como SQL.');
  F('En una API REST, ¿qué método HTTP es idempotente y se usa para reemplazar un recurso completo?','PUT',['POST','PATCH','CONNECT'],'PUT repetido produce el mismo estado; POST normalmente crea y no es idempotente.');
  F('En Maven, ¿qué hace mvn clean package?','Borra lo compilado previamente, compila, ejecuta las pruebas y empaqueta el artefacto',['Solo descarga las dependencias','Despliega el artefacto en Tomcat','Genera el pom.xml'],'clean limpia target/; package ejecuta las fases anteriores hasta empaquetar.');
  F('En Spring, la inyección de dependencias es una aplicación del principio de:','Inversión de control (IoC)',['Herencia múltiple','Polimorfismo de sobrecarga','Encapsulamiento de datos'],'El contenedor crea y entrega los objetos que una clase necesita, en lugar de crearlos ella.');
  F('En C#, ¿qué hace la palabra clave await dentro de un método async?','Espera a que termine la tarea sin bloquear el hilo',['Crea un nuevo proceso del sistema operativo','Bloquea el hilo hasta que acabe la tarea','Cancela la tarea en curso'],'El método cede el control y se reanuda cuando la tarea completa.');
  F('En Jenkins, la definición de un pipeline como código se guarda normalmente en:','Un fichero Jenkinsfile en el repositorio',['El fichero pom.xml','Una base de datos Oracle','El fichero web.xml'],'El Jenkinsfile versiona el pipeline junto al código.');
  F('Un diagrama UML que muestra el orden temporal de los mensajes entre objetos es un diagrama de:','Secuencia',['Clases','Casos de uso','Componentes'],'Los diagramas de secuencia muestran interacciones ordenadas en el tiempo.');
  F('Se necesita garantizar que solo exista una instancia de la clase de configuración de la aplicación. ¿Qué patrón de diseño aplica?','Singleton',['Observer','Factory Method','Decorator'],'Singleton restringe la creación a una única instancia con acceso global.');
  F('¿Qué significan las siglas ETL?','Extract, Transform, Load (extraer, transformar y cargar)',['Execute, Test, Launch','Encrypt, Transfer, Log','Estimate, Track, Learn'],'Un proceso ETL toma datos de origen, los transforma y los carga en el destino.');
  F('En Oracle, ¿qué diferencia hay entre DELETE y TRUNCATE?','TRUNCATE es DDL: vacía la tabla de una vez y no se puede deshacer con ROLLBACK',['TRUNCATE borra solo la estructura','DELETE no admite cláusula WHERE','No hay diferencia en Oracle'],'DELETE es DML (admite WHERE y ROLLBACK); TRUNCATE hace commit implícito.');
  F('Para entrenar un modelo de aprendizaje profundo en Python, ¿qué biblioteca se emplearía?','TensorFlow',['Spring Data','JUnit','Selenium'],'TensorFlow (o PyTorch) son bibliotecas de aprendizaje automático.');
  F('¿Qué prueba verifica el funcionamiento aislado de un método o clase pequeña?','Prueba unitaria',['Prueba de aceptación','Prueba de carga','Prueba de regresión visual'],'Las pruebas unitarias (JUnit) validan unidades pequeñas de código.');
  F('Un servicio expone OAuth 2.0. ¿Qué es OAuth 2.0?','Un marco de autorización delegada mediante tokens de acceso',['Un algoritmo de cifrado simétrico','Un formato de intercambio de datos','Un protocolo de transferencia de ficheros'],'Permite que una aplicación acceda a recursos en nombre del usuario sin conocer su contraseña.');
  F('El principio de responsabilidad única (la «S» de SOLID) establece que:','Una clase debe tener una única razón para cambiar',['Una clase solo puede tener un método','Solo debe existir una clase por paquete','Una clase debe heredar de una sola clase'],'Cada clase debe encargarse de una sola responsabilidad.');
  F('En la relación ALUMNO–PROGRAMA_FORMATIVO, un alumno puede cursar varios programas y un programa tiene muchos alumnos. ¿Cómo se resuelve en el modelo relacional?','Con la tabla intermedia MATRICULA, que contiene ambas claves foráneas',['Añadiendo una clave foránea a PROGRAMA_FORMATIVO','Fusionando ALUMNO y PROGRAMA_FORMATIVO','Con una vista'],'Una relación N:M se descompone en dos relaciones 1:N mediante una tabla intermedia.');
  var cnt=function(f){return M.filter(f).length};
  var ca=pick(C),na=A.filter(function(a){return a[2]===ca[0]}).length;
  dyn.push(nq("¿Cuántos alumnos pertenecen al centro '"+ca[1]+"' (SELECT COUNT(*) FROM ALUMNO WHERE id_centro="+ca[0]+")?",na,[na+1,na+2,A.length],'Se cuentan las filas de ALUMNO con ese id_centro.'));
  var ap=cnt(function(m){return m[3]>=5});
  dyn.push(nq('¿Cuántas matrículas tienen nota igual o superior a 5 (SELECT COUNT(*) FROM MATRICULA WHERE nota >= 5)?',ap,[M.length,ap+1,ap-1],'Se cuentan las matrículas que cumplen la condición.'));
  var sm=A.filter(function(a){return !M.some(function(m){return m[0]===a[0]})}).length;
  dyn.push(nq('¿Cuántos alumnos no tienen ninguna matrícula? (LEFT JOIN ... WHERE m.id_alumno IS NULL)',sm,[sm+1,sm+2,0],'Alumnos de ALUMNO sin filas en MATRICULA.'));
  var top=ks[0],tn=PR.filter(function(p){return p[0]===top})[0][1];
  dyn.push(mk('¿Qué programa tiene más matrículas (GROUP BY cod, ORDER BY COUNT(*) DESC, primera fila)?',tn+' ('+mc[top]+')',take(PR.filter(function(p){return p[0]!==top}),3).map(function(p){return p[1]+' ('+(mc[p[0]]||0)+')'}).concat([tn+' ('+(mc[top]+2)+')']),'Matrículas por programa: '+PR.map(function(p){return p[1]+' '+(mc[p[0]]||0)}).join(' · ')+'.'));
  var mx=M.reduce(function(a,m){return Math.max(a,m[3])},0);
  dyn.push(nq('¿Qué devuelve SELECT MAX(nota) FROM MATRICULA;?',mx,[mx-1,Math.min(10,mx+1),5],'La nota más alta registrada es '+mx+'.'));
  var pg=pick(PR),sums=M.filter(function(m){return m[1]===pg[0]}).map(function(m){return m[3]});
  if(sums.length){var av=sums.reduce(function(a,b){return a+b},0)/sums.length;dyn.push(mk("¿Cuál es la nota media del programa '"+pg[1]+"' (SELECT AVG(nota) FROM MATRICULA WHERE cod='"+pg[0]+"')?",fmt(av),[fmt(av+0.5),fmt(Math.max(0,av-1)),fmt(av+1.25)],'Suma de notas / nº de matrículas = '+sums.join('+')+' / '+sums.length+' = '+fmt(av)+'.'))}
  var dis=Object.keys(A.reduce(function(a,x){a[x[2]]=1;return a},{})).length;
  dyn.push(nq('¿Cuántos centros distintos tienen alumnos (SELECT COUNT(DISTINCT id_centro) FROM ALUMNO)?',dis,[C.length,dis+1,1],'DISTINCT cuenta cada centro una vez.'));
  var ao=pick([2023,2024,2025]),cy=cnt(function(m){return m[2]===ao});
  dyn.push(nq('¿Cuántas matrículas hay del año '+ao+'?',cy,[cy+1,cy+2,M.length],'Se filtra MATRICULA por la columna anio.'));
  dyn.push(mk('¿Qué clave primaria es la adecuada para MATRICULA?','(id_alumno, cod, anio)',['id_alumno','(id_alumno, cod): un alumno solo puede matricularse una vez en cada programa','nota'],'Un alumno puede repetir un programa en años distintos, así que el año forma parte de la clave.'));
  return {id:'desarrollo',b:3,title:sis+': seguimiento de programas formativos ('+min+')',enun:enun,db:db,qs:chooseMix(fixed,dyn,20)}}

/* ================= BLOQUE IV · CPD (estilo supuesto oficial: Windows Server + RHEL + red + seguridad) ================= */
function genCPD(){
  var min=pick(MINIS),sis=pick(['SGTIC','CPD-CENTRAL','SIS-OPERA','INFRA-PRO']);
  var pre=pick([20,21]),a=pick([10,172]),b=a===10?ri(1,250):ri(16,30),thirdMask=pre===21?248:240,c=ri(0,31)*(256-thirdMask)%256,base=a+'.'+b+'.'+c+'.0';
  var baseN=IPn(base),subP=pre+2,subSize=Math.pow(2,32-subP);
  var subs=[0,1,2,3].map(function(i){return baseN+i*subSize});
  var vl=take(['Servidores','Usuarios','Gestión','Invitados','Telefonía IP','Impresión'],4);
  var rd=pick([1,5,6,10]),nd=rd===1?2:rd===10?pick([4,6,8]):rd===6?ri(4,8):ri(3,8),dsz=pick([2,4,8,12]),cap=raidCap(rd,nd,dsz),pol=pick(['Veeam','Veeam','otra herramienta de copias']);
  var enun='<p>El Servicio de Sistemas, Comunicaciones y Seguridad ('+sis+') del '+min+' gestiona un <b>CPD</b> con servidores <b>Windows Server 2019</b> (Active Directory, DNS y DHCP) y <b>Linux RHEL 8</b>, virtualización con contenedores <b>Docker</b>, almacenamiento en <b>RAID '+rd+'</b> ('+nd+' discos de '+dsz+' TB) con <b>LVM</b>, y copias de seguridad '+(pol==='Veeam'?'con <b>Veeam</b> ':'')+'siguiendo la estrategia <b>3-2-1</b>.</p><p>La red corporativa dispone del bloque <b>'+base+'/'+pre+'</b>, que se divide en <b>4 subredes del mismo tamaño</b> asignadas, por orden, a las VLAN <b>'+vl.map(function(v,i){return (10*(i+1))+' '+esc(v)}).join(', ')+'</b>. Los conmutadores están conectados por troncales 802.1Q a un router Cisco que actúa de puerta de enlace; el servidor DHCP está en la VLAN de '+esc(vl[0])+'. El acceso a Internet pasa por un cortafuegos con DMZ y un WAF para las aplicaciones web.</p>';
  var fixed=[],dyn=[];
  var F=function(q,ok,bad,e){fixed.push(mk(q,ok,bad,e))};
  F('El router debe reenviar las peticiones DHCP de los clientes de otra VLAN al servidor DHCP. ¿Qué comando de Cisco IOS se configura en la interfaz de esa VLAN?','ip helper-address <IP del servidor DHCP>',['ip dhcp pool <nombre>','switchport mode trunk','ip route 0.0.0.0 0.0.0.0'],'ip helper-address convierte los broadcast DHCP en unicast hacia el servidor.');
  F('¿Qué comando de IOS muestra las VLAN configuradas en un conmutador y sus puertos?','show vlan brief',['show ip route','show running-config interface','show spanning-tree root'],'show vlan brief lista identificador, nombre y puertos de cada VLAN.');
  F('Con 4 VLAN en un único conmutador (sin routers entre ellas), ¿cuántos dominios de broadcast hay?','4',['1','2','8'],'Cada VLAN es un dominio de broadcast independiente.');
  F('En Linux, ¿qué comando muestra la tabla de rutas?','ip route show',['ip addr flush','ss -tulpn','route add default'],'ip route show (equivalente moderno de route -n) lista las rutas.');
  F('¿Qué comando de Linux lista los puertos en escucha y el proceso que los usa?','ss -tulpn',['ip link show','df -h','top -n 1'],'ss (socket statistics) sustituye a netstat; -p muestra el proceso.');
  F('En Docker, ¿qué comando descarga una imagen de un registro?','docker pull',['docker run -d','docker commit','docker build'],'docker pull imagen[:tag] descarga la imagen.');
  F('En Docker, ¿qué comando envía la señal SIGKILL a un contenedor en ejecución?','docker kill',['docker stop (siempre SIGKILL)','docker rm','docker pause'],'docker stop envía SIGTERM y, tras un plazo, SIGKILL; docker kill envía SIGKILL directamente.');
  F('¿Qué hace el comando tar -czf copia.tar.gz /datos?','Crea (c) un archivo (f) comprimido con gzip (z) de /datos',['Extrae el archivo copia.tar.gz','Lista el contenido de /datos','Comprime con bzip2 y borra el original'],'c = create, z = gzip, f = fichero de salida.');
  F('¿Qué puerto utiliza por defecto IMAP sobre TLS (IMAPS)?','993',['143','995','465'],'IMAP 143; IMAPS 993; POP3S 995; SMTPS 465.');
  F('En Linux, ¿qué sistema se utiliza para registrar y auditar eventos de seguridad y llamadas al sistema?','auditd',['cron','rsyslogd únicamente para correo','udev'],'auditd es el demonio del sistema de auditoría del kernel Linux.');
  F('En PowerShell, ¿qué cmdlet copia ficheros o carpetas?','Copy-Item',['Move-Item','Get-ChildItem','Set-Location'],'Copy-Item copia; Move-Item mueve.');
  F('¿Qué cmdlet de PowerShell se emplea para promover un servidor creando un nuevo bosque de Active Directory?','Install-ADDSForest',['New-ADUser','Add-WindowsFeature DNS','Set-ADDomainMode'],'Install-ADDSForest crea el primer controlador de dominio de un bosque nuevo.');
  F('Según la estrategia de copias 3-2-1, ¿cuántas copias y en cuántos soportes distintos hay que mantener?','3 copias, en 2 soportes distintos, 1 de ellas fuera de la sede',['2 copias, en 3 soportes, 1 fuera','3 copias en el mismo soporte','1 copia completa y 2 incrementales'],'Reduce el riesgo de perder datos y copias a la vez.');
  F('En el Esquema Nacional de Seguridad (RD 311/2022), ¿qué niveles se asignan a cada dimensión de seguridad (disponibilidad, integridad, confidencialidad, autenticidad y trazabilidad)?','Bajo, medio y alto',['Público, interno y confidencial','Básico, avanzado y experto','Uno, dos y tres'],'Según el nivel más alto de las dimensiones se determina la categoría del sistema: básica, media o alta.');
  F('¿Qué ofrece TLS en una comunicación web?','Cifrado, integridad y autenticación del servidor',['Solo compresión de datos','Solo autenticación del cliente','Enrutamiento seguro entre redes'],'TLS protege la confidencialidad e integridad y autentica al servidor mediante su certificado.');
  F('¿En qué se diferencia SFTP de FTPS?','SFTP funciona sobre SSH (puerto 22); FTPS añade TLS a FTP',['SFTP no cifra y FTPS sí','FTPS usa SSH y SFTP usa TLS','Son el mismo protocolo con distinto nombre'],'SFTP no es FTP seguro: es un protocolo distinto sobre SSH.');
  F('Un WAF (Web Application Firewall) protege principalmente frente a:','Ataques a nivel de aplicación web (SQL injection, XSS…)',['Fallos de hardware','Ataques de denegación de servicio a la capa física','Pérdidas de paquetes en el router'],'Opera en la capa 7 e inspecciona el tráfico HTTP/HTTPS.');
  F('¿Para qué se utiliza tcpdump?','Para capturar y analizar paquetes de red',['Para configurar rutas estáticas','Para medir el uso de CPU','Para sincronizar la hora'],'Es un analizador de paquetes de línea de comandos.');
  F('¿Qué mecanismo de acceso al medio utiliza WiFi (802.11)?','CSMA/CA (evitación de colisiones)',['CSMA/CD (detección de colisiones)','Token Ring','TDMA fijo'],'Ethernet cableado clásico usaba CSMA/CD; WiFi usa CSMA/CA.');
  F('Para ampliar un volumen lógico LVM en caliente, ¿qué comando se ejecuta primero?','lvextend (y luego se amplía el sistema de ficheros, p. ej. xfs_growfs)',['mkfs.xfs','pvremove','vgsplit'],'lvextend aumenta el volumen lógico; después hay que crecer el sistema de ficheros.');
  F('Se quiere abrir HTTPS de forma permanente en el cortafuegos de RHEL 8. ¿Qué comando es correcto?','firewall-cmd --permanent --add-service=https',['iptables -F','ufw allow https','setenforce 0'],'firewalld es el cortafuegos de RHEL; después se recarga con --reload.');
  F('En el servicio DNS de un dominio de Active Directory, ¿qué tipo de registro localiza los controladores de dominio y servicios?','SRV',['MX','PTR','TXT'],'Los registros SRV indican host y puerto de servicios como LDAP o Kerberos.');
  var net=pick([1,2,3]);
  var nth=['primera','segunda','tercera','cuarta'];
  dyn.push(mk('Al dividir '+base+'/'+pre+' en 4 subredes iguales, ¿qué prefijo tiene cada una?','/'+subP,['/'+(subP+1),'/'+(subP-1),'/'+(pre+4)],'4 subredes = 2 bits más: /'+pre+' + 2 = /'+subP+'.'));
  dyn.push(mk('¿Cuál es la dirección de red de la '+nth[net]+' subred (VLAN '+(10*(net+1))+')?',IPs(subs[net])+'/'+subP,[IPs(subs[net]+subSize)+'/'+subP,IPs(subs[net-1])+'/'+subP,IPs(subs[net])+'/'+pre],'Cada subred ocupa '+subSize+' direcciones: la '+nth[net]+' empieza en '+IPs(subs[net])+'.'));
  var q2=ri(0,3);
  dyn.push(mk('¿Cuál es la dirección de difusión de la subred de la VLAN '+(10*(q2+1))+'?',IPs(subs[q2]+subSize-1),[IPs(subs[q2]+subSize),IPs(subs[q2]+subSize-2),IPs(subs[q2])],'La última dirección del bloque es la de difusión.'));
  dyn.push(nq('¿Cuántos equipos admite cada una de las 4 subredes?',subSize-2,[subSize,subSize-1,subSize/2-2],'2^'+(32-subP)+' − 2 = '+(subSize-2)+'.'));
  dyn.push(mk('¿Qué máscara tienen las subredes resultantes?',IPs(maskOf(subP)),[IPs(maskOf(subP+1)),IPs(maskOf(subP-1)),IPs(maskOf(pre))],'/'+subP+' → '+IPs(maskOf(subP))+'.'));
  dyn.push(nq('El almacenamiento usa RAID '+rd+' con '+nd+' discos de '+dsz+' TB. ¿Cuál es su capacidad útil?',cap,[nd*dsz,nd*dsz-dsz,nd*dsz-2*dsz,nd*dsz/2,dsz],rd===1?'RAID 1 es un espejo.':rd===5?'RAID 5: (n − 1) × tamaño.':rd===6?'RAID 6: (n − 2) × tamaño.':'RAID 10: la mitad de la capacidad bruta.',' TB'));
  var pa=pick([99,99.5,99.9,99.95,99.99]),dh=(100-pa)/100*8760,dtxt=dh>=1?fmt(dh)+' horas':fmt(dh*60)+' minutos',pw=[99,99.5,99.9,99.95,99.99].filter(function(x){return x!==pa}).map(function(x){var h=(100-x)/100*8760;return h>=1?fmt(h)+' horas':fmt(h*60)+' minutos'});
  dyn.push(mk('El CPD debe garantizar una disponibilidad del '+String(pa).replace('.',',')+' % anual. ¿Cuánta indisponibilidad admite aproximadamente?','Unas '+dtxt,take(pw,3).map(function(x){return 'Unas '+x}),'(100 − '+pa+') % de 8760 h = '+dtxt+'.'));
  var fl=ri(2,4),inc=R()<.5;
  dyn.push(nq('Copias: completa el domingo y '+(inc?'incrementales':'diferenciales')+' de lunes a sábado. Si el sistema falla el '+DAYN[fl]+' por la mañana, ¿cuántos juegos de copias hay que restaurar?',inc?1+fl:2,[1,2,3,4,5],inc?'La completa y cada incremental hasta el día anterior.':'La completa y la última diferencial.'));
  return {id:'cpd',b:4,title:sis+': CPD con Windows Server, RHEL y red segmentada ('+min+')',enun:enun,db:null,qs:chooseMix(fixed,dyn,20)}}

var GEN={prestamos:genPrestamos,pedidos:genPedidos,desarrollo:genDesarrollo,red:genRed,servidores:genServidores,cpd:genCPD};
var INFO=[{id:'desarrollo',b:3,t:'Desarrollo: Java/Spring, REST y Oracle (estilo examen oficial)',db:1},{id:'prestamos',b:3,t:'Base de datos: préstamos de biblioteca',db:1},{id:'pedidos',b:3,t:'Base de datos y programación: tienda online',db:1},{id:'cpd',b:4,t:'CPD: Windows Server, Linux, red y seguridad (estilo examen oficial)'},{id:'red',b:4,t:'Red de una delegación (VLSM)'},{id:'servidores',b:4,t:'Sala de servidores (RAID y copias)'}];
function gen(b,id){var c=INFO.filter(function(x){return x.b==b&&(!id||x.id===id)}),t=pick(c).id,r=null,n=0;while(!r&&n++<80){try{r=GEN[t]()}catch(e){r=null}}return r}
root.CASOS={gen:gen,info:INFO};
})(typeof window!=='undefined'?window:globalThis);
