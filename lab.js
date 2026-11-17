(function(){
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var A=window.SQLAB,esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var app=$('#app'),db=null,label='',score={a:0,n:0},hist=[];
/* ---------- aleatorio con semilla ---------- */
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function mk(seed){var r=rng(seed);return {f:r,i:function(a,b){return a+Math.floor(r()*(b-a+1))},p:function(l){return l[Math.floor(r()*l.length)]},n:function(p){return r()<p}}}
var NOM=['Ana','Luis','Marta','Pablo','Lucía','Jorge','Elena','Carlos','Sara','Diego','Irene','Raúl','Nuria','Hugo','Laura','Iván','Alba','Sergio','Paula','Mario','Clara','Óscar','Eva','Adrián'],APE=['García','López','Martín','Sánchez','Pérez','Gómez','Ruiz','Díaz','Moreno','Álvarez','Romero','Navarro','Torres','Gil'],CIU=['Madrid','Sevilla','Valencia','Bilbao','Zaragoza','Málaga','Murcia','Vigo','Toledo','Granada'];
function sq(v){return v===null?'NULL':typeof v==='number'?String(v):"'"+String(v).replace(/'/g,"''")+"'"}
function date(g,y0,y1){return g.i(y0,y1)+'-'+('0'+g.i(1,12)).slice(-2)+'-'+('0'+g.i(1,28)).slice(-2)}
var THEMES={
 tienda:{n:'🛒 Tienda online',schema:"CREATE TABLE Clientes(ClienteID INTEGER PRIMARY KEY,Nombre TEXT NOT NULL,Ciudad TEXT,Email TEXT UNIQUE);CREATE TABLE Productos(ProductoID INTEGER PRIMARY KEY,Nombre TEXT NOT NULL,Categoria TEXT,Precio REAL NOT NULL,Stock INTEGER NOT NULL);CREATE TABLE Pedidos(PedidoID INTEGER PRIMARY KEY,ClienteID INTEGER NOT NULL REFERENCES Clientes(ClienteID),Fecha TEXT,Estado TEXT);CREATE TABLE LineasPedido(PedidoID INTEGER REFERENCES Pedidos(PedidoID),ProductoID INTEGER REFERENCES Productos(ProductoID),Cantidad INTEGER NOT NULL,PRIMARY KEY(PedidoID,ProductoID));",
  data:function(g){var o=[],C=g.i(8,14),P=g.i(8,12),N=g.i(14,26),cat=['Informática','Hogar','Libros','Juguetes','Deporte'],pn=['Teclado','Ratón','Lámpara','Novela','Balón','Monitor','Cafetera','Puzle','Mochila','Auriculares','Silla','Cable','Pesas','Tablet'];
   for(var i=1;i<=C;i++)o.push("INSERT INTO Clientes VALUES("+i+","+sq(g.p(NOM)+' '+g.p(APE))+","+sq(g.n(.15)?null:g.p(CIU))+","+sq('u'+i+'@mail.es')+")");
   for(i=1;i<=P;i++)o.push("INSERT INTO Productos VALUES("+i+","+sq(g.p(pn)+' '+i)+","+sq(g.p(cat))+","+(g.i(5,300)+g.p([0,.5,.99]))+","+g.i(0,60)+")");
   for(i=1;i<=N;i++){o.push("INSERT INTO Pedidos VALUES("+i+","+g.i(1,Math.max(2,C-2))+","+sq(date(g,2023,2026))+","+sq(g.p(['pendiente','enviado','entregado','cancelado']))+")");var used={};for(var k=g.i(1,3);k>0;k--){var pr=g.i(1,P);if(used[pr])continue;used[pr]=1;o.push("INSERT INTO LineasPedido VALUES("+i+","+pr+","+g.i(1,6)+")")}}return o.join(';')}},
 instituto:{n:'🎓 Instituto',schema:"CREATE TABLE Profesores(ProfesorID INTEGER PRIMARY KEY,Nombre TEXT NOT NULL,Departamento TEXT);CREATE TABLE Asignaturas(AsignaturaID INTEGER PRIMARY KEY,Nombre TEXT NOT NULL,Creditos INTEGER,ProfesorID INTEGER REFERENCES Profesores(ProfesorID));CREATE TABLE Alumnos(AlumnoID INTEGER PRIMARY KEY,Nombre TEXT NOT NULL,Curso INTEGER,Ciudad TEXT);CREATE TABLE Matriculas(AlumnoID INTEGER REFERENCES Alumnos(AlumnoID),AsignaturaID INTEGER REFERENCES Asignaturas(AsignaturaID),Nota REAL,PRIMARY KEY(AlumnoID,AsignaturaID));",
  data:function(g){var o=[],T=g.i(4,6),S=g.i(5,8),A=g.i(12,22),sn=['Matemáticas','Física','Historia','Inglés','Lengua','Química','Música','Informática','Filosofía'],dp=['Ciencias','Letras','Idiomas'];
   for(var i=1;i<=T;i++)o.push("INSERT INTO Profesores VALUES("+i+","+sq(g.p(NOM)+' '+g.p(APE))+","+sq(g.p(dp))+")");
   for(i=1;i<=S;i++)o.push("INSERT INTO Asignaturas VALUES("+i+","+sq(sn[(i-1)%sn.length])+","+g.p([3,4,6])+","+(g.n(.12)?'NULL':g.i(1,T))+")");
   for(i=1;i<=A;i++){o.push("INSERT INTO Alumnos VALUES("+i+","+sq(g.p(NOM)+' '+g.p(APE))+","+g.i(1,4)+","+sq(g.p(CIU))+")");var u={};for(var k=g.i(1,4);k>0;k--){var s=g.i(1,S);if(u[s])continue;u[s]=1;o.push("INSERT INTO Matriculas VALUES("+i+","+s+","+(g.n(.2)?'NULL':(g.i(10,100)/10))+")")}}return o.join(';')}},
 hospital:{n:'🏥 Hospital',schema:"CREATE TABLE Medicos(MedicoID INTEGER PRIMARY KEY,Nombre TEXT NOT NULL,Especialidad TEXT);CREATE TABLE Pacientes(PacienteID INTEGER PRIMARY KEY,Nombre TEXT NOT NULL,Edad INTEGER,Ciudad TEXT);CREATE TABLE Citas(CitaID INTEGER PRIMARY KEY,MedicoID INTEGER NOT NULL REFERENCES Medicos(MedicoID),PacienteID INTEGER NOT NULL REFERENCES Pacientes(PacienteID),Fecha TEXT,Coste REAL);",
  data:function(g){var o=[],M=g.i(4,7),P=g.i(10,18),N=g.i(16,30),es=['Cardiología','Pediatría','Dermatología','Traumatología','Neurología'];
   for(var i=1;i<=M;i++)o.push("INSERT INTO Medicos VALUES("+i+","+sq('Dr. '+g.p(APE))+","+sq(g.p(es))+")");
   for(i=1;i<=P;i++)o.push("INSERT INTO Pacientes VALUES("+i+","+sq(g.p(NOM)+' '+g.p(APE))+","+g.i(1,90)+","+sq(g.p(CIU))+")");
   for(i=1;i<=N;i++)o.push("INSERT INTO Citas VALUES("+i+","+g.i(1,M)+","+g.i(1,P-1)+","+sq(date(g,2025,2026))+","+(g.n(.1)?'NULL':g.i(20,200))+")");return o.join(';')}},
 biblioteca:{n:'📚 Biblioteca',schema:"CREATE TABLE Autores(AutorID INTEGER PRIMARY KEY,Nombre TEXT NOT NULL,Pais TEXT);CREATE TABLE Libros(LibroID INTEGER PRIMARY KEY,Titulo TEXT NOT NULL,Anio INTEGER,Paginas INTEGER,AutorID INTEGER REFERENCES Autores(AutorID));CREATE TABLE Socios(SocioID INTEGER PRIMARY KEY,Nombre TEXT NOT NULL,Ciudad TEXT);CREATE TABLE Prestamos(PrestamoID INTEGER PRIMARY KEY,LibroID INTEGER REFERENCES Libros(LibroID),SocioID INTEGER REFERENCES Socios(SocioID),FechaPrestamo TEXT,FechaDevolucion TEXT);",
  data:function(g){var o=[],A=g.i(4,7),L=g.i(10,16),S=g.i(6,10),N=g.i(14,26),pa=['España','México','Argentina','Chile','Colombia'],ti=['El viaje','La casa','Sombras','Mar abierto','El faro','Ceniza','Camino','Invierno','Voces','El huerto','Raíces','Niebla'];
   for(var i=1;i<=A;i++)o.push("INSERT INTO Autores VALUES("+i+","+sq(g.p(NOM)+' '+g.p(APE))+","+sq(g.p(pa))+")");
   for(i=1;i<=L;i++)o.push("INSERT INTO Libros VALUES("+i+","+sq(ti[(i-1)%ti.length]+' '+g.i(1,9))+","+g.i(1950,2024)+","+g.i(80,900)+","+(g.n(.08)?'NULL':g.i(1,A))+")");
   for(i=1;i<=S;i++)o.push("INSERT INTO Socios VALUES("+i+","+sq(g.p(NOM)+' '+g.p(APE))+","+sq(g.p(CIU))+")");
   for(i=1;i<=N;i++)o.push("INSERT INTO Prestamos VALUES("+i+","+g.i(1,L)+","+g.i(1,S)+","+sq(date(g,2025,2026))+","+(g.n(.3)?'NULL':sq(date(g,2026,2026)))+")");return o.join(';')}},
 empresa:{n:'🏢 Empresa',schema:"CREATE TABLE Departamentos(DepID INTEGER PRIMARY KEY,Nombre TEXT NOT NULL,Ciudad TEXT);CREATE TABLE Empleados(EmpID INTEGER PRIMARY KEY,Nombre TEXT NOT NULL,Salario REAL,DepID INTEGER REFERENCES Departamentos(DepID),JefeID INTEGER REFERENCES Empleados(EmpID));CREATE TABLE Proyectos(ProyID INTEGER PRIMARY KEY,Nombre TEXT NOT NULL,Presupuesto REAL);CREATE TABLE Asignaciones(EmpID INTEGER REFERENCES Empleados(EmpID),ProyID INTEGER REFERENCES Proyectos(ProyID),Horas INTEGER,PRIMARY KEY(EmpID,ProyID));",
  data:function(g){var o=[],D=g.i(3,5),E=g.i(10,18),P=g.i(3,6),dn=['Informática','Ventas','RRHH','Finanzas','Logística'],pn=['Alfa','Beta','Gamma','Delta','Épsilon','Zeta'];
   for(var i=1;i<=D;i++)o.push("INSERT INTO Departamentos VALUES("+i+","+sq(dn[i-1])+","+sq(g.p(CIU))+")");
   for(i=1;i<=E;i++)o.push("INSERT INTO Empleados VALUES("+i+","+sq(g.p(NOM)+' '+g.p(APE))+","+g.i(1200,4200)+","+(g.n(.1)?'NULL':g.i(1,D))+","+(i===1?'NULL':g.i(1,i-1))+")");
   for(i=1;i<=P;i++)o.push("INSERT INTO Proyectos VALUES("+i+","+sq('Proyecto '+pn[i-1])+","+g.i(10,200)*1000+")");
   for(i=1;i<=E;i++){var u={};for(var k=g.i(0,2);k>0;k--){var p=g.i(1,P);if(u[p])continue;u[p]=1;o.push("INSERT INTO Asignaciones VALUES("+i+","+p+","+g.i(5,120)+")")}}return o.join(';')}}
};
var LEVELS=['Básico','Intermedio','Avanzado','Experto'];
function extend(d,lv,g){if(lv<1)return;var q1=function(sql){var r=d.exec(sql);return r.length?r[0].values:[]},cnt=function(t){return q1('SELECT COUNT(*) FROM "'+t+'"')[0][0]};
 var inf=A.info(d),ts=Object.keys(inf).filter(function(n){var p=inf[n].cols.filter(function(c){return c.pk});return p.length===1}),T1=ts[0],T2=ts[1]||ts[0],T3=ts[2]||ts[0],
  pk=function(t){return inf[t].cols.filter(function(c){return c.pk})[0].n},n1=cnt(T1),n2=cnt(T2),n3=cnt(T3),o=[];
 var tg=['urgente','revisado','destacado','archivo','nuevo','externo','interno'];
 // Intermedio: etiquetas N:M + notas 1:N
 o.push('CREATE TABLE Etiquetas(EtiquetaID INTEGER PRIMARY KEY,Nombre TEXT NOT NULL UNIQUE)');
 for(var i=0;i<tg.length;i++)o.push('INSERT INTO Etiquetas VALUES('+(i+1)+','+sq(tg[i])+')');
 o.push('CREATE TABLE '+T1+'_Etiquetas('+pk(T1)+'_Ref INTEGER REFERENCES '+T1+'('+pk(T1)+'),EtiquetaID INTEGER REFERENCES Etiquetas(EtiquetaID),PRIMARY KEY('+pk(T1)+'_Ref,EtiquetaID))');
 for(i=1;i<=n1;i++){var u={};for(var k=g.i(0,3);k>0;k--){var e=g.i(1,7);if(u[e])continue;u[e]=1;o.push('INSERT INTO '+T1+'_Etiquetas VALUES('+i+','+e+')')}}
 o.push('CREATE TABLE Notas_'+T2+'(NotaID INTEGER PRIMARY KEY,'+pk(T2)+'_Ref INTEGER NOT NULL REFERENCES '+T2+'('+pk(T2)+'),Texto TEXT,Fecha TEXT)');
 for(i=1;i<=Math.max(6,n2*2);i++)o.push('INSERT INTO Notas_'+T2+' VALUES('+i+','+g.i(1,n2)+','+sq(g.p(['Revisar','Pendiente de datos','Todo correcto','Consultar','Duplicado?']))+','+sq(date(g,2025,2026))+')');
 if(lv>=2){ // Avanzado: regiones jerárquicas, usuarios, registro (tabla de hechos con 3 FKs)
  o.push('CREATE TABLE Regiones(RegionID INTEGER PRIMARY KEY,Nombre TEXT NOT NULL,PadreID INTEGER REFERENCES Regiones(RegionID))');
  var rg=['España','Norte','Sur','Centro','Galicia','Andalucía','Madrid','Cataluña'],par=[null,1,1,1,2,3,4,2];for(i=0;i<rg.length;i++)o.push('INSERT INTO Regiones VALUES('+(i+1)+','+sq(rg[i])+','+(par[i]||'NULL')+')');
  o.push('CREATE TABLE Usuarios(UsuarioID INTEGER PRIMARY KEY,Nombre TEXT NOT NULL,Email TEXT UNIQUE,RegionID INTEGER REFERENCES Regiones(RegionID))');
  var NU=g.i(8,12);for(i=1;i<=NU;i++)o.push('INSERT INTO Usuarios VALUES('+i+','+sq(g.p(NOM)+' '+g.p(APE))+','+sq('usr'+i+'@corp.es')+','+g.i(1,8)+')');
  o.push('CREATE TABLE Registro(RegistroID INTEGER PRIMARY KEY,UsuarioID INTEGER NOT NULL REFERENCES Usuarios(UsuarioID),'+pk(T3)+'_Ref INTEGER REFERENCES '+T3+'('+pk(T3)+'),Accion TEXT,Fecha TEXT)');
  for(i=1;i<=g.i(20,32);i++)o.push('INSERT INTO Registro VALUES('+i+','+g.i(1,NU-1)+','+(g.n(.1)?'NULL':g.i(1,n3))+','+sq(g.p(['alta','baja','consulta','modificación']))+','+sq(date(g,2025,2026))+')');
  o.push('ALTER TABLE '+T1+' ADD COLUMN RegionID INTEGER REFERENCES Regiones(RegionID)');o.push('UPDATE '+T1+' SET RegionID=(abs(random())%8)+1')}
 if(lv>=3){ // Experto: permisos N:M, supervisor (auto-relación), valoraciones (PK compuesta), documentos
  o.push('CREATE TABLE Permisos(PermisoID INTEGER PRIMARY KEY,Nombre TEXT NOT NULL UNIQUE)');['leer','escribir','borrar','administrar'].forEach(function(p,i){o.push('INSERT INTO Permisos VALUES('+(i+1)+','+sq(p)+')')});
  o.push('CREATE TABLE UsuarioPermiso(UsuarioID INTEGER REFERENCES Usuarios(UsuarioID),PermisoID INTEGER REFERENCES Permisos(PermisoID),Desde TEXT,PRIMARY KEY(UsuarioID,PermisoID))');
  for(i=1;i<=NU;i++){var u2={};for(k=g.i(1,3);k>0;k--){var p=g.i(1,4);if(u2[p])continue;u2[p]=1;o.push('INSERT INTO UsuarioPermiso VALUES('+i+','+p+','+sq(date(g,2024,2026))+')')}}
  o.push('ALTER TABLE Usuarios ADD COLUMN SupervisorID INTEGER REFERENCES Usuarios(UsuarioID)');o.push('UPDATE Usuarios SET SupervisorID=(UsuarioID+1)/2 WHERE UsuarioID>1 AND (UsuarioID+1)/2<>UsuarioID');
  o.push('CREATE TABLE Valoraciones(UsuarioID INTEGER REFERENCES Usuarios(UsuarioID),'+pk(T1)+'_Ref INTEGER REFERENCES '+T1+'('+pk(T1)+'),Puntos INTEGER CHECK(Puntos BETWEEN 1 AND 5),Comentario TEXT,PRIMARY KEY(UsuarioID,'+pk(T1)+'_Ref))');
  for(i=1;i<=g.i(14,24);i++){var uu=g.i(1,NU),tt=g.i(1,n1);o.push('INSERT OR IGNORE INTO Valoraciones VALUES('+uu+','+tt+','+g.i(1,5)+','+(g.n(.3)?'NULL':sq(g.p(['Muy bien','Regular','Mejorable','Excelente'])))+')')}
  o.push('CREATE TABLE Documentos(DocumentoID INTEGER PRIMARY KEY,UsuarioID INTEGER NOT NULL REFERENCES Usuarios(UsuarioID),'+pk(T2)+'_Ref INTEGER REFERENCES '+T2+'('+pk(T2)+'),Titulo TEXT NOT NULL,TamanoKB INTEGER)');
  for(i=1;i<=g.i(10,18);i++)o.push('INSERT INTO Documentos VALUES('+i+','+g.i(1,NU)+','+(g.n(.15)?'NULL':g.i(1,n2))+','+sq('Doc_'+g.i(100,999))+','+g.i(5,5000)+')')}
 o.forEach(function(x){d.run(x)})}
function randomDb(theme,seed,lv){var T=THEMES[theme],d=new (A.SQL().Database)(),g=mk(seed);d.run(T.schema);d.run(T.data(g));extend(d,lv||0,mk(seed+7));return d}
/* ---------- utilidades de BD ---------- */
function Q(sql){var r=db.exec(sql);return r.length?r[0].values:[]}
function val(sql){var r=Q(sql);return r.length?r[0][0]:null}
function tables(){return Object.keys(A.info(db))}
function qi(n){return '"'+String(n).replace(/"/g,'""')+'"'}
function fv(v){if(v===null)return 'NULL';if(typeof v==='number')return String(Math.round(v*100)/100);return String(v)}
function shuf(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function pick(l){return l[Math.floor(Math.random()*l.length)]}
function sigOf(sql){try{var r=db.exec(sql);if(!r.length)return 'NONE';return JSON.stringify(r[0].values.map(function(v){return JSON.stringify(v)}).sort())}catch(e){return 'ERR:'+e.message}}
function numOpts(c,pool){var s={},o=[String(c)];s[c]=1;(pool||[]).forEach(function(x){x=fv(x);if(!s[x]&&o.length<4){s[x]=1;o.push(x)}});var tries=0;
 while(o.length<4&&tries++<50){var d=Math.max(1,Math.round(Math.abs(+c||5)*0.15)),x=Math.round((+c||0)+(Math.floor(Math.random()*2*d+1)-d)*(Math.random()<.5?1:2));if(x<0||s[String(x)])continue;s[String(x)]=1;o.push(String(x))}return o.length===4?o:null}
function numCols(t){var inf=A.info(db)[t],r=[];inf.cols.forEach(function(c){if(c.pk||inf.fks.some(function(f){return f.from===c.n}))return;var ty=Q("SELECT DISTINCT typeof("+qi(c.n)+") FROM "+qi(t)+" WHERE "+qi(c.n)+" IS NOT NULL").map(function(x){return x[0]});if(ty.length&&ty.every(function(x){return x==='integer'||x==='real'}))r.push(c.n)});return r}
function txtCols(t){var inf=A.info(db)[t],r=[];inf.cols.forEach(function(c){if(c.pk)return;var d=val("SELECT COUNT(DISTINCT "+qi(c.n)+") FROM "+qi(t)),n=val("SELECT COUNT(*) FROM "+qi(t));if(d>=3&&d<=Math.max(3,n*0.8)&&val("SELECT COUNT(*) FROM "+qi(t)+" WHERE typeof("+qi(c.n)+")='text'")>0)r.push(c.n)});return r}
function code(s){return '<code>'+esc(s)+'</code>'}
/* ---------- generadores de preguntas (la respuesta correcta se calcula ejecutando) ---------- */
var GEN={
 count:function(){var t=pick(tables()),c=val("SELECT COUNT(*) FROM "+qi(t)),others=tables().filter(function(x){return x!==t}).map(function(x){return val("SELECT COUNT(*) FROM "+qi(x))});var o=numOpts(c,[c+1,c-1,c*2].concat(others));
  return o&&{q:'¿Cuántas filas devuelve '+code('SELECT * FROM '+t+';')+'?',o:o,e:'COUNT(*) de la tabla '+t+' = '+c+'.'}},
 pk:function(){var inf=A.info(db),t=pick(tables().filter(function(n){return inf[n].cols.some(function(c){return c.pk})})),pks=inf[t].cols.filter(function(c){return c.pk}).map(function(c){return c.n}),c=pks.join(' + ');
  var cols=inf[t].cols.map(function(x){return x.n}).filter(function(n){return pks.indexOf(n)<0}),pool=cols.concat(Object.keys(inf).filter(function(n){return n!==t}).map(function(n){return inf[n].cols[0].n}));
  var o=[c],seen={};seen[c]=1;shuf(pool).forEach(function(x){if(!seen[x]&&o.length<4){seen[x]=1;o.push(x)}});if(pks.length>1&&o.length<4){var mix=pks[0]+' + '+cols[0];if(!seen[mix]&&cols[0]){o.push(mix)}}
  return o.length===4&&{q:'¿Cuál es la clave primaria de la tabla '+code(t)+'?',o:o,e:'La PK de '+t+' es '+c+(pks.length>1?' (clave compuesta).':'.')}},
 fk:function(){var inf=A.info(db),L=[];Object.keys(inf).forEach(function(t){inf[t].fks.forEach(function(f){L.push([t,f])})});if(!L.length)return null;var x=pick(L),c=x[1].table,pool=Object.keys(inf).filter(function(n){return n!==c});
  var o=[c].concat(shuf(pool).slice(0,3));return o.length===4&&{q:'¿A qué tabla hace referencia la clave foránea '+code(x[0]+'.'+x[1].from)+'?',o:o,e:x[0]+'.'+x[1].from+' REFERENCES '+c+(x[1].to?'('+x[1].to+')':'')+'.'}},
 agg:function(){var t=pick(tables()),nc=numCols(t);if(!nc.length)return null;var c=pick(nc),Ct=qi(c),Tt=qi(t),fn=pick(['MAX','MIN','AVG','SUM']);
  var vals={MAX:val("SELECT MAX("+Ct+") FROM "+Tt),MIN:val("SELECT MIN("+Ct+") FROM "+Tt),AVG:val("SELECT AVG("+Ct+") FROM "+Tt),SUM:val("SELECT SUM("+Ct+") FROM "+Tt),CNT:val("SELECT COUNT(*) FROM "+Tt)};
  var cv=fv(vals[fn]),o=numOpts(cv,[vals.MAX,vals.MIN,vals.AVG,vals.SUM,vals.CNT].filter(function(x){return fv(x)!==cv}));return o&&{q:'¿Qué valor devuelve '+code('SELECT '+fn+'('+c+') FROM '+t+';')+'?',o:o,e:fn+'('+c+') = '+cv+'. Las funciones de agregado ignoran los NULL (salvo COUNT(*)).'}},
 distinct:function(){var t=pick(tables()),inf=A.info(db)[t],c=pick(inf.cols).n,a=val("SELECT COUNT(DISTINCT "+qi(c)+") FROM "+qi(t)),n=val("SELECT COUNT(*) FROM "+qi(t)),b=val("SELECT COUNT("+qi(c)+") FROM "+qi(t));
  var o=numOpts(a,[n,b,a+1,a-1]);return o&&{q:'¿Cuántos valores distintos (no nulos) tiene la columna '+code(t+'.'+c)+', es decir, qué devuelve '+code('SELECT COUNT(DISTINCT '+c+') FROM '+t+';')+'?',o:o,e:'COUNT(DISTINCT) = '+a+'; COUNT('+c+') = '+b+' (cuenta no nulos, con repetidos); COUNT(*) = '+n+'.'}},
 where:function(){var t=pick(tables()),nc=numCols(t);if(!nc.length)return null;var c=pick(nc),vs=Q("SELECT "+qi(c)+" FROM "+qi(t)+" WHERE "+qi(c)+" IS NOT NULL ORDER BY 1"),k=vs[Math.floor(vs.length/2)][0],ops=['>','>=','<','<=','=','<>'],op=pick(ops.slice(0,4));
  var cnt=function(o){return val("SELECT COUNT(*) FROM "+qi(t)+" WHERE "+qi(c)+" "+o+" "+k)},cv=cnt(op),o=numOpts(cv,ops.filter(function(x){return x!==op}).map(cnt));
  return o&&{q:'¿Cuántas filas devuelve '+code('SELECT * FROM '+t+' WHERE '+c+' '+op+' '+k+';')+'?',o:o,e:'Con '+op+' '+k+' se obtienen '+cv+' filas. Las filas con '+c+' NULL nunca cumplen la comparación.'}},
 nulls:function(){var inf=A.info(db),L=[];tables().forEach(function(t){inf[t].cols.forEach(function(c){if(!c.pk&&val("SELECT COUNT(*) FROM "+qi(t)+" WHERE "+qi(c.n)+" IS NULL")>0)L.push([t,c.n])})});if(!L.length)return null;var x=pick(L),t=x[0],c=x[1];
  var good='SELECT * FROM '+t+' WHERE '+c+' IS NULL;',bad=['SELECT * FROM '+t+' WHERE '+c+' = NULL;','SELECT * FROM '+t+" WHERE "+c+" = '';",'SELECT * FROM '+t+' WHERE '+c+' IS NOT NULL;'],g=sigOf(good);
  if(bad.some(function(b){return sigOf(b)===g}))return null;return {q:'Quieres las filas de '+code(t)+' en las que <b>'+esc(c)+'</b> no tiene valor (es NULL). ¿Qué consulta es correcta?',o:[good].concat(bad),code:1,e:'NULL se comprueba con IS NULL; "= NULL" nunca es verdadero (lógica de tres valores).'}},
 join:function(){var inf=A.info(db),L=[];Object.keys(inf).forEach(function(t){inf[t].fks.forEach(function(f){if(inf[f.table]&&f.to&&f.table!==t)L.push([t,f])})});if(!L.length)return null;var x=pick(L),c=x[0],f=x[1],p=f.table,on=c+'.'+f.from+' = '+p+'.'+f.to;
  var inner=val("SELECT COUNT(*) FROM "+qi(c)+" JOIN "+qi(p)+" ON "+on.replace(/(\w+)\.(\w+) = (\w+)\.(\w+)/,'"$1"."$2" = "$3"."$4"')),left=val("SELECT COUNT(*) FROM "+qi(c)+" LEFT JOIN "+qi(p)+" ON "+on.replace(/(\w+)\.(\w+) = (\w+)\.(\w+)/,'"$1"."$2" = "$3"."$4"')),pl=val("SELECT COUNT(*) FROM "+qi(p)+" LEFT JOIN "+qi(c)+" ON "+on.replace(/(\w+)\.(\w+) = (\w+)\.(\w+)/,'"$1"."$2" = "$3"."$4"')),cross=val("SELECT COUNT(*) FROM "+qi(c))*val("SELECT COUNT(*) FROM "+qi(p));
  var typ=pick(['INNER','LEFT','RIGHT','CROSS']),sql,cv;
  if(typ==='INNER'){sql='SELECT * FROM '+c+' INNER JOIN '+p+' ON '+on+';';cv=inner}else if(typ==='LEFT'){sql='SELECT * FROM '+c+' LEFT JOIN '+p+' ON '+on+';';cv=left}else if(typ==='RIGHT'){sql='SELECT * FROM '+c+' RIGHT JOIN '+p+' ON '+on+';';cv=val("SELECT COUNT(*) FROM "+qi(p)+" LEFT JOIN "+qi(c)+" ON "+on.replace(/(\w+)\.(\w+) = (\w+)\.(\w+)/,'"$3"."$4" = "$1"."$2"'))}else{sql='SELECT * FROM '+c+' CROSS JOIN '+p+';';cv=cross}
  var o=numOpts(cv,[inner,left,pl,cross,val("SELECT COUNT(*) FROM "+qi(c)),val("SELECT COUNT(*) FROM "+qi(p))]);return o&&{q:'¿Cuántas filas devuelve '+code(sql)+'?',o:o,e:typ+' JOIN → '+cv+' filas. (INNER = '+inner+', LEFT desde '+c+' = '+left+', producto cartesiano = '+cross+'.)'}},
 orphans:function(){var inf=A.info(db),L=[];Object.keys(inf).forEach(function(t){inf[t].fks.forEach(function(f){if(inf[f.table]&&f.to&&f.table!==t)L.push([t,f])})});if(!L.length)return null;var x=pick(L),c=x[0],f=x[1],p=f.table,pk=p+'.'+f.to;
  var good='SELECT '+pk+' FROM '+p+' LEFT JOIN '+c+' ON '+c+'.'+f.from+' = '+pk+' WHERE '+c+'.'+f.from+' IS NULL;',
  bad=['SELECT '+pk+' FROM '+p+' INNER JOIN '+c+' ON '+c+'.'+f.from+' = '+pk+';','SELECT '+pk+' FROM '+p+' LEFT JOIN '+c+' ON '+c+'.'+f.from+' = '+pk+' WHERE '+c+'.'+f.from+' IS NOT NULL;','SELECT '+pk+' FROM '+p+' WHERE '+pk+' IN (SELECT '+f.from+' FROM '+c+');'],g=sigOf(good);
  if(g==='NONE'||g.indexOf('ERR')===0||bad.some(function(b){return sigOf(b)===g}))return null;return {q:'¿Qué consulta devuelve los registros de <b>'+esc(p)+'</b> que <b>no tienen ningún</b> registro asociado en <b>'+esc(c)+'</b>?',o:[good].concat(bad),code:1,e:'LEFT JOIN + IS NULL en la clave de la tabla hija ("anti-join") deja solo los padres sin hijos.'}},
 order:function(){var t=pick(tables()),inf=A.info(db)[t],cs=inf.cols.filter(function(c){return !c.pk}),c=pick(cs).n,vs=Q("SELECT DISTINCT "+qi(c)+" FROM "+qi(t)+" WHERE "+qi(c)+" IS NOT NULL");if(vs.length<4)return null;var desc=Math.random()<.5,
  good=val("SELECT "+qi(c)+" FROM "+qi(t)+" ORDER BY "+qi(c)+(desc?" DESC":" ASC")+" LIMIT 1"),opp=val("SELECT "+qi(c)+" FROM "+qi(t)+" ORDER BY "+qi(c)+(desc?" ASC":" DESC")+" LIMIT 1"),first=val("SELECT "+qi(c)+" FROM "+qi(t)+" LIMIT 1"),oth=pick(vs)[0];
  var o=[fv(good)],s={};s[o[0]]=1;[opp,first,oth].concat(vs.map(function(v){return v[0]})).forEach(function(v){v=fv(v);if(!s[v]&&o.length<4){s[v]=1;o.push(v)}});return o.length===4&&{q:'¿Qué valor devuelve '+code('SELECT '+c+' FROM '+t+' ORDER BY '+c+(desc?' DESC':'')+' LIMIT 1;')+'? (NULL se ignora en las opciones)',o:o,e:'ORDER BY '+c+(desc?' DESC':' ASC')+' LIMIT 1 = '+fv(good)+'.'}},
 group:function(){var t=pick(tables()),tc=txtCols(t);if(!tc.length)return null;var c=pick(tc),g=Q("SELECT "+qi(c)+",COUNT(*) n FROM "+qi(t)+" WHERE "+qi(c)+" IS NOT NULL GROUP BY "+qi(c)+" ORDER BY n DESC,1");if(g.length<4||g[0][1]===g[1][1])return null;
  var f=function(r){return fv(r[0])+' → '+r[1]},o=[f(g[0]),f(g[g.length-1]),f(g[1]),f([g[0][0],g[0][1]+1])];if(g[g.length-1][1]===g[0][1])return null;
  return {q:'¿Cuál es la primera fila de '+code('SELECT '+c+', COUNT(*) FROM '+t+' GROUP BY '+c+' ORDER BY COUNT(*) DESC;')+'? (formato valor → nº de filas)',o:o,e:'GROUP BY agrupa por '+c+'; ORDER BY COUNT(*) DESC deja arriba el grupo más numeroso: '+f(g[0])+'.'}}
};
var NAMES=Object.keys(GEN);window.LABGEN={GEN:GEN,setDb:function(t,s,l){setDb(randomDb(t,s,l),t)}};var lastT='';
var WT={count:1,pk:1,fk:1,agg:3,distinct:2,where:3,nulls:3,join:3,orphans:3,order:2,group:3};
function wpick(){var b=[];NAMES.forEach(function(n){if(n===lastT)return;for(var k=0;k<WT[n];k++)b.push(n)});return pick(b)}
function makeQ(){for(var i=0;i<80;i++){var n=wpick(),q;try{q=GEN[n]()}catch(e){q=null}if(q&&q.o&&q.o.length===4){q.type=n;lastT=n;return q}}return null}
/* ---------- UI ---------- */
function setDb(d,lbl){if(db)try{db.close()}catch(e){}db=d;label=lbl;hist=[];renderAll()}
function renderAll(){var inf=A.info(db),names=Object.keys(inf),h='';
 h+='<div class="labban">🔒 Todo vive solo en la memoria de esta pestaña: lo que subas o ejecutes <b>no se guarda</b> y se borra al cerrar sesión, recargar o cerrar la pestaña.</div>';
 h+='<section class="pcard"><h2>1 · Base de datos</h2><div class="row"><label class="f">Dificultad<select id="lv">'+LEVELS.map(function(l,i){return '<option value="'+i+'">'+["🟢 ","🟡 ","🟠 ","🔴 "][i]+l+' ('+["3-4","6-7","10-11","14-15"][i]+' tablas)</option>'}).join('')+'</select></label><label class="f">Tema aleatorio<select id="th">'+Object.keys(THEMES).map(function(k){return '<option value="'+k+'">'+THEMES[k].n+'</option>'}).join('')+'</select></label><button id="rnd" class="go">🎲 Nueva BD aleatoria</button><label class="chip">⬆ Subir la mía<input id="up" type="file" multiple accept=".sqlite,.sqlite3,.db,.sql,.csv" hidden></label><button id="dlb">⬇ Descargar .sqlite</button></div>'
  +'<p class="sub">Subir: <b>.sqlite/.db</b> (base completa), <b>.sql</b> (script CREATE/INSERT) o <b>.csv</b> (se crea una tabla con el nombre del archivo; puedes subir varios). Actual: <b>'+esc(label)+'</b> · '+names.length+' tabla(s).</p><div id="upm"></div>'
  +'<div class="tchips">'+names.map(function(n){return '<button class="tb" data-t="'+esc(n)+'">'+esc(n)+' <small>('+val("SELECT COUNT(*) FROM "+qi(n))+')</small></button>'}).join('')+'</div>'
  +'<div id="erd">'+A.diagram(inf,names.slice(0,18),'Esquema de la BD ('+label+')')+'</div></section>';
 h+='<section class="pcard"><h2>2 · Consola SQL</h2><textarea id="cin" spellcheck="false">'+esc(names.length?'SELECT * FROM '+names[0]+' LIMIT 20;':'-- crea una tabla o sube una BD')+'</textarea><div class="row"><button id="run" class="go">▶ Ejecutar (Ctrl+Enter)</button><button id="hb">↶ Historial</button><span class="sub">Puedes usar INSERT, UPDATE, DELETE, CREATE, DROP… sin miedo: afectan solo a esta copia en memoria.</span></div><div id="hl" hidden></div><div id="out"></div></section>';
 h+='<section class="pcard"><h2>3 · Test aleatorio sobre esta BD</h2><p class="sub">Las preguntas se <b>generan analizando el esquema y los datos</b> de la BD cargada (también la que subas) y la respuesta correcta se calcula ejecutando las consultas. Siempre 4 opciones.</p><div id="tq"></div></section>';
 h+='<p class="sub">Más ejercicios de SQL con enunciados y variantes ilimitadas: <a href="practicas.html#sql">Prácticas SQL</a>.</p>';
 app.innerHTML=h;A.bindDl(app);
 $('#rnd').onclick=function(){var lv=+$('#lv').value;setDb(randomDb($('#th').value,Math.floor(Math.random()*1e9),lv),THEMES[$('#th').value].n+' · '+LEVELS[lv]+' (aleatoria)')};
 $('#th').value=window._lt||'tienda';$('#lv').value=window._lv||0;$('#lv').onchange=function(){window._lv=$('#lv').value;$('#rnd').click()};$('#th').onchange=function(){window._lt=$('#th').value};
 $('#dlb').onclick=function(){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([db.export()],{type:'application/x-sqlite3'}));a.download='mi_bd.sqlite';a.click()};
 $('#up').onchange=function(){upload(this.files);this.value=''};
 $$('.tb').forEach(function(b){b.onclick=function(){$('#cin').value='SELECT * FROM '+qi(b.dataset.t)+' LIMIT 50;';run()}});
 var ta=$('#cin');ta.onkeydown=function(e){if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();run()}};$('#run').onclick=run;
 $('#hb').onclick=function(){var l=$('#hl');l.hidden=!l.hidden;l.innerHTML=hist.slice(-15).reverse().map(function(s,i){return '<div class="hi" data-i="'+(hist.length-1-i)+'"><code>'+esc(s.length>120?s.slice(0,118)+'…':s)+'</code></div>'}).join('')||'<span class="sub">Aún no hay consultas</span>';$$('.hi',l).forEach(function(d){d.onclick=function(){ta.value=hist[+d.dataset.i];l.hidden=true}})};
 nextQ()}
function run(){var sql=$('#cin').value,o=$('#out');if(!sql.trim())return;hist.push(sql);var t0=performance.now();
 try{var r=db.exec(sql);o.innerHTML=A.resTable(r)+'<div class="sub">'+Math.round(performance.now()-t0)+' ms</div>';
  if(/\b(create|drop|alter)\b/i.test(sql)){var inf=A.info(db),nm=Object.keys(inf);$('#erd').innerHTML=A.diagram(inf,nm.slice(0,18),'Esquema de la BD ('+label+')');A.bindDl($('#erd'));$('.tchips').innerHTML=nm.map(function(n){return '<button class="tb" data-t="'+esc(n)+'">'+esc(n)+'</button>'}).join('');$$('.tb').forEach(function(b){b.onclick=function(){$('#cin').value='SELECT * FROM '+qi(b.dataset.t)+' LIMIT 50;';run()}})}}
 catch(x){o.innerHTML='<div class="out ko">'+esc(x.message)+'</div>'}}
function csv(text,name){var rows=[],row=[],f='',q=false;text=text.replace(/^﻿/,'');var sep=(text.split('\n')[0].match(/;/g)||[]).length>(text.split('\n')[0].match(/,/g)||[]).length?';':',';
 for(var i=0;i<text.length;i++){var ch=text[i];if(q){if(ch==='"'){if(text[i+1]==='"'){f+='"';i++}else q=false}else f+=ch}else if(ch==='"')q=true;else if(ch===sep){row.push(f);f=''}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(f);f='';if(row.length>1||row[0]!=='')rows.push(row);row=[]}else f+=ch}
 if(f!==''||row.length){row.push(f);rows.push(row)}
 if(rows.length<2)throw new Error('CSV vacío');var hd=rows.shift().map(function(h,i){return (h||'col'+(i+1)).trim().replace(/[^\w]+/g,'_')||'col'+(i+1)});
 var ty=hd.map(function(_,j){var all=rows.filter(function(r){return r[j]!==undefined&&r[j]!==''});return all.length&&all.every(function(r){return /^-?\d+$/.test(r[j])})?'INTEGER':all.length&&all.every(function(r){return /^-?\d*\.\d+$|^-?\d+$/.test(r[j])})?'REAL':'TEXT'});
 var tn=name.replace(/\.[^.]+$/,'').replace(/[^\w]+/g,'_').replace(/^(\d)/,'t$1')||'datos';db.run('CREATE TABLE '+qi(tn)+'('+hd.map(function(h,j){return qi(h)+' '+ty[j]}).join(',')+')');
 var st=db.prepare('INSERT INTO '+qi(tn)+' VALUES('+hd.map(function(){return '?'}).join(',')+')');rows.forEach(function(r){st.run(hd.map(function(_,j){var v=r[j];return v===undefined||v===''?null:ty[j]==='TEXT'?v:+v}))});st.free();return tn}
function upload(files){var fl=Array.prototype.slice.call(files),SQLm=A.SQL(),base=null,msgs=[];
 function nxt(){var f=fl.shift();if(!f){finish();return}var r=new FileReader();r.onerror=function(){msgs.push('✘ '+f.name+': no se pudo leer');nxt()};
  if(/\.(sqlite3?|db)$/i.test(f.name)){r.onload=function(){try{base=new SQLm.Database(new Uint8Array(r.result));base.exec('SELECT name FROM sqlite_master');msgs.push('✔ '+f.name+' cargada')}catch(e){msgs.push('✘ '+f.name+': '+e.message);base=null}nxt()};r.readAsArrayBuffer(f)}
  else{r.onload=function(){try{if(!base)base=new SQLm.Database();var old=db;db=base;try{if(/\.csv$/i.test(f.name))msgs.push('✔ '+f.name+' → tabla '+csv(r.result,f.name));else{base.run(r.result);msgs.push('✔ '+f.name+' ejecutado')}}finally{db=old}}catch(e){msgs.push('✘ '+f.name+': '+e.message)}nxt()};r.readAsText(f)}}
 function finish(){if(base){setDb(base,fl.length||true?'tu archivo':'');}var m=$('#upm');if(m)m.innerHTML=msgs.map(function(x){return '<div class="'+(x[0]==='✔'?'ok':'ko')+'">'+esc(x)+'</div>'}).join('')}
 nxt()}
function nextQ(){var q=makeQ(),box=$('#tq');if(!q){box.innerHTML='<p class="sub">No he podido generar preguntas con esta BD (necesita al menos una tabla con datos). Prueba con otra.</p>';return}
 var o=q.o.map(function(t,i){return {t:t,ok:i===0}});o=shuf(o);var L='ABCD',done=false;
 box.innerHTML='<div class="qzh"><b>🧠 Pregunta generada</b><span class="bp">'+score.a+' aciertos / '+score.n+' intentos</span></div><p class="qq">'+q.q+'</p><div class="opts">'+o.map(function(x,i){return '<div class="opt"><button class="pick"><span class="L">'+L[i]+'</span>'+(q.code?'<pre>'+esc(x.t)+'</pre>':'<span class="ot">'+esc(x.t)+'</span>')+'</button></div>'}).join('')+'</div><div class="fb" hidden></div><div class="row"><button id="nq">↻ Otra pregunta</button></div>';
 $$('.pick',box).forEach(function(b,i){b.onclick=function(){if(done)return;done=true;score.n++;if(o[i].ok)score.a++;$$('.opt',box).forEach(function(e,j){e.classList.add(o[j].ok?'good':'dim');if(j===i&&!o[j].ok)e.classList.add('bad')});var fb=$('.fb',box);fb.hidden=false;fb.innerHTML=(o[i].ok?'<span class="ok">✔ ¡Correcto!</span> ':'<span class="ko">✘ Incorrecto.</span> La correcta era la <b>'+L[o.findIndex(function(x){return x.ok})]+'</b>. ')+esc(q.e);$('.bp',box).textContent=score.a+' aciertos / '+score.n+' intentos'}});
 $('#nq').onclick=nextQ}
A.load(function(){setDb(randomDb('tienda',Math.floor(Math.random()*1e9)),THEMES.tienda.n+' (aleatoria)')});
window.addEventListener('tai-logout',function(){try{db&&db.close()}catch(e){}db=null});
})();
