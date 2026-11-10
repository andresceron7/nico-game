/* =========================================================
   Ranking global con Firebase Firestore (sin autenticación)
   ---------------------------------------------------------
   Colección "rankings". Cada documento:
     nombre   texto (sin espacios al inicio/final, máx. 20)
     puntaje  número entero
     fecha    serverTimestamp()
     goles    número entero   (para desempatar y mostrar)
     tiros    número entero   (para desempatar)
     tarjeta  'roja' o null   (para la tarjetita roja de las listas)

   - Si una partida no se puede subir (sin señal), queda en cola en
     el celular y se sube sola cuando vuelva la conexión.
   - Si Firebase no está configurado, funciona con ranking local.

   Interfaz que usa game.js:
     Ranking.submit({ name, points, goals, shots, card }) -> Promise<string>  (id de la partida guardada)
     Ranking.all()  -> Promise<Array<{id, name, points, goals, shots, card, date}>>  (todas, ordenadas)
                       Lanza un error si no se pudo cargar desde Firebase.
     Ranking.isGlobal -> true si está conectado a Firebase

   Orden: más puntos > más goles > menos tiros > el más antiguo.
   ========================================================= */
const Ranking = (() => {
  'use strict';
  const COLLECTION = 'rankings';
  const LOCAL_KEY = 'nico9.ranking.v2';
  const PENDING_KEY = 'nico9.pending.v2';
  const TIMEOUT_MS = 8000;

  const order = (a, b) =>
    (b.points || 0) - (a.points || 0) || (b.goals || 0) - (a.goals || 0) ||
    (a.shots || 0) - (b.shots || 0) || a.date - b.date;

  const cleanName = (n) => String(n || '').trim().replace(/\s+/g, ' ').slice(0, 20).trim();
  const newId = () => 'local-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  // ---------- Almacenamiento local ----------
  function read(key) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }
  function write(key, list) {
    try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) { /* sin storage */ }
  }

  // ---------- Firebase ----------
  let db = null;
  try {
    const cfg = window.FIREBASE_CONFIG;
    if (cfg && cfg.apiKey && cfg.projectId && window.firebase) {
      const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg);
      db = app.firestore();
    }
  } catch (e) {
    console.warn('[ranking] Firebase no disponible, uso ranking local.', e);
    db = null;
  }
  const col = () => db.collection(COLLECTION);

  const withTimeout = (p) => Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), TIMEOUT_MS)),
  ]);

  async function upload(e) {
    const ref = await withTimeout(col().add({
      nombre: e.name,
      puntaje: e.points,
      goles: e.goals,
      tiros: e.shots,
      tarjeta: e.card === 'red' ? 'roja' : null,
      fecha: firebase.firestore.FieldValue.serverTimestamp(),
    }));
    return ref.id;
  }

  // Sube las partidas que quedaron en cola por falta de señal
  let flushing = null;
  function flushPending() {
    if (!db) return Promise.resolve();
    if (flushing) return flushing;
    flushing = (async () => {
      const left = [];
      for (const e of read(PENDING_KEY)) {
        try { await upload(e); } catch (err) { left.push(e); }
      }
      write(PENDING_KEY, left);
    })().finally(() => { flushing = null; });
    return flushing;
  }

  async function fetchRemote() {
    const snap = await withTimeout(col().orderBy('puntaje', 'desc').get());
    return snap.docs.map((d) => {
      const x = d.data();
      return {
        id: d.id,
        name: String(x.nombre || ''),
        points: x.puntaje || 0,
        goals: x.goles || 0,
        shots: x.tiros || 0,
        card: x.tarjeta === 'roja' ? 'red' : null,
        date: x.fecha && x.fecha.toMillis ? x.fecha.toMillis() : Date.now(),
      };
    });
  }

  async function all() {
    if (!db) return read(LOCAL_KEY).sort(order);
    await flushPending();
    const remote = await fetchRemote();         // si falla, lanza el error (la pantalla muestra "reintentar")
    const pending = read(PENDING_KEY);          // partidas en cola: también se muestran
    return remote.concat(pending).sort(order);
  }

  async function submit({ name, points, goals, shots, card = null }) {
    const entry = {
      id: newId(), name: cleanName(name) || 'JUGADOR',
      points: Math.max(0, Math.round(points)), goals, shots,
      card: card === 'red' ? 'red' : null, date: Date.now(),
    };
    // Respaldo local siempre
    const local = read(LOCAL_KEY);
    local.push(entry);
    write(LOCAL_KEY, local.slice(-2000));

    if (!db) return entry.id;
    try {
      return await upload(entry);
    } catch (e) {
      console.warn('[ranking] No se pudo guardar en Firebase; queda en cola.', e);
      const pending = read(PENDING_KEY);
      pending.push(entry);
      write(PENDING_KEY, pending);
      return entry.id;
    }
  }

  window.addEventListener('online', () => { flushPending(); });
  if (db) setTimeout(flushPending, 1500);

  return {
    get isGlobal() { return !!db; },
    submit,
    all,
    async top(n = 5) { return (await all()).slice(0, n); },
    order,
  };
})();
