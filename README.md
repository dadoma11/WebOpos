# Oposiciones TAI · Resúmenes

Web estática con los resúmenes del temario (43 temas), buscador, PDFs y prácticas interactivas.

- Editar ejercicios SQL oficiales: `data/sql.json` (esquema + ejercicios).
- Regenerar contenido: ver `buildsite.py` del flujo de trabajo.
- Publicar: Settings → Pages → Deploy from branch → `main` / root.

## Novedades
- **Login** (`login.html`, `auth.js`): cuentas y sesión en el navegador (PBKDF2). GitHub Pages es estático: no hay sesiones por IP ni servidor.
- **Examínate** (`examinate.html`, `examen.js`, `data/preguntas.json`): test aleatorio con las 2.150 preguntas de Anki, filtros por tema/EXAMEN/IMPORTANTE, temporizador y nota = aciertos − errores/3.
- **Laboratorio SQL** (`laboratorio.html`, `lab.js`): BD aleatorias, subida de .sqlite/.sql/.csv (solo en memoria), consola y test generado analizando la BD.

## Dificultad de las preguntas
Cada pregunta de `data/preguntas.json` lleva `df` (1 fácil, 2 media, 3 difícil), estimada por `tools/difficulty.py` a partir del texto (longitud, parecido entre opciones, datos exactos, negaciones, código). Hay que volver a ejecutarlo al añadir preguntas. `diff.js` reparte y entrelaza los niveles (modo Realista: 30/45/25 %).
