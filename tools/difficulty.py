#!/usr/bin/env python3
"""Asigna a cada pregunta de data/preguntas.json un nivel de dificultad `df` (1 fácil, 2 media, 3 difícil).

Heurística estática (sin datos de usuarios): mezcla de longitud, solapamiento entre opciones (distractores
muy parecidos), negaciones, datos exactos (cifras, fechas, artículos), enunciados aplicados (código, comandos),
opciones combinadas y pistas de longitud. Los umbrales se calculan por bloque (b1..b4) con cuantiles para que
cada bloque tenga el mismo reparto (~32 % fácil · 44 % media · 24 % difícil).

Uso:  python3 tools/difficulty.py [--stats]
Hay que volver a ejecutarlo cuando se añadan preguntas nuevas. El navegador usa q.df y, si falta, una estimación
con la misma fórmula (diff.js).
"""
import json,re,sys,statistics
P='data/preguntas.json'
Q1,Q2=0.32,0.76   # cuantiles de corte
def toks(t):
    return {w for w in re.split(r'[^a-záéíóúñ0-9]+',re.sub(r'<[^>]+>',' ',t.lower())) if len(w)>3}
NEG=re.compile(r'\b(no es|no son|excepto|incorrecta|incorrectas|falsa|falsas|no corresponde|salvo|no forma|no se|ninguna de)\b',re.I)
APP=re.compile(r'\b(dado|dada|supón|suponga|siguiente (c[oó]digo|comando|consulta|script|tabla|configuraci[oó]n|direcci[oó]n)|qu[eé] (devuelve|resultado|muestra|hace)|ejecut|comando|select |bash|\d+\.\d+\.\d+|/\d{1,2}\b)',re.I)
FACT=re.compile(r'(\b\d{2,}\b|art[ií]culo|ley \d|real decreto|plazo|a[ñn]o|d[ií]as|meses|porcentaje|n[uú]mero de|cu[aá]nt[oa]s)',re.I)
COMB=re.compile(r'(todas las anteriores|ninguna de las anteriores|ambas|\b[ivx]+\s*[,y]\s*[ivx]+\b|a\) y b\)|solo (a|b|la)\b)',re.I)
def score(q):
    s,o,c=q['q'],q['o'],q['c']
    ts=[toks(x) for x in o]
    ov=0;n=0
    for i in range(len(ts)):
        for j in range(i+1,len(ts)):
            m=min(len(ts[i]),len(ts[j])) or 1
            ov+=len(ts[i]&ts[j])/m*min(1,m/4);n+=1   # con pocas palabras el solape no dice nada
    ov=ov/n if n else 0
    L=len(s)+sum(len(x) for x in o)
    sc=.30*min(1,L/700)+.28*min(1,ov/.5)
    sc+=.14*(1 if NEG.search(s) else 0)
    nf=sum(1 for x in o if re.search(r'\d{2,}',x))
    sc+=.08*(1 if (nf>=2 or FACT.search(s)) else 0)+.06*(1 if nf>=3 else 0)
    sc+=.08*(1 if APP.search(s) or re.search(r'[{}<>=;$]',s) else 0)
    sc+=.06*(1 if COMB.search(' '.join(o)+' '+s) else 0)
    ls=sorted(len(x) for x in o)
    if len(o[c])==ls[-1] and ls[-1]>1.4*ls[-2]: sc-=.10   # la correcta destaca por larga
    if len(s)<60 and L<240 and not FACT.search(s): sc-=.08
    return sc
def levels(qs):
    out={}
    by={}
    for q in qs: by.setdefault(q['k'][:2],[]).append(q)
    for b,arr in by.items():
        sc=sorted(score(q) for q in arr)
        t1=sc[int(len(sc)*Q1)];t2=sc[int(len(sc)*Q2)]
        for q in arr:
            v=score(q);out[q['id']]=1 if v<t1 else (3 if v>=t2 else 2)
    return out
if __name__=='__main__':
    d=json.load(open(P,encoding='utf-8'))
    lv=levels(d)
    for q in d: q['df']=lv[q['id']]
    if '--stats' in sys.argv:
        import collections
        print(collections.Counter(lv.values()))
        for b in 'b1','b2','b3','b4':
            print(b,collections.Counter(q['df'] for q in d if q['k'].startswith(b)))
        print('x (EXAMEN):',collections.Counter(q['df'] for q in d if q['x']))
    else:
        open(P,'w',encoding='utf-8').write(json.dumps(d,ensure_ascii=False,separators=(',',':')))
        print('ok',len(d))
