# Historial del desarrollo

Registro de cómo se construyó **Penales con Nico**, paso a paso, en el orden en que se fue pidiendo. Todo se hizo el 9 de noviembre de 2026.

---

## 1. Primera versión del juego

**Pedido:** una página con un juego de penales en pixel art. Nico, un niño de 9 años con uniforme blanco de arquero, "NICO" y el "9" en la camiseta, ataja en un arco de 5 sectores; el jugador apunta con flechas y patea; 1 minuto de juego; nombre antes de jugar; pantalla de inicio con Nico explicando el juego en diálogos estilo años 90 y botón **"Jugar con Nico"**; responsive.

**Decisiones (preguntadas antes de programar):**
- **Atajada:** el balón tarda siempre lo mismo (650 ms). Nico ataja si está en el sector apuntado **cuando llega el balón**. Así, cuanto más rápido se mueve, más difícil es predecirlo.
- **Movimiento:** ida y vuelta por los 5 sectores, con cambios de dirección sorpresa desde cierto nivel.
- **Flujo:** intro → nombre → juego → pantalla final.
- **Extras:** sonidos 8-bit, controles de teclado, pantalla final con récord. El ranking quedó preparado para conectarse después a Firebase. Publicación en GitHub Pages.

**Resultado:**
- Nico dibujado en pixel art con código, basado en una imagen de referencia: pelo castaño, uniforme blanco, guantes y medias con "NICO".
- Estadio con hinchada animada y vallas LED que dicen "NICO 9".
- Flecha de apuntado, cuenta regresiva, mensajes de "¡GOOOL!" y "¡ATAJÓ NICO!", récord local y diseño responsive.

## 2. Ajustes de interfaz

- El fondo azul se cambió por **verde de cancha**, con un **patrón pixel** de balones, guayos, guantes, pitos y tarjetas.
- **Padding de 40 px** arriba y abajo.
- Al final del partido Nico ya no aparece triste, sino **emocionado**.
- **Récord:** Nico celebra con los brazos arriba y saltando, con un globo de cómic que dice *"¡SIIIUUUUUU! ¡Rompiste el récord!"*.

## 3. Puntos, hat-trick y tarjetas

- **Puntos por distancia** a Nico: al lado 3, a dos sectores 2, más lejos 1.
- **Hat-trick** (3 goles seguidos, +3): el tiempo se detiene y Nico aparece sorprendido diciendo *"¡Qué crack! ¡Hat-trick!"*, con el botón **CONTINUAR**.
- **Tarjeta amarilla** (2 atajadas seguidas, −2): el tiempo se detiene, entra un **árbitro** pixel art corriendo de izquierda a derecha, muestra la tarjeta y dice *"¡Pilas! Te taparon 2 seguidas"*. Luego hay una cuenta regresiva de 3 s.
- **Tarjeta roja** (segunda tarjeta, −3): el árbitro saca la roja (*"Acumulaste tarjetas, ¡fin del juego!"*) mientras Nico celebra al fondo con una **barrida de rodillas**. CONTINUAR lleva al ranking, donde Nico hace malabares con el balón y dice *"Soy Nico Pro, ¡el mejor arquero!"*.
- Decisiones: el puntaje nunca baja de 0 y el ranking se ordena por puntos y después por goles.

## 4. Intro más corta y reglas visuales

- Se quitaron de los diálogos las explicaciones de puntos. En su lugar quedaron **tarjetas visuales** sobre el cuadro de diálogo: hat-trick +3, 2 atajadas seguidas −2 y roja = fin −3. En móvil van en una sola línea.
- Se agregó el texto **"Te espero en mi cumpleaños para jugar de verdad"** bajo el título.

## 5. Crédito y foto con el tío Pipe

- Footer siempre visible con **"Creado por: Mi tío Pipe"** (Montserrat, como link).
- Al tocarlo se abre un **marco de foto pixel** con una animación de 7 s en loop:
  1. Nico y el tío Pipe, un adulto parecido a Nico con pelo más corto, camisa azul clara, jean y botas cafés, se dan la mano una vez.
  2. Saltan, sin girar, y caen con la celebración de CR7 mientras aparece **"SIIUUUU"**.
  3. Se ríen.
  4. Posan abrazados para la foto, con flash de cámara. El brazo del tío va por detrás de Nico y su mano hace la señal de amor y paz ✌.
- Se cierra con una **X**. Si se abre durante el partido, el juego se pausa.

## 6. Premiación del 21 de noviembre

**Pedido:** el 21 de noviembre de 2026 a las 4:00 pm (hora Colombia) el juego se pausa por 5 horas y solo se muestra un podio con los 3 mejores y un botón **"Ver ganadores"**.

