/* =========================================================
   PENALES CON NICO — lógica principal
   ========================================================= */
(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const S = Sprites;

  // ---------------- Configuración ----------------
  const GW = 240, GH = 210;           // resolución interna del juego
  const SW = 160, SH = 128;           // escenas de intro / final
  const GOAL = { x: 20, w: 200, top: 52, line: 120, post: 4 };
  const SECTORS = 5;
  const SECTOR_W = GOAL.w / SECTORS;  // 40px por sector
  const sectorX = (i) => GOAL.x + SECTOR_W * i + SECTOR_W / 2;
  const SPOT = { x: 120, y: 186 };

  const GAME_MS = 90000;   // 90 segundos
  const FLIGHT_MS = 650;   // lo que tarda el balón en llegar al arco (siempre igual)
  const RESULT_MS = 1100;  // pausa para mostrar GOL / ATAJADA
  const OVER_MS = 2200;

  // Dificultad: cada gol reduce el tiempo entre pasos del arquero
  const BASE_STEP = 850, MIN_STEP = 170, SPEEDUP = 0.87;
  const stepMs = (goals) => Math.max(MIN_STEP, Math.round(BASE_STEP * Math.pow(SPEEDUP, goals)));
  // Últimos 20 segundos: Nico a toda velocidad (un paso cada 0,1 s = 10 sectores por segundo)
  const FRENZY_MS = 20000, FRENZY_STEP = 100;
  // Segundo Nico: solo si a las 0:20 el jugador tiene al menos estos puntos
  const TWO_KEEPERS_MIN_POINTS = 70;
  // Con dos Nicos cada uno se mueve a su manera: su propio ritmo (±30 % alrededor del normal)
  // y sus propios cambios de dirección (al menos 20 % por paso), así nunca se mueven en espejo
  const TWO_KEEPERS_JITTER = 0.3, TWO_KEEPERS_MIN_REVERSE = 0.2;
  // Sorpresas: desde el 3er gol (nivel 4) a veces cambia de dirección
  const reverseChance = (goals) => goals < 3 ? 0 : Math.min(0.3, 0.07 * (goals - 2));

  // Puntos según la distancia entre el gol y Nico (cuando llega el balón)
  const pointsFor = (dist) => dist === 1 ? 3 : dist === 2 ? 2 : 1;
  const HATTRICK_BONUS = 3, YELLOW_PENALTY = 2, RED_PENALTY = 3;
  // Con dos Nicos en la cancha, los goles y el bono de hat-trick valen el doble (los castigos no)
  const TWO_KEEPERS_MULT = 2;

  // Tiempos de la escena del árbitro (ms)
  const REF_IN = 550, REF_OUT_AT = 2900, REF_OUT = 500;
  const SLIDE_MS = 900, RED_BUTTON_AT = 1500;
  const REF_X = 70;

  const FINE_POINTER = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  const INTRO_LINES = [
    '¡HOLA, CRACK! SOY NICO, EL ARQUERO NÚMERO 9.',
    'ESTOY CUMPLIENDO 9 AÑOS Y QUIERO CELEBRARLO... ¡ATAJANDO TUS PENALES!',
    'TIENES 90 SEGUNDOS PARA METER GOLES.',
    'MI ARCO TIENE 5 ZONAS. MUEVE LA FLECHA CON LOS BOTONES IZQUIERDA Y DERECHA PARA APUNTAR.' +
      (FINE_POINTER ? ' (TAMBIÉN SIRVEN LAS FLECHAS DEL TECLADO.)' : ''),
    'CUANDO ESTÉS LISTO PRESIONA PATEAR' + (FINE_POINTER ? ' O LA BARRA ESPACIADORA' : '') +
      '. PERO OJO: ¡YO ME SIGO MOVIENDO MIENTRAS VUELA EL BALÓN!',
    'CADA GOL QUE ME METAS ME HACE MÁS RÁPIDO... Y A VECES CAMBIO DE LADO PARA ENGAÑARTE. ¡JE, JE!',
    'AL FINAL CUENTAN TUS GOLES Y LOS PUNTOS QUE SUMES EN EL PARTIDO. ¡MIRA LAS REGLAS AQUÍ ARRIBA!',
    '¿ESTÁS LISTO? ESCRIBE TU NOMBRE Y... ¡A JUGAR!',
  ];
  const LAST_LINE = INTRO_LINES.length - 1;

  // ---------------- Utilidades ----------------
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function seeded(seed) {
    return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  }

  let now = 0; // reloj del juego (ms). Se pausa solo si la pestaña se oculta.

  // ---------------- Canvas ----------------
  function setupCanvas(sel, w, h) {
    const c = $(sel);
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    return { c, g, w, h };
  }
  const cvIntro = setupCanvas('#cv-intro', SW, SH);
  const cvGame = setupCanvas('#cv-game', GW, GH);
  const cvEnd = setupCanvas('#cv-end', SW, SH);

  // Escala el canvas para que quepa en su contenedor manteniendo proporción
  function fit(stage) {
    const box = stage.querySelector('.canvas-box');
    const c = box.querySelector('canvas');
    const r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const pad = 28; // espacio para el marco
    let s = Math.min((r.width - pad) / c.width, (r.height - pad) / c.height);
    if (s >= 2) s = Math.floor(s * 2) / 2;
    s = Math.max(0.5, s);
    box.style.width = Math.round(c.width * s) + 'px';
    box.style.height = Math.round(c.height * s) + 'px';
  }
  const stages = document.querySelectorAll('.stage');
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver((entries) => entries.forEach((e) => fit(e.target)));
    stages.forEach((s) => ro.observe(s));
  }
  window.addEventListener('resize', () => stages.forEach(fit));

  // ---------------- Escenario: estadio ----------------
  function makeCrowd(w, top, bottom, seed) {
    const rnd = seeded(seed);
    const skins = ['#f1c39c', '#d9a074', '#8d5a3b', '#f5d0b0', '#6b4128'];
    const shirts = ['#e63946', '#f4f4f0', '#3a86ff', '#ffd23f', '#2f9e44', '#f4f4f0', '#ff8fab', '#7b2cbf', '#f4f4f0', '#fb8500'];
    const people = [];
    for (let y = top; y < bottom - 3; y += 5) {
      for (let x = 1; x < w; x += 4) {
        if (rnd() < 0.12) continue;
        people.push({
          x: x + Math.floor(rnd() * 2), y,
          skin: skins[Math.floor(rnd() * skins.length)],
          shirt: shirts[Math.floor(rnd() * shirts.length)],
          ph: rnd() * Math.PI * 2,
        });
      }
    }
    return people;
  }
  const crowdGame = makeCrowd(GW, 5, 40, 9);
  const crowdScene = makeCrowd(SW, 5, 46, 99);

  function drawStands(g, w, bottom, crowd, t, excited) {
    g.fillStyle = '#10132e';
    g.fillRect(0, 0, w, bottom);
    g.fillStyle = '#171b40';
    for (let y = 4; y < bottom; y += 10) g.fillRect(0, y, w, 5);
    for (const p of crowd) {
      let dy = 0;
      if (excited) dy = Math.sin(t / 80 + p.ph) > 0 ? -2 : 0;
      else if (Math.sin(t / 650 + p.ph * 3) > 0.96) dy = -1;
      g.fillStyle = p.shirt; g.fillRect(p.x, p.y + 2 + dy, 3, 2);
      g.fillStyle = p.skin; g.fillRect(p.x + 1, p.y + dy, 2, 2);
      if (dy < -1) { g.fillRect(p.x, p.y - 1 + dy, 1, 1); g.fillRect(p.x + 3, p.y - 1 + dy, 1, 1); }
    }
    // Flashes de cámaras
    const fr = Math.floor(t / 120);
    const rnd = seeded(fr * 7 + 1);
    const n = excited ? 6 : 1;
    for (let i = 0; i < n; i++) {
      if (rnd() < 0.5) continue;
      g.fillStyle = '#ffffff';
      g.fillRect(Math.floor(rnd() * w), Math.floor(rnd() * (bottom - 6)) + 3, 1, 1);
    }
    // Focos
    for (let i = 0; i < 4; i++) {
      const x = Math.round(w * (0.12 + i * 0.25));
      g.fillStyle = 'rgba(255,230,150,.18)'; g.fillRect(x - 4, 0, 9, 4);
      g.fillStyle = '#fff6c8'; g.fillRect(x - 2, 0, 5, 2);
    }
  }

  function drawBoards(g, w, y, h, t) {
    g.fillStyle = '#1d3ea8'; g.fillRect(0, y, w, h);
    g.fillStyle = '#0a0a12'; g.fillRect(0, y + h, w, 1);
    const label = 'NICO 9';
    const tw = S.textWidth(label) + 14;
    const off = Math.floor(t / 70) % tw;
    for (let x = -off; x < w; x += tw) S.text(g, label, x, y + Math.floor((h - 5) / 2), '#ffd23f');
  }

  function drawGrass(g, w, top, h) {
    for (let y = top, i = 0; y < h; y += 12, i++) {
      g.fillStyle = i % 2 ? '#3c9a3c' : '#348a35';
      g.fillRect(0, y, w, 12);
    }
  }

  function drawGoal(g, o) {
    const { x, w, top, line, post } = o;
    const h = line - top;
    // Fondo de la red (con zonas sutiles)
    if (o.sectors) {
      const sw = w / SECTORS;
      for (let i = 0; i < SECTORS; i++) {
        g.fillStyle = i % 2 ? '#1e382b' : '#24443a';
        g.fillRect(x + i * sw, top, sw, h);
      }
    } else {
      g.fillStyle = '#22406a'; g.fillRect(x, top, w, h);
      g.fillStyle = '#1b3358'; g.fillRect(x, top + Math.floor(h * 0.55), w, Math.ceil(h * 0.45));
    }
    // Zona apuntada
    if (o.hl >= 0) {
      const sw = w / SECTORS, hx = x + o.hl * sw;
      const on = Math.floor(o.t / 220) % 2 === 0;
      g.fillStyle = on ? 'rgba(255,210,63,.30)' : 'rgba(255,210,63,.16)';
      g.fillRect(hx, top, sw, h);
    }
    // Malla
    g.fillStyle = 'rgba(255,255,255,.28)';
    const step = o.netStep || 5;
    for (let nx = x; nx <= x + w; nx += step) g.fillRect(nx, top, 1, h);
    for (let ny = top; ny < line; ny += step) g.fillRect(x, ny, w, 1);
    // Esquinas del objetivo
    if (o.hl >= 0) {
      const sw = w / SECTORS, hx = Math.round(x + o.hl * sw) + 2, hy = top + 2, hw = sw - 5, hh = h - 5;
      g.fillStyle = '#ffd23f';
      const L = 6;
      g.fillRect(hx, hy, L, 2); g.fillRect(hx, hy, 2, L);
      g.fillRect(hx + hw - L, hy, L, 2); g.fillRect(hx + hw - 2, hy, 2, L);
      g.fillRect(hx, hy + hh - 2, L, 2); g.fillRect(hx, hy + hh - L, 2, L);
      g.fillRect(hx + hw - L, hy + hh - 2, L, 2); g.fillRect(hx + hw - 2, hy + hh - L, 2, L);
    }
    // Palos y travesaño
    g.fillStyle = '#0a0a12';
    g.fillRect(x - post - 1, top - post - 1, w + 2 * post + 2, post + 2);
    g.fillRect(x - post - 1, top - post - 1, post + 2, h + post + 2);
    g.fillRect(x + w - 1, top - post - 1, post + 2, h + post + 2);
    g.fillStyle = '#fafafa';
    g.fillRect(x - post, top - post, w + 2 * post, post);
    g.fillRect(x - post, top - post, post, h + post);
    g.fillRect(x + w, top - post, post, h + post);
    g.fillStyle = '#c8ccd4';
    g.fillRect(x - post, top - 1, w + 2 * post, 1);
    g.fillRect(x - 1, top, 1, h);
    g.fillRect(x + w + post - 1, top, 1, h);
  }

  function drawPixelArrow(g, x0, y0, x1, y1, color) {
    const ang = Math.atan2(y1 - y0, x1 - x0);
    const len = Math.hypot(x1 - x0, y1 - y0);
    const pts = [];
    for (let d = 0; d <= len; d += 1) pts.push([x0 + Math.cos(ang) * d, y0 + Math.sin(ang) * d]);
    for (const side of [1, -1]) {
      const a = ang + Math.PI - side * 0.65;
      for (let d = 0; d <= 9; d += 1) pts.push([x1 + Math.cos(a) * d, y1 + Math.sin(a) * d]);
    }
    g.fillStyle = '#000';
    for (const [px, py] of pts) g.fillRect(Math.round(px) - 2, Math.round(py) - 2, 4, 4);
    g.fillStyle = color;
    for (const [px, py] of pts) g.fillRect(Math.round(px) - 1, Math.round(py) - 1, 2, 2);
  }

  function drawBall(g, x, y, sc, frame) {
    const s = Math.max(5, Math.round(9 * sc));
    g.drawImage(S.ball(frame), Math.round(x - s / 2), Math.round(y - s / 2), s, s);
  }

  function drawShadow(g, x, y, w) {
    g.fillStyle = 'rgba(0,0,0,.32)';
    g.fillRect(Math.round(x - w / 2), Math.round(y), Math.round(w), 2);
  }

  // Escena de intro y final (Nico de cerca, mirando al jugador)
  function renderScene(cv, look, talking, t) {
    const { mouth, eyes = 'open', jump = false, x = 80, juggle = false } = look;
    const pose = juggle ? 'open' : look.pose;
    const g = cv.g;
    drawStands(g, SW, 46, crowdScene, t, false);
    drawBoards(g, SW, 46, 6, t);
    drawGrass(g, SW, 53, SH);
    drawGoal(g, { x: 28, w: 104, top: 64, line: 100, post: 3, sectors: false, hl: -1, t, netStep: 4 });
    g.fillStyle = 'rgba(255,255,255,.8)';
    g.fillRect(0, 100, SW, 1);
    g.fillRect(70, 116, 20, 2); // punto penal
    const blink = eyes === 'open' && (t % 3400) < 140;
    const m = talking ? (Math.floor(t / 110) % 2 ? 'open' : mouth) : mouth;
    const spr = S.nico(pose, m, blink ? 'closed' : eyes);
    // Saltos de celebración o leve respiración
    const air = jump ? Math.round(Math.abs(Math.sin((t / 620) * Math.PI)) * 14) : 0;
    const bob = jump ? 0 : Math.floor(t / 520) % 2;
    const sw = 60 - Math.round(air * 1.6);
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.fillRect(x - sw / 2, 123, sw, 3);
    g.drawImage(spr, 0, 0, 34, 50, x - 34, 24 + bob - air, 68, 100);

    if (juggle) {
      // Balón pasando de una mano a la otra (coordenadas del sprite → escena x2)
      const P = 560;
      const cyc = Math.floor(t / P);
      const p = (t % P) / P;
      const from = cyc % 2 ? 24.5 : 7.5, to = cyc % 2 ? 7.5 : 24.5;
      const sx = lerp(from, to, p);
      const sy = 22.5 - Math.sin(p * Math.PI) * 4.5; // arco bajo: no le tapa la cara
      const bx = x - 34 + (sx + 1) * 2, by = 24 + bob + (sy + 1) * 2;
      g.drawImage(S.ball(Math.floor(t / 90) % 2), Math.round(bx - 7), Math.round(by - 7), 14, 14);
    }
  }

  // ---------------- Pantallas ----------------
  const state = { screen: 'intro', name: '' };

  function showScreen(name) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 'screen-' + name));
    state.screen = name;
    stages.forEach(fit);
    // "VER RANKING" (y su nota musical) solo existe en el inicio (nunca mientras se juega)
    document.getElementById('credit-row').hidden = name !== 'intro';
    document.getElementById('rank-modal').hidden = true;
    // Música de fondo: cada pantalla arranca su canción desde el inicio
    if (name === 'intro') Music.play('game', 'intro', true);
    else if (name === 'game') Music.play('match', 'match', true);     // moderada: priman los efectos
    else if (name === 'end') Music.play('podium', 'podium', true);
    else Music.stop();                                                   // premiación: suena al tocar VER GANADORES
  }

  // Texto que aparece letra por letra
  function Typer(el) {
    return {
      el, text: '', shown: 0, acc: 0, done: true,
      start(text) { this.text = text; this.shown = 0; this.acc = 0; this.done = false; this.paint(); },
      finish() { this.shown = this.text.length; this.done = true; this.paint(); },
      paint() {
        const a = document.createElement('span');
        a.textContent = this.text.slice(0, this.shown);
        const b = document.createElement('span');
        b.className = 'ghost';
        b.textContent = this.text.slice(this.shown);
        this.el.replaceChildren(a, b);
      },
      update(dt) {
        if (this.done) return;
        this.acc += dt;
        let changed = false;
        while (this.acc >= 30 && this.shown < this.text.length) {
          this.acc -= 30;
          this.shown++;
          changed = true;
          const ch = this.text[this.shown - 1];
          if (this.shown % 2 === 0 && ch !== ' ') Sfx.blip();
        }
        if (this.shown >= this.text.length) this.done = true;
        if (changed) this.paint();
      },
    };
  }

  // ---------------- INTRO ----------------
  const dialogEl = $('#dialog');
  const nextEl = $('#dialog-next');
  const formEl = $('#name-form');
  const inputEl = $('#name-input');
  const skipEl = $('#btn-skip');
  const intro = { i: 0, typer: Typer($('#dialog-text')), formShown: false };

  function showForm() {
    intro.formShown = true;
    formEl.hidden = false;
    skipEl.hidden = true;
    nextEl.hidden = true;
    if (FINE_POINTER) setTimeout(() => inputEl.focus(), 50);
  }
  function hideForm() {
    intro.formShown = false;
    formEl.hidden = true;
    skipEl.hidden = false;
  }
  function introStart(again) {
    if (again) {
      intro.i = LAST_LINE;
      intro.typer.start('¿QUIÉN PATEA AHORA? ESCRIBE TU NOMBRE Y... ¡A JUGAR!');
      inputEl.value = '';
      showForm();
    } else {
      intro.i = 0;
      hideForm();
      intro.typer.start(INTRO_LINES[0]);
    }
    showScreen('intro');
  }
  function introAdvance() {
    if (!intro.typer.done) { intro.typer.finish(); return; }
    if (intro.i < LAST_LINE) {
      intro.i++;
      intro.typer.start(INTRO_LINES[intro.i]);
    }
  }
  function introSkip() {
    intro.i = LAST_LINE;
    intro.typer.start(INTRO_LINES[LAST_LINE]);
    intro.typer.finish();
    showForm();
  }

  dialogEl.addEventListener('click', introAdvance);
  dialogEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); introAdvance(); }
  });
  skipEl.addEventListener('click', (e) => { e.stopPropagation(); introSkip(); });

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = inputEl.value.trim().replace(/\s+/g, ' ').toUpperCase().slice(0, 20).trim();
    if (!name) {
      inputEl.classList.remove('shake');
      void inputEl.offsetWidth;
      inputEl.classList.add('shake');
      inputEl.focus();
      return;
    }
    inputEl.blur();
    state.name = name;
    startGame();
  });

  // ---------------- JUEGO ----------------
  const hud = {
    name: $('#hud-name'), time: $('#hud-time'), timer: $('#hud-timer'),
    goals: $('#hud-goals'),
    points: $('#hud-points'), card: $('#hud-card'),
  };
  const overlay = $('#overlay');
  const kickBtn = $('#btn-kick');
  const sayEl = $('#say'), sayMain = $('#say-main'), saySub = $('#say-sub');
  const continueBtn = $('#btn-continue');

  function say(main, sub, subCls, variant) {
    sayMain.textContent = main;
    saySub.textContent = sub || '';
    saySub.className = 'bubble-sub ' + (subCls || '');
    sayEl.className = 'bubble say ' + (variant || '');
    sayEl.hidden = false;
  }
  function hideSay() { sayEl.hidden = true; }
  const G = {};

  function resetGame() {
    Object.assign(G, {
      phase: 'countdown', phaseAt: now, cd: -1,
      goals: 0, shots: 0, saves: 0, aim: 2,
      points: 0, goalStreak: 0, saveStreak: 0, cards: 0, pending: null,
      lastPts: 0, redCard: false, yellowShown: false, cardShown: false, slideFrom: 0, slideTo: 0, canContinue: false,
      left: GAME_MS, lastSec: GAME_MS / 1000, frenzy: false, twoKeepers: false, timeUp: false, endShown: false,
      cheerUntil: 0, shakeUntil: 0, result: null, ball: null,
      keeper: {
        sector: 2, prev: 2, dir: Math.random() < 0.5 ? -1 : 1,
        int: BASE_STEP, moveStart: -1e9, nextStep: 0, frozen: true,
        pose: 'idle', mouth: 'smile',
      },
      keeper2: null,   // segundo Nico: aparece en los últimos 20 s
    });
    overlay.replaceChildren();
    hideSay();
    continueBtn.hidden = true;
    updateHud();
  }

  function addPoints(n) {
    G.points = Math.max(0, G.points + n);
    updateHud();
    const el = hud.points;
    const cls = n >= 0 ? 'bump' : 'minus';
    el.classList.remove('bump', 'minus'); void el.offsetWidth; el.classList.add(cls);
  }

  function fmtTime(sec) { return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }

  function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

  function updateHud() {
    hud.name.textContent = state.name || 'JUGADOR';
    const sec = Math.ceil(G.left / 1000);
    hud.time.textContent = fmtTime(sec);
    hud.timer.classList.toggle('warn', sec <= 10 && G.phase !== 'countdown' && G.phase !== 'over');
    hud.goals.textContent = G.goals;
    hud.points.textContent = G.points;
    hud.card.hidden = !G.yellowShown;
    kickBtn.classList.toggle('disabled', G.phase !== 'aim');
  }

  function flash(main, sub, cls, dur) {
    const el = document.createElement('div');
    el.className = 'msg ' + (cls || '');
    const a = document.createElement('span');
    a.className = 'main'; a.textContent = main;
    el.appendChild(a);
    if (sub) {
      const b = document.createElement('span');
      b.className = 'sub'; b.textContent = sub;
      el.appendChild(b);
    }
    overlay.replaceChildren(el);
    setTimeout(() => el.classList.add('out'), Math.max(0, dur - 250));
    setTimeout(() => el.remove(), dur);
  }

  function startGame() {
    // Durante la premiación (21 nov, 4–9 pm) no se puede jugar
    if (awardsActive()) { showAwards(); return; }
    resetGame();
    showScreen('game');
  }

  // --- Arquero ---
  // Próximo sector de un arquero (con cambio de dirección sorpresa y rebote en los palos)
  function nextMove(k) {
    let d = k.dir;
    let chance = reverseChance(G.goals);
    if (G.keeper2) chance = Math.max(chance, TWO_KEEPERS_MIN_REVERSE);
    if (Math.random() < chance) d *= -1;                               // ¡sorpresa!
    let n = k.sector + d;
    if (n < 0 || n >= SECTORS) { d *= -1; n = k.sector + d; }         // rebota en los palos
    return { n, d };
  }
  function applyMove(k, m, at) {
    k.dir = m.d;
    k.prev = k.sector;
    k.sector = m.n;
    k.moveStart = at;
  }

  // Aparece el segundo Nico, en el extremo opuesto al primero
  function spawnKeeper2() {
    const k = G.keeper;
    const sector = k.sector <= 2 ? SECTORS - 1 : 0;
    G.keeper2 = {
      sector, prev: sector, dir: sector === 0 ? 1 : -1,
      int: FRENZY_STEP, moveStart: -1e9, spawnAt: now, leaveAt: 0,
      pose: 'idle', mouth: 'smile',
    };
    G.keeper2.nextStep = now + nextInterval(G.keeper2);
  }
  // Al terminar el partido (por tiempo o por roja) el segundo Nico se va: queda uno solo
  function dismissKeeper2() {
    if (G.keeper2 && !G.keeper2.leaveAt) G.keeper2.leaveAt = now;
  }
  const keepers = () => (G.keeper2 ? [G.keeper, G.keeper2] : [G.keeper]);
  // Tiempo entre pasos de Nico: según los goles, y muy rápido en los últimos 20 s
  function keeperStep() {
    const base = stepMs(G.goals);
    return G.frenzy ? Math.min(base, FRENZY_STEP) : base;
  }
  // Próximo intervalo de un arquero (con dos Nicos, cada uno con su propio ritmo)
  function nextInterval(k) {
    const base = keeperStep();
    k.int = G.keeper2 ? Math.round(base * (1 - TWO_KEEPERS_JITTER + Math.random() * 2 * TWO_KEEPERS_JITTER)) : base;
    return k.int;
  }
  // Cada arquero da sus pasos por su cuenta (pueden coincidir en el mismo sector)
  function updateKeeper(until) {
    if (G.keeper.frozen) return;
    keepers().forEach((k) => {
      while (k.nextStep <= until) {
        applyMove(k, nextMove(k), k.nextStep);
        k.nextStep += nextInterval(k);
      }
    });
  }
  function keeperVisual(k = G.keeper) {
    const dur = Math.min(140, k.int * 0.55);
    const t = clamp((now - k.moveStart) / dur, 0, 1);
    const e = t * (2 - t);
    return {
      x: lerp(sectorX(k.prev), sectorX(k.sector), e),
      hop: t < 1 ? Math.round(Math.sin(t * Math.PI) * 3) : 0,
    };
  }

  // --- Acciones del jugador ---
  function moveAim(d) {
    if (state.screen !== 'game' || !['aim', 'flight', 'result', 'countdown', 'resume'].includes(G.phase)) return;
    const n = clamp(G.aim + d, 0, SECTORS - 1);
    if (n !== G.aim) { G.aim = n; Sfx.move(); }
  }

  function kick() {
    if (state.screen !== 'game' || G.phase !== 'aim') return;
    G.shots++;
    G.ball = {
      tx: sectorX(G.aim) + Math.round(Math.random() * 10 - 5),
      ty: GOAL.top + 14 + Math.round(Math.random() * 34),
      start: now, arrive: now + FLIGHT_MS, target: G.aim,
    };
    G.phase = 'flight';
    G.phaseAt = now;
    Sfx.kick();
    updateHud();
  }

  // Se evalúa cuando el balón llega: ¿dónde está Nico en ese instante?
  function resolveShot() {
    const k = G.keeper;
    const ks = keepers();
    const saver = ks.find((q) => q.sector === G.ball.target);  // ¿alguno está en el sector?
    const saved = !!saver;
    k.frozen = true;
    G.phase = 'result';
    G.phaseAt = G.ball.arrive;
    G.pending = null;
    if (saved) {
      G.result = 'save';
      G.saves++;
      G.goalStreak = 0;
      G.saveStreak++;
      ks.forEach((q) => { q.prev = q.sector; q.moveStart = -1e9; q.pose = 'idle'; q.mouth = 'smile'; });
      saver.pose = 'hold';
      Sfx.save();
      let sub;
      if (G.saveStreak >= 2) {
        G.saveStreak = 0;
        G.cards++;
        G.pending = G.cards >= 2 ? 'red' : 'yellow';
        sub = '¡PRIIIIT! ¡EL ÁRBITRO!';
      } else {
        sub = '¡OJO! OTRA ATAJADA Y HAY TARJETA';
      }
      flash('¡ATAJÓ NICO!', sub, 'save', RESULT_MS);
    } else {
      G.result = 'goal';
      // Puntos por cercanía al Nico más cercano
      const dist = Math.min(...ks.map((q) => Math.abs(G.ball.target - q.sector)));
      const mult = G.keeper2 ? TWO_KEEPERS_MULT : 1;   // x2 solo si el segundo Nico ya está en la cancha
      const pts = pointsFor(dist) * mult;
      G.lastPts = pts;
      G.goals++;
      G.saveStreak = 0;
      G.goalStreak++;
      addPoints(pts);
      ks.forEach((q) => { q.pose = 'idle'; q.mouth = 'frown'; });
      G.cheerUntil = now + 1500;
      G.shakeUntil = now + 300;
      Sfx.goal();
      const label = (mult > 1 ? ' · x' + mult : '') + (dist === 1 ? ' · ¡PEGADITO A NICO!' : '');
      flash('¡GOOOL!', '+' + pts + (pts === 1 ? ' PUNTO' : ' PUNTOS') + label, 'goal', RESULT_MS);
      bump(hud.goals);
      if (G.goalStreak >= 3) {
        G.goalStreak = 0;
        G.pending = 'hattrick';
        G.hattrickMult = mult;
      }
    }
    updateHud();
  }

  // Qué pasa cuando termina la pausa de GOL / ATAJADA
  function afterResult() {
    const p = G.pending;
    G.pending = null;
    if (p === 'red') return startCard('red');
    if (G.timeUp) {
      // Se acabó el tiempo: los puntos cuentan igual, pero sin animación
      if (p === 'hattrick') addPoints(HATTRICK_BONUS * (G.hattrickMult || 1));
      if (p === 'yellow') { G.yellowShown = true; addPoints(-YELLOW_PENALTY); }
      return endMatch();
    }
    if (p === 'hattrick') return startHattrick();
    if (p === 'yellow') return startCard('yellow');
    backToAim();
  }

  function resetBall() {
    G.ball = null;
    G.result = null;
  }

  // --- Hat-trick: el tiempo se detiene hasta que el jugador presione CONTINUAR ---
  function startHattrick() {
    G.phase = 'hattrick';
    G.phaseAt = now;
    resetBall();
    const bonus = HATTRICK_BONUS * (G.hattrickMult || 1);
    addPoints(bonus);
    Sfx.goal();
    overlay.replaceChildren();
    say('¡QUÉ CRACK!\n¡HAT-TRICK!', '+' + bonus + ' PUNTOS EXTRA' + (bonus > HATTRICK_BONUS ? ' · x2' : ''), 'plus', 'nico');
    continueBtn.hidden = false;
    G.canContinue = true;
    updateHud();
  }

  // --- Tarjetas: entra el árbitro corriendo de izquierda a derecha ---
  function startCard(color) {
    G.phase = color;          // 'yellow' | 'red'
    G.phaseAt = now;
    G.cardShown = false;
    G.canContinue = false;
    resetBall();
    const k = G.keeper;
    keepers().forEach((q) => { q.pose = 'idle'; q.mouth = 'smile'; q.prev = q.sector; q.moveStart = -1e9; });
    overlay.replaceChildren();
    if (color === 'red') {
      G.redCard = true;
      dismissKeeper2();   // en la roja queda un solo Nico
      // La barrida termina al centro del arco, donde no la tapa el árbitro
      const x0 = sectorX(k.sector);
      const to = 128;
      G.slideTo = to;
      G.slideFrom = Math.abs(x0 - to) < 40 ? to + (x0 < to ? -60 : 60) : x0;
    }
    updateHud();
  }

  function showCard() {
    G.cardShown = true;
    if (G.phase === 'yellow') {
      G.yellowShown = true;
      addPoints(-YELLOW_PENALTY);
      Sfx.whistle();
      say('¡PILAS! TE TAPARON 2 SEGUIDAS', '-' + YELLOW_PENALTY + ' PUNTOS', 'minus', 'ref');
    } else {
      addPoints(-RED_PENALTY);
      Sfx.whistleEnd();
      say('ACUMULASTE\nTARJETAS,\n¡FIN DEL JUEGO!', '-' + RED_PENALTY + ' PUNTOS', 'minus', 'ref low');
    }
  }

  function startResume() {
    hideSay();
    G.phase = 'resume';
    G.phaseAt = now;
    G.cd = -1;
  }

  function onContinue() {
    if (!G.canContinue) return;
    G.canContinue = false;
    continueBtn.hidden = true;
    hideSay();
    if (G.phase === 'hattrick') backToAim();
    else if (G.phase === 'red') { G.endShown = true; showEnd(); }
  }
  continueBtn.addEventListener('click', onContinue);

  function backToAim() {
    const k = G.keeper;
    G.phase = 'aim';
    G.phaseAt = now;
    resetBall();
    keepers().forEach((q) => { q.pose = 'idle'; q.mouth = 'smile'; });
    k.frozen = false;
    keepers().forEach((q) => { q.nextStep = now + nextInterval(q); });
    updateHud();
  }

  function endMatch() {
    G.phase = 'over';
    G.phaseAt = now;
    G.keeper.frozen = true;
    dismissKeeper2();   // al final queda un solo Nico
    Sfx.whistleEnd();
    flash('¡FIN DEL PARTIDO!', G.goals + (G.goals === 1 ? ' GOL' : ' GOLES') + ' · ' + G.points + ' PTS', 'end', OVER_MS);
    updateHud();
  }

  function onCountdown(i) {
    if (i === 0) { flash(state.name, 'VS NICO 9', 'vs', 1300); return; }
    if (i <= 3) { flash(String(4 - i), '', 'cd', 650); Sfx.beep(); return; }
    flash('¡YA!', '', 'cd', 700);
    Sfx.whistle();
    G.phase = 'aim';
    G.phaseAt = now;
    G.keeper.frozen = false;
    G.keeper.nextStep = now + stepMs(0);
    updateHud();
  }

  function updateGame(dt) {
    const el = now - G.phaseAt;
    if (G.phase === 'countdown') {
      const marks = [0, 1400, 2100, 2800, 3500];
      while (G.phase === 'countdown' && G.cd + 1 < marks.length && el >= marks[G.cd + 1]) {
        G.cd++;
        onCountdown(G.cd);
      }
      return;
    }
    if (G.phase === 'over') {
      if (el >= OVER_MS && !G.endShown) { G.endShown = true; showEnd(); }
      return;
    }
    if (G.phase === 'hattrick') return; // tiempo detenido esperando CONTINUAR
    if (G.phase === 'yellow') {
      if (el >= REF_IN && !G.cardShown) showCard();
      if (el >= REF_OUT_AT && !sayEl.hidden) hideSay();
      if (el >= REF_OUT_AT + REF_OUT) startResume();
      return;
    }
    if (G.phase === 'red') {
      if (el >= REF_IN && !G.cardShown) showCard();
      if (el >= RED_BUTTON_AT && !G.canContinue && continueBtn.hidden) {
        G.canContinue = true;
        continueBtn.hidden = false;
      }
      return;
    }
    if (G.phase === 'resume') {
      // Cuenta regresiva de 3 segundos antes de seguir
      const marks = [0, 1000, 2000, 3000];
      while (G.phase === 'resume' && G.cd + 1 < marks.length && el >= marks[G.cd + 1]) {
        G.cd++;
        if (G.cd < 3) { flash(String(3 - G.cd), '', 'cd', 900); Sfx.beep(); }
        else { flash('¡YA!', '', 'cd', 700); Sfx.whistle(); backToAim(); }
      }
      return;
    }

    // aim / flight / result: corre el reloj
    G.left = Math.max(0, G.left - dt);
    const sec = Math.ceil(G.left / 1000);
    if (sec !== G.lastSec) {
      G.lastSec = sec;
      updateHud();
      if (sec <= 5 && sec > 0) Sfx.tick();
    }
    if (G.left <= 0) G.timeUp = true;

    // Últimos 20 segundos: Nico se acelera al máximo, sin avisar (es sorpresa)
    if (!G.frenzy && G.left <= FRENZY_MS && G.left > 0) {
      G.frenzy = true;
      // Se revisa UNA sola vez, justo a las 0:20: ¿merece el segundo Nico?
      G.twoKeepers = G.points >= TWO_KEEPERS_MIN_POINTS;
      G.keeper.nextStep = Math.min(G.keeper.nextStep, now + FRENZY_STEP);
    }

    if (G.phase === 'aim') {
      if (G.timeUp) { endMatch(); return; }
      if (G.frenzy && G.twoKeepers && !G.keeper2) spawnKeeper2();   // ¡aparece el segundo Nico! (sin aviso)
      updateKeeper(now);
    } else if (G.phase === 'flight') {
      if (now >= G.ball.arrive) {
        updateKeeper(G.ball.arrive);
        resolveShot();
      } else {
        updateKeeper(now);
      }
    } else if (G.phase === 'result' && now - G.phaseAt >= RESULT_MS) {
      afterResult();
    }
  }

  function renderGame() {
    const g = cvGame.g;
    g.save();
    if (now < G.shakeUntil) g.translate(Math.round(Math.random() * 2 - 1), Math.round(Math.random() * 2 - 1));

    drawStands(g, GW, 40, crowdGame, now, now < G.cheerUntil);
    drawBoards(g, GW, 40, 7, now);
    drawGrass(g, GW, 48, GH);

    const aiming = G.phase === 'aim' || G.phase === 'countdown' || G.phase === 'resume';
    const inEvent = G.phase === 'hattrick' || G.phase === 'yellow' || G.phase === 'red';
    drawGoal(g, { ...GOAL, sectors: true, hl: aiming ? G.aim : -1, t: now });

    // Líneas de cancha
    g.fillStyle = 'rgba(255,255,255,.85)';
    g.fillRect(0, GOAL.line, GW, 1);
    g.fillRect(56, GOAL.line, 1, 16); g.fillRect(184, GOAL.line, 1, 16); g.fillRect(56, GOAL.line + 16, 129, 1);
    g.fillRect(8, GOAL.line, 1, GH - GOAL.line); g.fillRect(232, GOAL.line, 1, GH - GOAL.line);
    g.fillRect(118, SPOT.y + 4, 5, 2);

    // Balón dentro del arco (se dibuja detrás de Nico)
    const b = G.ball;
    if (b && G.result === 'goal') {
      const t2 = clamp((now - b.arrive) / 420, 0, 1);
      const y = lerp(b.ty, GOAL.line - 4, t2 * t2);
      if (now - b.arrive < 450) {
        const rr = 4 + (now - b.arrive) / 35;
        g.fillStyle = 'rgba(255,255,255,.7)';
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          g.fillRect(Math.round(b.tx + Math.cos(a) * rr), Math.round(b.ty + Math.sin(a) * rr), 1, 1);
        }
      }
      drawShadow(g, b.tx, GOAL.line - 1, 5);
      drawBall(g, b.tx, y, 0.6, 0);
    }

    // Nico
    const k = G.keeper;
    const blink = (now % 2900) < 120;
    if (G.keeper2 && G.keeper2.leaveAt && now - G.keeper2.leaveAt >= 260) G.keeper2 = null;  // ya se fue
    if (G.keeper2) {
      const k2 = G.keeper2;
      const kv2 = keeperVisual(k2);
      const drop = k2.leaveAt
        ? Math.round(Math.min(1, (now - k2.leaveAt) / 260) * 60)                // se va saltando hacia arriba
        : Math.round(Math.max(0, 1 - (now - k2.spawnAt) / 260) * 40);          // entra cayendo
      const red = G.phase === 'red' && now - G.phaseAt >= REF_IN;
      const hop2 = red ? Math.round(Math.abs(Math.sin(now / 170)) * 4) : kv2.hop;
      const spr2 = red ? S.nico('up', 'grin', 'happy')
        : S.nico(k2.pose, k2.mouth, (now % 3300) < 120 ? 'closed' : (G.result === 'goal' ? 'down' : 'open'));
      drawShadow(g, kv2.x, GOAL.line - 1, 26);
      g.drawImage(spr2, Math.round(kv2.x) - 17, GOAL.line - 49 - hop2 - drop);
    }
    if (G.phase === 'red' && now - G.phaseAt >= REF_IN) {
      // ¡Nico celebra la roja con una barrida de rodillas!
      const t = clamp((now - G.phaseAt - REF_IN) / SLIDE_MS, 0, 1);
      const e = 1 - Math.pow(1 - t, 3);
      const x = lerp(G.slideFrom, G.slideTo, e);
      if (t < 1) {
        g.fillStyle = 'rgba(210,190,140,.75)'; // polvo/pasto levantado
        const dir = Math.sign(G.slideTo - G.slideFrom);
        for (let i = 0; i < 6; i++) {
          g.fillRect(Math.round(x - dir * (14 + i * 3)), GOAL.line - 2 - ((i * 7 + Math.floor(now / 50)) % 5), 2, 2);
        }
      }
      drawShadow(g, x, GOAL.line - 1, 26);
      g.drawImage(S.nico('slide', 'grin', 'happy'), Math.round(x) - 17, GOAL.line - 49);
    } else {
      const kv = keeperVisual();
      const spr = S.nico(k.pose, k.mouth, blink ? 'closed' : (G.result === 'goal' ? 'down' : 'open'));
      drawShadow(g, kv.x, GOAL.line - 1, 26);
      g.drawImage(spr, Math.round(kv.x) - 17, GOAL.line - 49 - kv.hop);
    }

    // Balón en el punto penal / volando
    if (inEvent) {
      drawShadow(g, SPOT.x, SPOT.y + 4, 9);
      drawBall(g, SPOT.x, SPOT.y, 1, 0);
    } else if (aiming) {
      const tx = sectorX(G.aim), ty = GOAL.top + 34;
      const ang = Math.atan2(ty - (SPOT.y - 8), tx - SPOT.x);
      const len = 26 + (Math.floor(now / 200) % 2) * 3;
      if (G.phase === 'aim') {
        drawPixelArrow(g, SPOT.x, SPOT.y - 9, SPOT.x + Math.cos(ang) * len, SPOT.y - 9 + Math.sin(ang) * len, '#ffd23f');
      }
      drawShadow(g, SPOT.x, SPOT.y + 4, 9);
      drawBall(g, SPOT.x, SPOT.y, 1, 0);
    } else if (b && G.phase === 'flight') {
      const t = clamp((now - b.start) / FLIGHT_MS, 0, 1);
      const e = 1 - (1 - t) * (1 - t);
      const x = lerp(SPOT.x, b.tx, e);
      const y = lerp(SPOT.y, b.ty, e) - Math.sin(Math.PI * t) * 10;
      const sc = lerp(1, 0.6, e);
      drawShadow(g, x, lerp(SPOT.y + 4, GOAL.line + 1, e), 9 * sc);
      drawBall(g, x, y, sc, Math.floor(now / 60) % 2);
    }

    // Árbitro
    if (G.phase === 'yellow' || G.phase === 'red') {
      const el = now - G.phaseAt;
      let rx, pose = 'card', frame = 0;
      if (el < REF_IN) {
        rx = lerp(-40, REF_X, el / REF_IN); pose = 'run'; frame = Math.floor(el / 90) % 2;
      } else if (G.phase === 'yellow' && el >= REF_OUT_AT) {
        const t = (el - REF_OUT_AT) / REF_OUT;
        rx = lerp(REF_X, GW + 40, t); pose = 'run'; frame = Math.floor(el / 90) % 2;
      } else {
        rx = REF_X;
      }
      if (rx < GW + 40) {
        const run = pose === 'run' ? Math.floor(el / 90) % 2 : 0;
        g.fillStyle = 'rgba(0,0,0,.3)';
        g.fillRect(Math.round(rx - 26), 204, 52, 3);
        g.drawImage(S.referee(pose, frame, G.phase), Math.round(rx) - 34, 106 - run * 2, 68, 100);
      }
    }

    // Hat-trick: Nico de cerca, sorprendido
    if (G.phase === 'hattrick') {
      g.fillStyle = 'rgba(5,10,20,.62)';
      g.fillRect(-2, -2, GW + 4, GH + 4);
      const el = now - G.phaseAt;
      const hop = Math.round(Math.abs(Math.sin(el / 260)) * 4);
      // destellos
      for (let i = 0; i < 14; i++) {
        const a = i * 0.9 + el / 700;
        const rr = 48 + (i % 3) * 10;
        if ((Math.floor(el / 150) + i) % 3 === 0) continue;
        g.fillStyle = i % 2 ? '#ffd23f' : '#ffffff';
        g.fillRect(Math.round(REF_X + Math.cos(a) * rr), Math.round(120 + Math.sin(a) * rr * 0.8), 2, 2);
      }
      g.fillStyle = 'rgba(0,0,0,.35)';
      g.fillRect(REF_X - 26, 172, 52, 3);
      g.drawImage(S.nico('up', 'wow', 'wide'), REF_X - 34, 72 - hop, 68, 100);
    }

    g.restore();
  }

  // ---------------- FINAL ----------------
  const endTyper = Typer($('#end-text'));
  const endLook = { pose: 'idle', mouth: 'grin', eyes: 'happy', jump: false };
  const bubbleEl = $('#record-bubble');

  async function showEnd() {
    const goals = G.goals, shots = G.shots, name = state.name, points = G.points, red = G.redCard;
    const acc = shots ? Math.round((goals / shots) * 100) : 0;
    $('#st-points').textContent = points;
    $('#st-goals').textContent = goals;
    $('#st-shots').textContent = shots;
    $('#st-acc').textContent = acc + '%';
    $('#end-title').textContent = red ? '¡TARJETA ROJA!' : '¡FIN DEL PARTIDO!';
    const ptsTxt = ' ¡SUMASTE ' + points + (points === 1 ? ' PUNTO!' : ' PUNTOS!');

    // Nico siempre termina emocionado
    let text;
    if (goals === 0) {
      text = '¡NI UNO, ' + name + '! HOY SOY UNA MURALLA. ¿QUIERES LA REVANCHA?';
      Object.assign(endLook, { pose: 'up', mouth: 'grin', eyes: 'happy', jump: false });
    } else if (goals <= 3) {
      text = '¡BIEN, ' + name + '! ME METISTE ' + goals + (goals === 1 ? ' GOL' : ' GOLES') + '. ¡PERO SÉ QUE PUEDES MÁS!';
      Object.assign(endLook, { pose: 'hold', mouth: 'grin', eyes: 'happy', jump: false });
    } else if (goals <= 7) {
      text = '¡QUÉ PATADA, ' + name + '! ' + goals + ' GOLES... ¡ME HICISTE SUDAR LOS GUANTES!';
      Object.assign(endLook, { pose: 'idle', mouth: 'grin', eyes: 'open', jump: false });
    } else {
      text = '¡' + goals + ' GOLES! ERES UN CRACK, ' + name + '. ¡QUÉ PARTIDAZO JUGAMOS!';
      Object.assign(endLook, { pose: 'idle', mouth: 'grin', eyes: 'happy', jump: false });
    }
    if (goals > 0) text += ptsTxt;
    endLook.x = 80;
    endLook.juggle = false;
    if (red) {
      // Roja: Nico hace malabares con el balón de mano a mano
      text = 'SOY NICO PRO, ¡EL MEJOR ARQUERO!';
      Object.assign(endLook, { pose: 'open', mouth: 'grin', eyes: 'happy', jump: false, juggle: true });
    }
    bubbleEl.hidden = true;
    $('#new-record').hidden = true;

    showScreen('end');
    endTyper.start(text);
    $('#screen-end').scrollTop = 0;

    // Guardado automático con el nombre del inicio, y luego se actualiza el ranking
    let myId = null;
    // tarjeta: 'red' (expulsado), 'yellow' (tuvo amarilla) o null (sin tarjetas → medalla de plata)
    const card = red ? 'red' : (G.cards > 0 ? 'yellow' : null);
    try { myId = await Ranking.submit({ name, points, goals, shots, card }); } catch (e) { /* queda en cola */ }
    endRankingId = myId;
    loadEndRanking(true);
  }

  // El ranking ya no se muestra en esta pantalla (está en el popup "VER RANKING"),
  // pero se consulta para saber si la partida es récord
  let endRankingId = null;
  async function loadEndRanking(celebrate) {
    let list;
    try { list = await Ranking.all(); } catch (e) { return; }
    const pos = list.findIndex((r) => r.id === endRankingId);
    if (!celebrate || state.screen !== 'end') return;
    const isRecord = pos === 0 && G.points > 0;
    $('#new-record').hidden = !isRecord;
    if (isRecord && !G.redCard) {
      // ¡Celebración! brazos arriba, saltando y globo de cómic
      Object.assign(endLook, { pose: 'up', mouth: 'grin', eyes: 'happy', jump: true, x: 54 });
      bubbleEl.hidden = false;
      Sfx.goal();
    }
  }

  // ---------- Listas de puntajes (popup "VER RANKING") ----------
  function rankStatus(ol, kind, retry) {
    ol.replaceChildren();
    const li = document.createElement('li');
    li.className = 'empty' + (kind === 'error' ? ' error' : '');
    li.textContent = kind === 'loading' ? 'Cargando ranking…'
      : kind === 'error' ? 'No se pudo cargar el ranking, intenta de nuevo'
      : 'Aún no hay puntajes, ¡sé el primero!';
    if (kind === 'error' && retry) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn retry';
      b.textContent = 'REINTENTAR';
      b.addEventListener('click', retry);
      li.appendChild(b);
    }
    ol.appendChild(li);
  }

  // Medalla de plata: terminó el partido sin ninguna tarjeta
  function medal() {
    const m = document.createElement('span');
    m.className = 'md';
    m.title = 'Sin tarjetas';
    m.setAttribute('aria-label', 'Medalla: sin tarjetas');
    return m;
  }

  const goalsTxt = (n) => n + (n === 1 ? ' GOL' : ' GOLES');

  function renderRankList(ol, list, isMine) {
    if (!list.length) { rankStatus(ol, 'empty'); return; }
    ol.replaceChildren();
    const frag = document.createDocumentFragment();
    const mk = (cls, txt) => { const s = document.createElement('span'); s.className = cls; s.textContent = txt; return s; };
    list.forEach((r, i) => {
      const li = document.createElement('li');
      if (isMine(r, i)) li.className = 'me';
      li.append(mk('pos', (i + 1) + '.'), mk('nm', r.name));
      if (r.card === 'red') { const c = mk('rc', ''); c.title = 'Tarjeta roja'; li.append(c); }
      else if (!r.card) li.append(medal());
      li.append(
        mk('dots', ''),
        mk('dt', goalsTxt(r.goals || 0)),          // goles, con el estilo que tenía la fecha
        mk('pts', (r.points || 0) + ' PTS'),       // los puntos van al final
      );
      frag.appendChild(li);
    });
    ol.appendChild(frag);
  }

  $('#btn-again').addEventListener('click', startGame);
  $('#btn-rename').addEventListener('click', () => introStart(true));

  // ---------------- Controles ----------------
  function bindPress(el, fn) {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      Sfx.unlock();
      el.classList.add('pressed');
      fn();
    });
    const up = () => el.classList.remove('pressed');
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('pointercancel', up);
    // Teclado / lectores de pantalla (click sin puntero)
    el.addEventListener('click', (e) => { if (e.detail === 0) fn(); });
  }
  bindPress($('#btn-left'), () => moveAim(-1));
  bindPress($('#btn-right'), () => moveAim(1));
  bindPress(kickBtn, kick);

  const muteBtn = $('#btn-mute');
  function paintMute() {
    muteBtn.classList.toggle('off', Sfx.muted);
    muteBtn.setAttribute('aria-label', Sfx.muted ? 'Activar sonido' : 'Silenciar sonido');
  }
  muteBtn.addEventListener('click', () => { Sfx.unlock(); Sfx.toggle(); paintMute(); });
  paintMute();

  // Música: independiente de los efectos (se puede tener solo una, las dos o ninguna)
  const musicBtns = document.querySelectorAll('.music-btn');
  function paintMusic() {
    musicBtns.forEach((b) => {
      b.classList.toggle('off', Music.off);
      b.setAttribute('aria-label', Music.off ? 'Encender música' : 'Apagar música');
    });
  }
  musicBtns.forEach((b) => b.addEventListener('click', () => { Music.toggle(); paintMusic(); }));
  paintMusic();

  document.addEventListener('pointerdown', Sfx.unlock, { capture: true });
  document.addEventListener('keydown', (e) => {
    Sfx.unlock();
    if (photo.open) {
      if (e.key === 'Escape') { e.preventDefault(); closePhoto(); }
      return;
    }
    if (!rankModal.hidden) {
      if (e.key === 'Escape') { e.preventDefault(); closeRanking(); }
      return;
    }
    if (e.target === inputEl) return;
    if (state.screen === 'game' && G.canContinue && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault(); onContinue(); return;
    }
    if (state.screen === 'game') {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); moveAim(-1); }
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); moveAim(1); }
      else if ((e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') && !e.repeat) {
        if (e.target.tagName === 'BUTTON' && e.target !== kickBtn) return;
        e.preventDefault(); kick();
      }
    } else if (state.screen === 'intro' && !intro.formShown && e.target === document.body) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); introAdvance(); }
    }
  });

  // ---------------- Foto: Nico y el tío Pipe ----------------
  // Animación de 7 s en loop: se dan la mano → salto y "SIIUUUU" → se ríen → abrazo posando para la foto
  const PW = 128, PH = 90, GROUND = 86, PHOTO_LOOP = 7000;
  const cvPhoto = setupCanvas('#cv-photo', PW, PH);
  const crowdPhoto = makeCrowd(PW, 4, 34, 7);
  const photo = { open: false, start: 0, siu: false };
  const photoModal = $('#photo-modal');
  const photoSiu = $('#photo-siu');
  const creditBtn = $('#btn-credit');

  function renderPhoto() {
    const g = cvPhoto.g;
    const t = now - photo.start;
    const T = t % PHOTO_LOOP;
    const SIU_AT = 1900, LAUGH_AT = 3300, HUG_AT = 4800;
    const siuTime = T >= SIU_AT && T < LAUGH_AT;

    drawStands(g, PW, 34, crowdPhoto, now, siuTime);
    drawBoards(g, PW, 34, 6, now);
    drawGrass(g, PW, 41, PH);

    // Posiciones: juntos para la mano (las manos se tocan), separados para celebrar, pegados para la foto
    const SHAKE = { n: 34, u: 63 }, APART = { n: 22, u: 74 }, HUG = { n: 36, u: 58 };
    let nx = APART.n, ux = APART.u, jumpY = 0, bob = 0;
    let nPose = 'idle', uPose = 'stand', nM = 'smile', uM = 'smile', nE = 'open', uE = 'open';

    if (T < 1100) {
      // Un solo apretón de manos
      nx = SHAKE.n; ux = SHAKE.u;
      if (T >= 300) {
        const f = T >= 550 && T < 800 ? 1 : 0;
        nPose = f ? 'shake2' : 'shake'; uPose = f ? 'shake2' : 'shake';
        nM = 'grin'; uM = 'grin';
      }
    } else if (T < SIU_AT) {
      // Salto (sin giro) y caída estilo CR7
      const j = clamp((T - 1100) / (SIU_AT - 1100), 0, 1);
      nx = lerp(SHAKE.n, APART.n, j); ux = lerp(SHAKE.u, APART.u, j);
      jumpY = Math.round(Math.sin(Math.PI * j) * 16);
      nPose = 'up'; uPose = 'jump'; nM = 'open'; uM = 'open';
    } else if (T < LAUGH_AT) {
      nPose = 'siu'; uPose = 'siu'; nM = 'open'; uM = 'open';
      if (T < SIU_AT + 120) jumpY = -1; // impacto de la caída
    } else if (T < HUG_AT) {
      // Riéndose
      const f = Math.floor(T / 170) % 2;
      nM = f ? 'open' : 'grin'; uM = f ? 'open' : 'grin';
      nE = 'happy'; uE = 'happy';
      bob = f;
    } else {
      // Abrazados posando para la foto
      nx = HUG.n; ux = HUG.u;
      nPose = 'pose'; uPose = 'pose'; nM = 'grin'; uM = 'grin';
    }

    // Sombras
    g.fillStyle = 'rgba(0,0,0,.3)';
    const sw = 22 - Math.round(jumpY / 2);
    g.fillRect(Math.round(nx + 17 - sw / 2), GROUND - 1, sw, 2);
    g.fillRect(Math.round(ux + 17 - sw / 2), GROUND - 1, sw, 2);

    const nicoSpr = S.nico(nPose, nM, nE), uncleSpr = S.uncle(uPose, uM, uE);
    if (T >= HUG_AT) {
      // Abrazo: el brazo del tío pasa POR DETRÁS de Nico, así que se dibuja antes que él
      const OUT = Sprites.C.outline, SHIRT = '#a9d2f2', SKIN = '#efbf98';
      const nX = Math.round(nx), uX = Math.round(ux);
      const sx = uX + 4, sy = GROUND - 62 + 1 + 19;   // hombro del tío
      const hy = GROUND - 50 + 1 + 18;                // altura de los hombros de Nico
      const hx = nX + 8;                              // hombro lejano de Nico
      g.drawImage(uncleSpr, uX, GROUND - 62);
      g.fillStyle = OUT;
      g.fillRect(sx - 1, sy - 1, 6, hy - sy + 6);
      g.fillRect(hx - 1, hy - 1, sx - hx + 6, 6);
      g.fillStyle = SHIRT;
      g.fillRect(sx, sy, 4, hy - sy + 4);
      g.fillRect(hx, hy, sx - hx + 4, 4);
      g.drawImage(nicoSpr, nX, GROUND - 50);
      // Solo asoman los dedos del tío sobre el hombro de Nico
      g.fillStyle = OUT; g.fillRect(hx - 1, hy - 3, 5, 3);
      g.fillStyle = SKIN; g.fillRect(hx, hy - 2, 3, 2);
      // Flash de cámara
      const fl = T - HUG_AT;
      if (fl < 260) {
        g.fillStyle = 'rgba(255,255,255,' + (1 - fl / 260).toFixed(2) + ')';
        g.fillRect(0, 0, PW, PH);
      }
    } else {
      g.drawImage(nicoSpr, Math.round(nx), GROUND - 50 - jumpY + bob);
      g.drawImage(uncleSpr, Math.round(ux), GROUND - 62 - jumpY + bob);
    }

    if (siuTime !== photo.siu) {
      photo.siu = siuTime;
      photoSiu.hidden = !siuTime;
      if (siuTime) Sfx.goal();
    }
  }

  function openPhoto() {
    Sfx.unlock();
    photo.open = true;
    photo.start = now;
    photo.siu = false;
    photoSiu.hidden = true;
    photoModal.hidden = false;
    Music.duck(true);              // la música baja a la mitad mientras se ve la foto
    $('#photo-close').focus();
  }
  function closePhoto() {
    photo.open = false;
    photoModal.hidden = true;
    Music.duck(false);
    creditBtn.focus();
  }
  creditBtn.addEventListener('click', openPhoto);

  // ---------------- Popup "VER RANKING" (solo desde el inicio) ----------------
  const rankModal = $('#rank-modal');
  const rankOpenBtn = $('#btn-ranking');
  const rankPopList = $('#rank-pop-list');

  async function loadPopRanking() {
    rankStatus(rankPopList, 'loading');
    let list;
    try {
      list = await Ranking.all();
    } catch (e) {
      if (!rankModal.hidden) rankStatus(rankPopList, 'error', loadPopRanking);
      return;
    }
    if (!rankModal.hidden) renderRankList(rankPopList, list, popHighlight());
  }
  // Filas resaltadas en amarillo: la partida recién jugada (final) o los 3 del podio (premiación)
  function popHighlight() {
    if (state.screen === 'end') return (r) => endRankingId != null && r.id === endRankingId;
    if (state.screen === 'awards') {
      const keys = new Set(AW.top.map((e) => e.name + '|' + e.points));
      return (r) => { const k = r.name + '|' + r.points; return keys.delete(k); };   // solo la primera vez
    }
    return () => false;
  }
  let rankOpener = null;
  function openRanking(e) {
    if (!['intro', 'end', 'awards'].includes(state.screen)) return;
    rankOpener = (e && e.currentTarget) || rankOpenBtn;
    Sfx.unlock();
    $('#rank-pop-note').textContent = Ranking.isGlobal ? 'RANKING GLOBAL · TODOS LOS PUNTAJES' : 'PUNTAJES DE ESTE DISPOSITIVO';
    rankModal.hidden = false;
    $('#rank-close').focus();
    loadPopRanking();
  }
  function closeRanking() {
    rankModal.hidden = true;
    (rankOpener || rankOpenBtn).focus();
  }
  rankOpenBtn.addEventListener('click', openRanking);
  $('#btn-end-ranking').addEventListener('click', openRanking);
  $('#btn-awards-ranking').addEventListener('click', openRanking);
  $('#rank-close').addEventListener('click', closeRanking);
  rankModal.addEventListener('click', (e) => { if (e.target === rankModal) closeRanking(); });
  $('#photo-close').addEventListener('click', closePhoto);
  photoModal.addEventListener('click', (e) => { if (e.target === photoModal) closePhoto(); });

  // ---------------- PREMIACIÓN ----------------
  // 21 de noviembre de 2026, 4:00 pm hora Colombia (UTC-5) = 21:00 UTC. Dura 5 horas.
  const AWARDS_START = Date.UTC(2026, 10, 21, 21, 0, 0);
  const AWARDS_END = AWARDS_START + 5 * 3600 * 1000;
  const awardsActive = () => { const t = Date.now(); return t >= AWARDS_START && t < AWARDS_END; };

  const AH = 166, GND = 158;                         // canvas del podio: 240 x 166
  const cvAwards = setupCanvas('#cv-awards', GW, AH);
  const crowdAwards = makeCrowd(GW, 5, 44, 21);
  const BLOCKS = [
    { x: 85, w: 70, top: 96, c: ['#f2c94c', '#ffe08a', '#b8902a'] },   // 1º
    { x: 13, w: 70, top: 110, c: ['#c0c6d0', '#eef1f5', '#8a909a'] },  // 2º
    { x: 157, w: 70, top: 120, c: ['#cd8a4f', '#e8a970', '#94592c'] }, // 3º
  ];
  const KITS = [
    { shirt: '#e63946', trim: '#ffffff', shorts: '#ffffff', socks: '#e63946' },
    { shirt: '#2f6fd1', trim: '#ffffff', shorts: '#1b2a55', socks: '#2f6fd1' },
    { shirt: '#2f9e44', trim: '#ffd23f', shorts: '#ffffff', socks: '#2f9e44' },
  ];
  const SKINS = ['#f1c39c', '#e0a77d', '#c68a5e', '#8d5a3b', '#f5d0b0'];
  const HAIRS = ['#2a1a10', '#3a2416', '#5e3b22', '#8a5a2b', '#c9a15a', '#151515'];

  const AW = { entries: [], top: [], revealed: false, revealAt: 0, confetti: [], plan: null };
  const podLabels = $('#pod-labels');
  const winnersBtn = $('#btn-winners');

  // Top 3 del podio: cada nombre (escrito exactamente igual) aparece una sola vez, con su mejor puntaje
  function uniqueTop(sorted) {
    const seen = new Set(), out = [];
    for (const e of sorted) {
      if (seen.has(e.name)) continue;
      seen.add(e.name);
      out.push(e);
      if (out.length === 3) break;
    }
    return out;
  }

  function buildAwardsChars() {
    return AW.top.map((e, i) => {
      const h = Names.hash(e.name);
      return {
        entry: e, place: i + 1, isNico: Names.isNico(e.name),
        look: {
          id: e.name + '#' + i,
          gender: Names.gender(e.name),
          skin: SKINS[h % SKINS.length],
          hair: HAIRS[(h >>> 4) % HAIRS.length],
          kit: KITS[i],
        },
      };
    });
  }

  // Entrada al podio: cada uno llega caminando desde fuera de la pantalla (derecha) y salta a su puesto
  const ENTER_X = 262, WALK = 0.12, HOP_MS = 450;   // WALK en px por ms
  function entryKeys(i, x, start) {
    const stopX = i === 2 ? 236 : i === 1 ? 96 : x + 48;   // desde dónde salta a su puesto
    const walkEnd = start + Math.round((ENTER_X - stopX) / WALK);
    return [
      { t: start, x: ENTER_X, y: GND },
      { t: walkEnd, x: stopX, y: GND },
      { t: walkEnd + HOP_MS, x, y: BLOCKS[i].top, hop: true },
    ];
  }

  // Plan de la premiación (tiempos en ms desde "VER GANADORES"):
  // suben 3º, 2º y 1º → confeti → entra Nico con el trofeo (o el tío Pipe si Nico ganó)
  function buildPlan(chars) {
    const B1 = BLOCKS[0].top;
    const nicoIdx = chars.findIndex((c) => c.isNico);
    const x = chars.map((c, i) => BLOCKS[i].x + BLOCKS[i].w / 2);
    if (chars.length) x[0] = nicoIdx === 1 ? 132 : 108;   // espacio para quien entrega el trofeo

    const entry = [];
    let start = 300;
    for (let i = chars.length - 1; i >= 0; i--) {
      entry[i] = entryKeys(i, x[i], start);
      start = entry[i][2].t + 250;
    }
    const arr = entry.map((k) => k[2].t);                 // cuándo llega cada uno a su puesto
    if (!chars.length) return { x, entry, arr, party: Infinity, keys: null };

    const party = arr[0];                                 // llega el 1º: ¡confeti!
    const d = party + 700;                                // entra quien entrega el trofeo
    const who = nicoIdx === 0 ? 'uncle' : 'nico';
    let keys, back = null, arrive;
    if (nicoIdx === 1) {
      // Nico está 2º: baja por la izquierda y se ubica a la izquierda del ganador
      const B2 = BLOCKS[1].top;
      keys = [{ t: d, x: 48, y: B2 }, { t: d + 400, x: 72, y: GND, hop: true }, { t: d + 700, x: 76, y: GND }, { t: d + 1150, x: 100, y: B1, hop: true }];
      arrive = d + 1150;
      back = [{ t: arrive + 3200, x: 100, y: B1 }, { t: arrive + 3650, x: 76, y: GND, hop: true }, { t: arrive + 3950, x: 72, y: GND }, { t: arrive + 4350, x: 48, y: B2, hop: true }];
    } else if (nicoIdx === 2) {
      // Nico está 3º: baja por la derecha
      const B3 = BLOCKS[2].top;
      keys = [{ t: d, x: 192, y: B3 }, { t: d + 400, x: 174, y: GND, hop: true }, { t: d + 700, x: 170, y: GND }, { t: d + 1150, x: 140, y: B1, hop: true }];
      arrive = d + 1150;
      back = [{ t: arrive + 3200, x: 140, y: B1 }, { t: arrive + 3650, x: 170, y: GND, hop: true }, { t: arrive + 3950, x: 174, y: GND }, { t: arrive + 4350, x: 192, y: B3, hop: true }];
    } else {
      // Nico no está en el podio (o ganó, y entonces entra el tío Pipe): entra caminando con el trofeo
      keys = [{ t: d, x: ENTER_X, y: GND }, { t: d + 1300, x: 176, y: GND }, { t: d + 1750, x: 140, y: B1, hop: true }];
      arrive = d + 1750;
    }
    return { x, entry, arr, party, who, nicoIdx, keys: back ? keys.concat(back) : keys, arrive, back: !!back };
  }

  function pathPos(keys, t) {
    if (t <= keys[0].t) return { x: keys[0].x, y: keys[0].y, moving: false };
    for (let i = 1; i < keys.length; i++) {
      const a = keys[i - 1], b = keys[i];
      if (t <= b.t) {
        const p = (t - a.t) / (b.t - a.t);
        return {
          x: lerp(a.x, b.x, p),
          y: lerp(a.y, b.y, p) - (b.hop ? Math.sin(Math.PI * p) * 16 : 0),
          moving: a.x !== b.x || a.y !== b.y,
        };
      }
    }
    const l = keys[keys.length - 1];
    return { x: l.x, y: l.y, moving: false };
  }

  async function showAwards() {
    let entries = [];
    let failed = false;
    if (state.screen !== 'awards') {
      // Mientras carga: podio vacío y "Cargando ranking…"
      AW.entries = []; AW.top = []; AW.chars = []; AW.plan = null; AW.revealed = false;
      winnersBtn.hidden = true;
      $('#btn-awards-ranking').hidden = true;
      renderPodLabels();
      showScreen('awards');
    }
    try { entries = await Ranking.all(); } catch (e) { failed = true; }
    if (failed) {
      winnersBtn.hidden = true;
      // Sin datos: el botón de VER GANADORES se vuelve REINTENTAR (vuelve a cargar el podio)
      AW.failed = true;
      winnersBtn.textContent = 'REINTENTAR';
      winnersBtn.hidden = false;
      return;
    }
    AW.failed = false;
    AW.entries = entries;
    AW.top = uniqueTop(entries);
    AW.chars = buildAwardsChars();
    AW.plan = buildPlan(AW.chars);
    AW.revealed = false;
    AW.confetti = [];
    winnersBtn.textContent = 'VER GANADORES';
    winnersBtn.hidden = AW.top.length === 0;
    $('#btn-awards-ranking').hidden = false;
    renderPodLabels();
    showScreen('awards');
  }

  // Nombres del podio: aparecen a medida que cada uno llega a su puesto
  function renderPodLabels(shown = []) {
    podLabels.replaceChildren();
    BLOCKS.forEach((b, i) => {
      const e = shown[i] ? AW.top[i] : null;
      const el = document.createElement('div');
      el.className = 'pod-label';
      el.style.left = (b.x / GW * 100) + '%';
      el.style.width = (b.w / GW * 100) + '%';
      el.style.top = ((b.top + 6) / AH * 100) + '%';
      const mk = (cls, txt) => { const s = document.createElement('span'); s.className = cls; s.textContent = txt; return s; };
      const row = document.createElement('span');
      row.className = 'nmrow';
      row.append(mk('nm', e ? e.name : (AW.top[i] ? '' : '—')));
      if (e && !e.card) row.append(medal());        // medalla también en el podio
      el.append(mk('pl', (i + 1) + 'º'), row, mk('pt', e ? e.points + ' PTS' : ''));
      podLabels.appendChild(el);
    });
  }

  winnersBtn.addEventListener('click', () => {
    Sfx.unlock();
    if (AW.failed) { winnersBtn.hidden = true; showAwards(); return; }
    AW.revealed = true;
    AW.revealAt = now;
    AW.confetti = [];
    AW.party = false;
    AW.handoffSound = false;
    AW.labelMask = '';
    renderPodLabels();
    winnersBtn.textContent = 'VER DE NUEVO';
    Sfx.whistle();
    Music.play('winner', 'winner', true);   // suena una sola vez
  });

  function newConfetti(anywhere) {
    const cols = ['#ffd23f', '#e63946', '#2f6fd1', '#2f9e44', '#ffffff', '#ff8fab'];
    return {
      x: Math.random() * GW, y: anywhere ? Math.random() * -AH : -4,
      vx: (Math.random() - 0.5) * 0.04, vy: 0.03 + Math.random() * 0.04,
      c: cols[Math.floor(Math.random() * cols.length)], ph: Math.random() * 6,
    };
  }

  function drawBlock(g, b) {
    g.fillStyle = '#0a0a12';
    g.fillRect(b.x - 1, b.top - 1, b.w + 2, GND - b.top + 2);
    g.fillStyle = b.c[1]; g.fillRect(b.x, b.top, b.w, 4);
    g.fillStyle = b.c[0]; g.fillRect(b.x, b.top + 4, b.w, GND - b.top - 4);
    g.fillStyle = b.c[2]; g.fillRect(b.x + b.w - 3, b.top + 4, 3, GND - b.top - 4);
  }

  function charSprite(c, pose, mouth, eyes) {
    if (c.isNico) return S.nico(pose, mouth, eyes);
    return S.kid(c.look, pose, mouth, eyes);
  }

  function drawTrophy(g, cx, bottom) {
    const t = S.trophy();
    g.drawImage(t, Math.round(cx - t.width / 2), Math.round(bottom - t.height));
  }

  function renderAwards() {
    const g = cvAwards.g;
    const t = AW.revealed ? now - AW.revealAt : -1;
    drawStands(g, GW, 44, crowdAwards, now, AW.revealed);
    drawBoards(g, GW, 44, 7, now);
    drawGrass(g, GW, 52, AH);
    g.fillStyle = 'rgba(0,0,0,.25)';
    g.fillRect(6, GND, GW - 12, 3);
    BLOCKS.forEach((b) => drawBlock(g, b));

    const plan = AW.plan;
    const chars = AW.chars || [];

    // Nombres: aparecen cuando cada uno llega a su puesto
    if (plan) {
      const shown = chars.map((c, i) => AW.revealed && t >= plan.arr[i]);
      const mask = shown.join();
      if (mask !== AW.labelMask) { AW.labelMask = mask; renderPodLabels(shown); }
    }

    // Personajes: antes de VER GANADORES el podio está vacío
    chars.forEach((c, i) => {
      if (!AW.revealed || !plan) return;
      // Nico que está entregando el trofeo se dibuja aparte
      if (plan.who === 'nico' && plan.nicoIdx === i && t >= plan.keys[0].t &&
          (!plan.back || t < plan.keys[plan.keys.length - 1].t)) return;

      const e = plan.entry[i];
      if (t < e[0].t) return;                          // todavía no entra
      if (t < plan.arr[i]) {
        // Entrando: camina desde la derecha y salta a su puesto
        const p = pathPos(e, t);
        const walking = t < e[1].t;
        const feet = Math.round(p.y) - (walking ? Math.floor(now / 110) % 2 : 0);
        if (walking) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(Math.round(p.x) - 11, GND - 1, 22, 2); }
        g.drawImage(charSprite(c, 'idle', 'grin', 'open'), Math.round(p.x) - 17, feet - 50);
        return;
      }

      const b = BLOCKS[i];
      const cx = plan.x[i];
      let pose = Math.floor((now + i * 150) / 320) % 2 ? 'up' : 'siu';
      let mouth = 'open', eyes = 'happy', trophyUp = false;
      let jump = Math.round(Math.abs(Math.sin((now + i * 200) / 180)) * 5);
      if (i === 0) {
        if (t >= plan.arrive && t < plan.arrive + 700) {
          pose = 'open'; mouth = 'grin'; eyes = 'open'; jump = 0;   // recibe el trofeo
        } else if (t >= plan.arrive + 700) {
          pose = 'up'; trophyUp = true;
        }
      }
      const feet = b.top - jump;
      g.fillStyle = 'rgba(0,0,0,.3)';
      g.fillRect(Math.round(cx) - 11, b.top - 1, 22, 2);
      g.drawImage(charSprite(c, pose, mouth, eyes), Math.round(cx) - 17, feet - 50);
      if (trophyUp) drawTrophy(g, cx, feet - 44);
    });

    // Llega el 1º: confeti y celebración
    if (AW.revealed && plan && t >= plan.party && !AW.party) {
      AW.party = true;
      AW.confetti = Array.from({ length: 80 }, () => newConfetti(true));
      Sfx.goal();
    }

    // Entrega del trofeo: Nico (o el tío Pipe, si Nico es el 1º)
    if (AW.revealed && plan && plan.keys && t >= plan.keys[0].t) {
      const p = pathPos(plan.keys, t);
      const returned = plan.back && t >= plan.keys[plan.keys.length - 1].t;
      const isUncle = plan.who === 'uncle';
      if (!returned) {
        const atWinner = t >= plan.arrive;
        const handing = atWinner && t < plan.arrive + 700;
        const celebrating = atWinner && !handing && !(plan.back && t >= plan.arrive + 3200);
        let hop = 0, spr;
        if (celebrating) hop = Math.round(Math.abs(Math.sin(now / 170)) * 5);
        if (isUncle) spr = celebrating ? S.uncle('jump', 'open', 'happy') : S.uncle('stand', 'grin', 'open');
        else spr = celebrating ? S.nico('up', 'open', 'happy') : S.nico('open', 'grin', 'open');
        const bob = p.moving && !atWinner ? Math.floor(now / 120) % 2 : 0;
        const feet = p.y - hop - bob;
        g.fillStyle = 'rgba(0,0,0,.3)';
        const groundY = p.y >= GND - 1 ? GND : (p.x > 85 && p.x < 155 ? BLOCKS[0].top : p.y);
        g.fillRect(Math.round(p.x) - 11, Math.round(groundY) - 1, 22, 2);
        g.drawImage(spr, Math.round(p.x) - Math.round(spr.width / 2), Math.round(feet) - spr.height);
        // Trofeo: en sus manos → pasa al ganador
        const handY = feet - (isUncle ? 24 : 22);
        if (!atWinner) {
          drawTrophy(g, p.x, handY);
        } else if (handing) {
          const k = clamp((t - plan.arrive - 250) / 450, 0, 1);
          const wx = plan.x[0], wFeet = BLOCKS[0].top;
          drawTrophy(g, lerp(p.x, wx, k), lerp(handY, wFeet - 44, k));
          if (k > 0.95 && !AW.handoffSound) { AW.handoffSound = true; Sfx.goal(); }
        }
      }
    }

    // Confeti
    if (AW.revealed) {
      for (const c of AW.confetti) {
        c.x += c.vx * 16 + Math.sin(now / 300 + c.ph) * 0.15;
        c.y += c.vy * 16;
        if (c.y > AH) Object.assign(c, newConfetti(false));
        g.fillStyle = c.c;
        g.fillRect(Math.round(c.x), Math.round(c.y), 2, 2);
      }
    }
  }

  // ---------------- Bucle principal ----------------
  let last = performance.now();
  let lastScheduleCheck = 0;
  function frame(ts) {
    const dt = Math.min(50, Math.max(0, ts - last));
    last = ts;
    now += dt;

    if (state.screen === 'intro') {
      intro.typer.update(dt);
      if (intro.i === LAST_LINE && intro.typer.done && !intro.formShown) showForm();
      nextEl.hidden = !(intro.typer.done && !intro.formShown);
      renderScene(cvIntro, INTRO_LOOK, !intro.typer.done, now);
    } else if (state.screen === 'game') {
      if (!photo.open) updateGame(dt); // el partido se pausa mientras la foto está abierta
      renderGame();
    } else if (state.screen === 'end') {
      endTyper.update(dt);
      renderScene(cvEnd, endLook, !endTyper.done, now);
    }
    if (state.screen === 'awards') renderAwards();
    if (photo.open) renderPhoto();

    // Cada segundo: ¿empezó o terminó la premiación?
    if (now - lastScheduleCheck > 1000) {
      lastScheduleCheck = now;
      const active = awardsActive();
      if (active && state.screen === 'intro') showAwards();
      else if (!active && state.screen === 'awards') introStart(false);
    }
    requestAnimationFrame(frame);
  }

  const INTRO_LOOK = { pose: 'hold', mouth: 'smile', eyes: 'open' };

  // Fondo con patrón de balones, guayos, guantes, pitos y tarjetas
  try {
    document.documentElement.style.setProperty('--pattern', 'url(' + S.pattern() + ')');
    document.documentElement.style.setProperty('--ball', 'url(' + S.ball(0).toDataURL() + ')');
  } catch (e) { /* */ }

  resetGame();
  if (awardsActive()) showAwards(); else introStart(false);
  requestAnimationFrame(frame);
})();
