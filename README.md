# Penales con Nico ⚽

Juego web en **pixel art** para el cumpleaños número 9 de Nico.

🎮 **Jugar:** https://andresceron7.github.io/nico-game/

El jugador tiene **90 segundos** para meterle la mayor cantidad de goles a Nico, el arquero del número 9, y su puntaje entra a un **ranking global** compartido por todos los invitados.

El **21 de noviembre de 2026 a las 4:00 pm (hora Colombia)** el juego se cierra durante 5 horas y la página muestra la **premiación**: un podio animado con los 3 mejores y la lista de todos los puntajes.

> Historial completo del desarrollo: [`docs/HISTORIAL.md`](docs/HISTORIAL.md)

---

## Contenido

- [Cómo se juega](#cómo-se-juega)
- [Pantallas](#pantallas)
- [Reglas del juego](#reglas-del-juego)
- [Música y sonido](#música-y-sonido)
- [Premiación del 21 de noviembre](#premiación-del-21-de-noviembre)
- [Ranking global con Firebase](#ranking-global-con-firebase)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Ejecutar en local](#ejecutar-en-local)
- [Publicar en GitHub Pages](#publicar-en-github-pages)
- [Ajustar el juego](#ajustar-el-juego)
- [Mantenimiento](#mantenimiento)

---

## Cómo se juega

1. Nico se presenta y explica el juego con diálogos estilo videojuego de los 90.
2. El jugador escribe su nombre (hasta 20 letras) y presiona **JUGAR CON NICO**.
3. Con las flechas **◀ ▶** apunta a una de las **5 zonas del arco** y presiona **PATEAR**.
4. Nico se mueve de lado a lado; si está en la zona donde llega el balón, **ataja**.
5. Al terminar, el puntaje se guarda automáticamente en el ranking global.

**Controles:** botones en pantalla (móvil y tablet) o teclado en computador: `←` `→` (o `A` `D`) para apuntar y `Espacio` / `Enter` / `↑` para patear.

La página es **responsive** (móvil vertical y horizontal, tablet y desktop) y funciona sin instalar nada.

---

## Pantallas

| Pantalla | Qué muestra |
|---|---|
| **Inicio** | Título, invitación al cumpleaños, Nico explicando el juego (texto letra por letra), reglas visuales (hat-trick, amarilla, roja), campo de nombre, botón **VER RANKING** con la **nota musical ♪** a su derecha y crédito "Creado por: Mi tío Pipe". |
| **Juego** | Marcador (tiempo, goles, puntos, botón de **efectos** 🔊 y botón de **música** ♪), estadio pixel art, arco con 5 zonas, Nico moviéndose, flecha de apuntado y botones ◀ ▶ PATEAR. |
| **Final** | Resultado, Nico emocionado diciendo una frase según el desempeño, estadísticas (puntos, goles, tiros, puntería), botón **VER RANKING** de lado a lado y botones JUGAR OTRA VEZ, CAMBIAR JUGADOR y ♪. Si es récord, Nico salta y dice *"¡SIIIUUUUUU! ¡Rompiste el récord!"*. |
| **Popup "Ver ranking"** | Desde el inicio, la pantalla final o la premiación (nunca mientras se juega): lista completa de puntajes con scroll propio; cada fila muestra posición, nombre, goles y, al final, los puntos. Desde la pantalla final resalta en amarillo la partida recién jugada; desde la premiación, los 3 del podio. Tiene su propia nota musical ♪. |
| **Foto con el tío Pipe** | Al tocar "Creado por: Mi tío Pipe": marco de foto pixel animado (7 s en loop) con Nico y su tío: se dan la mano, saltan, celebran *"SIIUUUU"* estilo CR7, se ríen y posan abrazados. |
| **Premiación** | Solo el 21 de noviembre de 2026, de 4:00 pm a 9:00 pm (ver abajo). |

---

## Reglas del juego

### El arquero

- El arco tiene **5 zonas**. Nico ocupa una y se mueve de a una zona por paso, de lado a lado, rebotando en los palos.
- **Cada gol lo hace más rápido:** tiempo entre pasos = `850 ms × 0,87^goles` (mínimo 170 ms). No se le avisa al jugador.
- **Sorpresas:** desde el 3er gol, en cada paso puede cambiar de dirección (7 % por gol, máximo 30 %).
- **Últimos 20 segundos:** un paso cada **100 ms** (10 zonas por segundo), sin aviso.
- **Segundo Nico:** si a las **0:20** el jugador tiene **70 puntos o más**, aparece un segundo Nico idéntico, sin aviso (se revisa solo en ese instante; si llega a 70 después, no aparece). **Cada uno se mueve a su manera:** su propio ritmo (±30 % alrededor de un paso cada 100 ms) y sus propios cambios de dirección (al menos 20 % por paso), así que nunca se mueven en espejo. Pueden coincidir en la misma zona. Si cualquiera de los dos está en la zona del balón, es atajada.
- **Al final del partido** (por tiempo o por roja) el segundo Nico se va saltando y queda uno solo.
- El balón tarda siempre **650 ms** en llegar. **Nico ataja si está en la zona apuntada en el momento en que llega el balón.**

### Puntos

| Situación | Puntos |
|---|---|
| Gol en la zona **al lado** de Nico | **+3** |
| Gol a **dos zonas** de Nico | **+2** |
| Gol **más lejos** | **+1** |
| **Hat-trick** (3 goles seguidos) | **+3** extra |
| **Tarjeta amarilla** (2 atajadas seguidas) | **−2** |
| **Tarjeta roja** (segunda tarjeta) | **−3** y fin del juego |

- La distancia se mide con la posición de Nico **cuando llega el balón** (con dos Nicos, contra el más cercano).
- **x2 con dos Nicos:** mientras el segundo Nico está en la cancha, los goles (6 / 4 / 2) y el bono de hat-trick (+6) valen el doble; el mensaje de gol lo indica ("+6 PUNTOS · x2"). Los castigos de tarjetas no se duplican.
- El puntaje nunca baja de 0.

### 🤓 Dato curioso: el puntaje máximo posible

Con estas reglas, el máximo teórico en los 90 segundos es **255 puntos** (52 goles sin tarjetas).

- El reloj corre durante el apuntado, el vuelo del balón (0,65 s) y la pausa de GOL (1,1 s), así que cada tiro gasta **como mínimo 1,75 s**. La pausa del hat-trick detiene el reloj, y un tiro pateado antes de 0:00 cuenta aunque el balón llegue después. En total caben **52 tiros**.
- **Primeros 70 s:** 40 goles × 3 = 120, más 13 hat-tricks × 3 = 39 → **159** (más de 70, así que aparece el segundo Nico).
- **Últimos 20 s (x2):** 12 goles × 6 = 72, más 4 hat-tricks × 6 = 24 → **96**.
- **Total: 159 + 96 = 255.**

Para lograrlo habría que patear sin ningún tiempo de reacción, meter todos los goles pegaditos a Nico y no fallar ni uno, incluso cuando Nico da un paso cada 0,1 s. Es prácticamente imposible: con el tiempo de reacción de una persona (unos 0,3 s por tiro) caben unos 44 tiros, y muchos goles valen 1 o 2 puntos.

### Eventos

- **Hat-trick:** el tiempo se detiene, Nico aparece sorprendido diciendo *"¡Qué crack! ¡Hat-trick!"* y el juego sigue al presionar **CONTINUAR**.
- **Tarjeta amarilla:** el tiempo se detiene, entra un árbitro corriendo con la tarjeta y dice *"¡Pilas! Te taparon 2 seguidas"*; sale y hay una cuenta regresiva de 3 s.
- **Tarjeta roja:** entra el árbitro con la roja (*"Acumulaste tarjetas, ¡fin del juego!"*) mientras Nico celebra con una barrida de rodillas. **CONTINUAR** lleva al ranking, donde Nico hace malabares diciendo *"Soy Nico Pro, ¡el mejor arquero!"*.
- Tras una atajada se avisa: *"¡Ojo! Otra atajada y hay tarjeta"*.

---

## Música y sonido

Hay dos sonidos independientes, cada uno con su botón, así que se puede tener **solo efectos, solo música, ambos o ninguno**:

- **Efectos** (botón 🔊, solo en el juego): sonidos 8-bit generados con código (gol, atajada, pito, celebración…).
- **Música** (botón ♪): canciones en [`songs/`](songs). Apagada = nota gris y tachada.

| Dónde | Canción | Volumen |
|---|---|---|
| Inicio (y su popup de ranking) | `game-song.mp3`, en loop | normal |
| Partido | `match-song.mp3`, en loop, empieza desde el inicio | moderado, para que se oigan los efectos |
| Pantalla final | `podium-song.mp3`, en loop | medio |
| Premiación | `winner-song.mp3`, **una sola vez** al tocar VER GANADORES (VER DE NUEVO la repite) | medio-alto |

- **Foto con el tío Pipe:** mientras está abierta, la música baja a la mitad y al cerrarla vuelve a su volumen.
- **Arranque:** los navegadores no dejan sonar nada hasta que el usuario toca la página, así que la música empieza con el primer toque o tecla.
- Si el usuario apaga la música (o los efectos), el navegador lo recuerda para la próxima visita.
- Con la pestaña oculta o el celular bloqueado, la música se pausa y sigue al volver.
- El volumen se controla con Web Audio, así que también funciona en iPhone. Abriendo `index.html` con doble clic (sin servidor) la música suena, pero sin el control fino de volumen.

---

## Premiación del 21 de noviembre

Del **21 de noviembre de 2026, 4:00 pm** al **9:00 pm** (hora Colombia, UTC−5) no se puede jugar. Quien entre a la página ve:

1. **Podio vacío** (1º al centro, 2º izquierda, 3º derecha), solo con los puestos: los nombres son sorpresa.
2. Botón **VER GANADORES** (con la nota musical ♪ a su derecha): suena `winner-song.mp3` y los ganadores suben **uno por uno, primero el 3º, luego el 2º y por último el 1º**. Cada uno entra caminando desde fuera de la pantalla por la derecha y salta a su puesto; su nombre y puntaje aparecen cuando llega.
   - Llevan uniforme de fútbol (rojo, azul y verde).
   - **Niño o niña** según el nombre (lista de nombres comunes en español y, si no está, termina en "a" = niña). Las niñas llevan pelo largo y moño.
   - Si un nombre **empieza por "Nico" o "Niko"** (Nico, Nico Pro, Nicolás, Niko) o es exactamente **"Nic"** o **"Nik"**, aparece el arquero Nico. *Nicole* o *Nicol* cuentan como niñas.
3. Cuando llega el 1º: **confeti** y sonido de celebración.
4. **Entrega del trofeo:**
   - Nico **no está en el podio:** entra caminando con el trofeo, se lo entrega al 1º y celebran juntos.
   - Nico está **2º o 3º:** baja de su puesto, entrega el trofeo, celebran y vuelve a su lugar.
   - Nico es el **1º:** entra el **tío Pipe** (el mismo de la foto "Creado por: Mi tío Pipe") con el trofeo, se lo entrega a Nico y celebran juntos.
5. **VER DE NUEVO** repite toda la animación (y la canción).
6. Debajo, el botón **VER RANKING** abre el popup con todos los puntajes.

En el podio cada nombre aparece una sola vez con su mejor puntaje (los nombres se comparan tal cual: "ANDRES" y "ANDREZ" son personas distintas). Si alguien está jugando a las 4:00 pm, termina su partida y su puntaje cuenta. A las 9:00 pm la página vuelve sola al juego.

---

## Ranking global con Firebase

Los puntajes se guardan en **Cloud Firestore** (proyecto `nico-game`), sin autenticación.

**Colección `rankings`:**

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | texto | 1 a 20 caracteres, sin espacios al inicio ni al final |
| `puntaje` | entero | puntos de la partida |
| `fecha` | timestamp | `serverTimestamp()` |
| `goles` | entero | para desempatar y mostrar |
| `tiros` | entero | para desempatar |
| `tarjeta` | `null`, `'amarilla'` o `'roja'` | `null` = terminó sin tarjetas → 🥈 medalla de plata; `'roja'` → tarjetita roja |

- **Orden:** más puntos → más goles → menos tiros → el más antiguo.
- **Medalla de plata** 🥈 junto al nombre (en las listas y en el podio) si la partida terminó **sin ninguna tarjeta**; la **tarjetita roja** si terminó expulsado.
- **Estados en pantalla:** "Cargando ranking…", "No se pudo cargar el ranking, intenta de nuevo" (con botón REINTENTAR) y "Aún no hay puntajes, ¡sé el primero!".
- **Sin internet:** la partida queda en cola en el navegador y se sube sola cuando vuelve la conexión.
- **Seguridad:** [`firestore.rules`](firestore.rules) permite leer a todos y crear solo puntajes con el formato correcto; nadie puede modificar ni borrar desde la página. La configuración de [`js/firebase-config.js`](js/firebase-config.js) no es secreta: Firebase está diseñado para que vaya en la página.

> Las reglas se publican a mano en la consola de Firebase (**Firestore Database → Reglas → Publicar**) copiando el contenido de `firestore.rules`.

---

## Estructura del proyecto

```
index.html              Todas las pantallas (inicio, juego, final, premiación, popups)
css/style.css           Estilos pixel art y responsive
js/firebase-config.js   Configuración del proyecto de Firebase
js/names.js             ¿Es Nico? ¿Niño o niña? (a partir del nombre)
js/sprites.js           Pixel art dibujado con código: Nico, tío Pipe, árbitro, ganadores, balón, trofeo, fondo
js/audio.js             Efectos 8-bit generados con Web Audio (sin archivos)
js/music.js             Música de fondo: qué canción suena, volumen, loop y botón ♪
songs/                  Canciones en MP3 (intro, partido, ranking y premiación)
js/ranking.js           Ranking global en Firestore + cola sin conexión
js/game.js              Lógica: pantallas, juego, eventos, final, premiación, foto, popups
firestore.rules         Reglas de seguridad de Firestore
docs/HISTORIAL.md       Historial del desarrollo
```

- **Sin build ni dependencias:** HTML, CSS y JavaScript plano. Firebase se carga desde su CDN oficial (SDK v10, versión *compat*).
- **Todo el arte es código:** los personajes y el fondo se dibujan con rectángulos en `<canvas>`, sin imágenes. Los únicos archivos de medios son las canciones de `songs/`.
- **Fuentes:** Press Start 2P (pixel), Bangers (globos de cómic) y Montserrat (crédito), desde Google Fonts.

---

## Ejecutar en local

Abre `index.html` con doble clic, o usa un servidor local:

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000
```

### Demo de la premiación (no se publica)

`demo-podio.html` simula el 21 de noviembre a las 4:00 pm con 64 resultados aleatorios para ver el podio antes de tiempo. **No está en el repositorio** (está en `.gitignore`) para que nadie vea un podio inventado; solo existe en el computador de desarrollo. Opcional: `demo-podio.html?nico=1` (o `2`, `3`) pone a "NICO PRO" en ese puesto.

---

## Publicar en GitHub Pages

1. En el repositorio: **Settings → Pages**.
2. En **Build and deployment → Source** elige **Deploy from a branch**.
3. **Branch:** `main` y carpeta **`/ (root)`** → **Save**.
4. En 1–2 minutos la página queda en **https://andresceron7.github.io/nico-game/**.

Cada `git push` a `main` actualiza la página automáticamente.

---

## Ajustar el juego

Los valores principales están al inicio de [`js/game.js`](js/game.js):

| Constante | Valor | Qué controla |
|---|---|---|
| `GAME_MS` | `90000` | Duración del partido (ms) |
| `FLIGHT_MS` | `650` | Lo que tarda el balón en llegar |
| `BASE_STEP` / `SPEEDUP` / `MIN_STEP` | `850` / `0.87` / `170` | Velocidad de Nico según los goles |
| `FRENZY_MS` / `FRENZY_STEP` | `20000` / `100` | Últimos segundos súper rápidos |
| `TWO_KEEPERS_MIN_POINTS` | `70` | Puntos a las 0:20 para que aparezca el segundo Nico |
| `TWO_KEEPERS_JITTER` / `TWO_KEEPERS_MIN_REVERSE` | `0.3` / `0.2` | Con dos Nicos: variación de ritmo y cambios de dirección de cada uno |
| `TWO_KEEPERS_MULT` | `2` | Multiplicador de puntos con dos Nicos en la cancha |
| `HATTRICK_BONUS` / `YELLOW_PENALTY` / `RED_PENALTY` | `3` / `2` / `3` | Bonos y castigos |
| `AWARDS_START` | 21 nov 2026, 21:00 UTC | Inicio de la premiación (dura 5 h) |

La música se ajusta al inicio de [`js/music.js`](js/music.js):

| Constante | Valor | Qué controla |
|---|---|---|
| `TRACKS` | rutas en `songs/` | Qué archivo es cada canción |
| `VOL` | intro `0.5` · partido `0.35` · ranking `0.32` · premiación `0.42` | Volumen de cada momento (`match-song` viene grabada más bajita, por eso su número es mayor) |
| `DUCK` | `0.5` | Cuánto baja la música con la foto del tío Pipe |
| `NO_LOOP` | `winner` | Canciones que suenan una sola vez |

---

## Mantenimiento

- **Borrar un puntaje** (de prueba o con un nombre inapropiado): consola de Firebase → Firestore Database → `rankings` → documento → ⋮ → **Eliminar documento**.
- **Antes del cumpleaños:** borrar los puntajes de prueba para empezar el ranking en limpio.

---

Creado por **Mi tío Pipe** con ❤️ para Nico.