**Decisiones:**
- Cada nombre (escrito exactamente igual) aparece una sola vez en el podio, con su mejor puntaje.
- **Nico** se reconoce si el nombre empieza por "Nico" o "Niko", o si es exactamente "Nic" o "Nik". Nicole y Nicol quedan como niñas.
- Si Nico está en 2º o 3º, baja de su puesto y entrega el trofeo.

**Resultado:**
- Podio con siluetas misteriosas.
- Al presionar "Ver ganadores", aparecen los ganadores vestidos de futbolistas (niño o niña según el nombre) celebrando entre confeti.
- Nico entrega el trofeo al 1º y celebran juntos.
- Debajo, la lista de todos los puntajes con scroll; el podio siempre queda visible.
- A las 9:00 pm la página vuelve sola al juego.
- El demo de prueba se separó en `demo-podio.html`. Ese archivo no se publica, y el juego no tiene código de demo.

## 7. Más tiempo y más dificultad

- El partido pasó de 60 a **90 segundos**.
- **Últimos 15 segundos:** Nico se mueve un sector cada **0,1 s** (10 por segundo), sin aviso.
- Se quitaron **todos los avisos de nivel**: la caja NIVEL del marcador y el "NIVEL N" al meter gol. Nico se acelera en silencio.

## 8. Ranking global con Firebase

- Conexión a **Cloud Firestore** (proyecto `nico-game`), sin autenticación, cargando el SDK desde el CDN de Firebase.
- **Colección `rankings`:** `nombre` (máx. 20, sin espacios al inicio ni al final), `puntaje` (entero) y `fecha` (`serverTimestamp()`), más `goles`, `tiros` y `tarjeta` para desempates y la tarjetita roja.
- **Guardado automático** al terminar la partida, con el nombre escrito al inicio.
- Se muestran **todos** los puntajes, con fecha `dd/mm/aaaa`, y estados de carga, error con reintentar y vacío.
- **Cola sin conexión:** si no hay internet, la partida se guarda en el navegador y se sube después.
- **Reglas de seguridad** (`firestore.rules`): lectura pública, creación solo con formato válido, sin edición ni borrado. Se publicaron y se verificó un guardado real.

## 9. Popup "Ver ranking"

- Botón **VER RANKING** en el footer del inicio, con el mismo estilo y altura que "SALTAR". No está disponible mientras se juega.
- Abre un popup alto con la lista completa de puntajes, con el mismo diseño del ranking final. Se cierra con una **X** o con Esc.

## 10. Publicación

- Documentación (`README.md` y este historial), `.gitignore` y repositorio público **nico-game** en GitHub, publicado con **GitHub Pages**.

## 11. Dos arqueros en los últimos 15 segundos

- Al entrar en los últimos 15 segundos aparece **un segundo Nico idéntico**, sin aviso, **solo si el jugador tiene 70 puntos o más a las 0:15**. Esa condición se revisa una sola vez, en ese instante; con menos puntos solo aumenta la velocidad. Entra en el siguiente momento de apuntar, nunca con el balón en el aire, por el extremo opuesto del arco.
- Los dos se mueven a 10 sectores por segundo, dando el paso al mismo tiempo. **Nunca comparten sector ni se atraviesan**: si van a chocar, rebotan entre sí, y si no hay espacio se quedan quietos ese paso. Se verificó con una simulación de 1 millón de pasos, con 0 choques.
- Es atajada si cualquiera de los dos está en el sector del balón. Los puntos por cercanía se miden contra el Nico más cercano.

## 12. Medalla de plata por juego limpio

- Si el jugador termina la partida **sin ninguna tarjeta** (ni amarilla ni roja), aparece una **medalla de plata** pixel junto a su nombre en todas las listas (ranking final, "Ver ranking", premiación) y en el **podio**. Los expulsados siguen con la tarjetita roja.
- En Firebase, el campo `tarjeta` ahora acepta `null` (sin tarjetas), `'amarilla'` o `'roja'`. Por eso se actualizaron las reglas (`firestore.rules`), y se publicaron **antes** que el código.

---

### Cómo se verificó

Cada cambio se probó en Chrome, en desktop, en celular vertical (375 px) y en celular horizontal:
- **Partidas reales y forzadas:** goles, atajadas, hat-trick, amarilla, roja y fin del tiempo.
- **Medición de la velocidad del arquero:** 10 pasos por segundo en los últimos 15 s.
- **Detección de nombres:** pruebas automáticas con Node.
- **Guardado y lectura reales en Firestore.**
