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
| **Inicio** | Título, invitación al cumpleaños, Nico explicando el juego (texto letra por letra), reglas visuales (hat-trick, amarilla, roja), campo de nombre, botón **VER RANKING** y crédito "Creado por: Mi tío Pipe". |
| **Juego** | Marcador (tiempo, goles, puntos, sonido), estadio pixel art, arco con 5 zonas, Nico moviéndose, flecha de apuntado y botones ◀ ▶ PATEAR. |
| **Final** | Resultado, Nico emocionado diciendo una frase según el desempeño, estadísticas (puntos, goles, tiros, puntería) y **todos** los puntajes del ranking. Si es récord, Nico salta y dice *"¡SIIIUUUUUU! ¡Rompiste el récord!"*. |
| **Popup "Ver ranking"** | Desde el inicio: lista completa de puntajes con fecha (no disponible mientras se juega). |
| **Foto con el tío Pipe** | Al tocar "Creado por: Mi tío Pipe": marco de foto pixel animado (7 s en loop) con Nico y su tío: se dan la mano, saltan, celebran *"SIIUUUU"* estilo CR7, se ríen y posan abrazados. |
| **Premiación** | Solo el 21 de noviembre de 2026, de 4:00 pm a 9:00 pm (ver abajo). |

---

## Reglas del juego

### El arquero

- El arco tiene **5 zonas**. Nico ocupa una y se mueve de a una zona por paso, de lado a lado, rebotando en los palos.
- **Cada gol lo hace más rápido:** tiempo entre pasos = `850 ms × 0,87^goles` (mínimo 170 ms). No se le avisa al jugador.
- **Sorpresas:** desde el 3er gol, en cada paso puede cambiar de dirección (7 % por gol, máximo 30 %).
- **Últimos 15 segundos:** un paso cada **100 ms** (10 zonas por segundo), sin aviso.
- **Segundo Nico:** si a las **0:15** el jugador tiene **70 puntos o más**, aparece un segundo Nico idéntico, sin aviso (se revisa solo en ese instante; si llega a 70 después, no aparece). Los dos se mueven a la vez y **nunca comparten zona ni se atraviesan**: si van a chocar, rebotan entre sí (y si no hay espacio, se quedan quietos ese paso). Si cualquiera de los dos está en la zona del balón, es atajada.
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
- El puntaje nunca baja de 0.

### Eventos

- **Hat-trick:** el tiempo se detiene, Nico aparece sorprendido diciendo *"¡Qué crack! ¡Hat-trick!"* y el juego sigue al presionar **CONTINUAR**.
- **Tarjeta amarilla:** el tiempo se detiene, entra un árbitro corriendo con la tarjeta y dice *"¡Pilas! Te taparon 2 seguidas"*; sale y hay una cuenta regresiva de 3 s.
- **Tarjeta roja:** entra el árbitro con la roja (*"Acumulaste tarjetas, ¡fin del juego!"*) mientras Nico celebra con una barrida de rodillas. **CONTINUAR** lleva al ranking, donde Nico hace malabares diciendo *"Soy Nico Pro, ¡el mejor arquero!"*.
- Tras una atajada se avisa: *"¡Ojo! Otra atajada y hay tarjeta"*.

---

## Premiación del 21 de noviembre

Del **21 de noviembre de 2026, 4:00 pm** al **9:00 pm** (hora Colombia, UTC−5) no se puede jugar. Quien entre a la página ve:

1. **Podio** con los 3 mejores puntajes (1º al centro, 2º izquierda, 3º derecha) y sus siluetas.
2. Botón **VER GANADORES**: los 3 aparecen con uniforme de fútbol (rojo, azul y verde), celebrando entre confeti.
   - **Niño o niña** según el nombre (lista de nombres comunes en español y, si no está, termina en "a" = niña). Las niñas llevan pelo largo y moño.
   - Si un nombre **empieza por "Nico" o "Niko"** (Nico, Nico Pro, Nicolás, Niko) o es exactamente **"Nic"** o **"Nik"**, aparece el arquero Nico. *Nicole* o *Nicol* cuentan como niñas.
3. **Entrega del trofeo:** Nico entra caminando con el trofeo, se lo entrega al 1º y celebran juntos. Si Nico está en 2º o 3º, baja de su puesto, entrega el trofeo y vuelve. Si Nico gana, celebra en el 1º con el trofeo.
4. Debajo, la **lista de todos los puntajes** con scroll (el podio siempre visible).

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
- **Fechas** en formato colombiano `dd/mm/aaaa`.
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
js/audio.js             Sonidos 8-bit generados con Web Audio (sin archivos)
js/ranking.js           Ranking global en Firestore + cola sin conexión
js/game.js              Lógica: pantallas, juego, eventos, final, premiación, foto, popups
firestore.rules         Reglas de seguridad de Firestore
docs/HISTORIAL.md       Historial del desarrollo
```

- **Sin build ni dependencias:** HTML, CSS y JavaScript plano. Firebase se carga desde su CDN oficial (SDK v10, versión *compat*).
- **Todo el arte es código:** los personajes y el fondo se dibujan con rectángulos en `<canvas>`, sin imágenes.
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
| `FRENZY_MS` / `FRENZY_STEP` | `15000` / `100` | Últimos segundos súper rápidos |
| `TWO_KEEPERS_MIN_POINTS` | `70` | Puntos a las 0:15 para que aparezca el segundo Nico |
| `HATTRICK_BONUS` / `YELLOW_PENALTY` / `RED_PENALTY` | `3` / `2` / `3` | Bonos y castigos |
| `AWARDS_START` | 21 nov 2026, 21:00 UTC | Inicio de la premiación (dura 5 h) |

---

## Mantenimiento

- **Borrar un puntaje** (de prueba o con un nombre inapropiado): consola de Firebase → Firestore Database → `rankings` → documento → ⋮ → **Eliminar documento**.
- **Antes del cumpleaños:** borrar los puntajes de prueba para empezar el ranking en limpio.

---

Creado por **Mi tío Pipe** con ❤️ para Nico.
