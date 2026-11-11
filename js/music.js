/* =========================================================
   Música de fondo (independiente de los efectos de sonido).

     Music.play(track, level, restart)
       track:   'game' (intro) | 'match' (partido) | 'podium' (ranking)
                | 'winner' (premiación: suena UNA vez, sin loop)
       level:   'intro' | 'match' | 'podium' | 'winner'  (volumen, ver VOL)
       restart: true = empieza desde el inicio
     Music.duck(on)    true = baja la música a la mitad (foto con el tío Pipe)
     Music.stop()      sin música
     Music.toggle()    enciende / apaga (se recuerda en el navegador)
     Music.off         true si el usuario la apagó
     Music.unlock()    llamar en cada toque/tecla: los navegadores
                       no dejan sonar nada antes del primer gesto
   ========================================================= */
const Music = (() => {
  'use strict';
  const TRACKS = {
    game: 'songs/game-song.mp3',
    match: 'songs/match-song.mp3',
    podium: 'songs/podium-song.mp3',
    winner: 'songs/winner-song.mp3',
  };
  const NO_LOOP = { winner: true };
  // En el partido va moderada para que se oigan los goles, pitos y celebraciones
  // (match-song viene grabada unos 5 dB más bajita que las demás, por eso su número es mayor)
  const VOL = { intro: 0.5, match: 0.35, podium: 0.32, winner: 0.42 };
  const DUCK = 0.5;
  const FADE = 0.25; // s, cambio suave de volumen

  let off = false;
  try { off = localStorage.getItem('nico9.music') === '0'; } catch (e) { /* sin storage */ }

  // Con Web Audio el volumen funciona también en iPhone (allí audio.volume no se puede cambiar).
  // Abriendo el archivo con doble clic (file://) Web Audio deja la canción muda, así que se usa audio.volume.
  const useGraph = /^https?:$/.test(location.protocol) && !!(window.AudioContext || window.webkitAudioContext);
  let ac = null;
  const tracks = {};
  let scene = null; // { track, level }
  let ducked = false;

  function get(name) {
    if (!tracks[name]) {
      const a = new Audio(TRACKS[name]);
      a.loop = !NO_LOOP[name];
      a.preload = 'auto';
      a.setAttribute('playsinline', '');
      tracks[name] = { a, gain: null };
      connect(tracks[name]);
    }
    return tracks[name];
  }

  function connect(t) {
    if (!ac || t.gain) return;
    try {
      const src = ac.createMediaElementSource(t.a);
      t.gain = ac.createGain();
      t.gain.gain.value = t.a.volume;
      t.a.volume = 1;
      src.connect(t.gain);
      t.gain.connect(ac.destination);
    } catch (e) { t.gain = null; }
  }

  function setVol(t, v) {
    if (t.gain) t.gain.gain.setTargetAtTime(v, ac.currentTime, FADE / 3);
    else t.a.volume = v;
  }

  function sync() {
    Object.keys(tracks).forEach((name) => {
      const t = tracks[name];
      if (!scene || name !== scene.track || off || document.hidden) t.a.pause();
    });
    if (!scene || off || document.hidden) return;
    const t = get(scene.track);
    setVol(t, VOL[scene.level] * (ducked ? DUCK : 1));
    if (t.a.paused && !t.a.ended) {   // una canción sin loop que ya terminó no vuelve a sonar
      const p = t.a.play();
      if (p && p.catch) p.catch(() => { /* aún sin gesto del usuario: se reintenta en el próximo toque */ });
    }
  }

  function unlock() {
    if (useGraph && !ac) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        ac = new AC();
        Object.values(tracks).forEach(connect);
      } catch (e) { ac = null; }
    }
    if (ac && ac.state === 'suspended') ac.resume();
    sync();
  }

  function play(track, level, restart) {
    const t = get(track);
    if (restart) { try { t.a.currentTime = 0; } catch (e) { /* aún no cargó */ } }
    scene = { track, level };
    sync();
  }

  function stop() { scene = null; sync(); }

  function duck(on) { ducked = !!on; sync(); }

  function toggle() {
    off = !off;
    try { localStorage.setItem('nico9.music', off ? '0' : '1'); } catch (e) { /* */ }
    unlock();
    return off;
  }

  // Los navegadores solo dejan arrancar el audio dentro de un gesto del usuario
  ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach((ev) =>
    document.addEventListener(ev, unlock, { capture: true, passive: true }));
  // Pestaña oculta (o celular bloqueado): pausa; al volver, sigue
  document.addEventListener('visibilitychange', sync);

  return {
    play, stop, toggle, unlock, duck,
    get off() { return off; },
  };
})();
