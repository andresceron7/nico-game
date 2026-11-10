/* =========================================================
   Sprites pixel-art de Nico (arquero), balón y fuente mini.
   Todo se dibuja con rectángulos en una grilla de 32x48 px.
   ========================================================= */
const Sprites = (() => {
  'use strict';

  const C = {
    hair: '#3a2416', hairL: '#5e3b22',
    skin: '#f1c39c', skinS: '#d6976f', blush: '#ee9c8a',
    eyeW: '#ffffff', eye: '#2b1a12', brow: '#3a2416',
    mouth: '#9c4a3a', mouthIn: '#5a1f1a', tongue: '#e0707a',
    shirt: '#f5f5f2', shirtS: '#c6cad3', pad: '#e2e5eb',
    text: '#16161c',
    glove: '#ffffff', gloveS: '#a9afba',
    sole: '#9aa0aa',
    outline: '#0a0a12',
  };

  // Fuente mini 5px de alto (solo lo que necesitamos)
  const GLYPHS = {
    N: ['X..X', 'XX.X', 'X.XX', 'X..X', 'X..X'],
    I: ['X', 'X', 'X', 'X', 'X'],
    C: ['XXX', 'X..', 'X..', 'X..', 'XXX'],
    O: ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'],
    '9': ['XXX', 'X.X', 'XXX', '..X', 'XXX'],
  };
  const BIG9 = ['.XXX.', 'XX.XX', 'XX.XX', '.XXXX', '...XX', '..XX.', '.XX..'];

  const BALL = [
    '..KKKKK..',
    '.KWWBWWK.',
    'KWWBBBWWK',
    'KBWWBWWBK',
    'KBBWWWBBK',
    'KBWWWWWBK',
    'KWWBWBWSK',
    '.KSBBBSK.',
    '..KKKKK..',
  ];
  const BALL_PAL = { K: '#15151d', W: '#f7f7f7', B: '#22222c', S: '#c4c8d2' };

  function mk(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function glyph(g, rows, x, y, color) {
    g.fillStyle = color;
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) if (row[i] === 'X') g.fillRect(x + i, y + j, 1, 1);
    });
  }

  function textWidth(str) {
    let w = 0;
    for (const ch of str) {
      if (ch === ' ') { w += 3; continue; }
      const gl = GLYPHS[ch];
      if (gl) w += gl[0].length + 1;
    }
    return Math.max(0, w - 1);
  }

  function text(g, str, x, y, color) {
    let cx = x;
    for (const ch of str) {
      if (ch === ' ') { cx += 3; continue; }
      const gl = GLYPHS[ch];
      if (!gl) continue;
      glyph(g, gl, cx, y, color);
      cx += gl[0].length + 1;
    }
  }

  function drawMap(g, map, x, y, pal) {
    map.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const col = pal[row[i]];
        if (col) { g.fillStyle = col; g.fillRect(x + i, y + j, 1, 1); }
      }
    });
  }

  // Agrega un contorno de 1px alrededor de los píxeles opacos
  function outline(src, color) {
    const w = src.width + 2, h = src.height + 2;
    const c = mk(w, h);
    const g = c.getContext('2d');
    g.drawImage(src, 1, 1);
    const img = g.getImageData(0, 0, w, h);
    const d = img.data;
    const a = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : d[(y * w + x) * 4 + 3];
    const r = parseInt(color.slice(1, 3), 16), gg = parseInt(color.slice(3, 5), 16), b = parseInt(color.slice(5, 7), 16);
    const out = new Uint8ClampedArray(d);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (a(x, y) > 0) continue;
        if (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1)) {
          const k = (y * w + x) * 4;
          out[k] = r; out[k + 1] = gg; out[k + 2] = b; out[k + 3] = 255;
        }
      }
    }
    img.data.set(out);
    g.putImageData(img, 0, 0);
    return c;
  }

  function drawNicoRaw(g, pose, mouth, eyes) {
    const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const glove = (x, y, w, h) => {
      r(x, y, w, h, C.glove);
      r(x, y + h - 1, w, 1, C.gloveS);
      r(x + 1, y + 1, 1, h - 3, C.gloveS);
    };

    const kneel = pose === 'slide';
    if (kneel) {
      // Barrida de rodillas: todo el cuerpo baja 8px y las piernas quedan dobladas
      g.save();
      g.translate(0, 8);
    } else {
      // Piernas, medias y zapatos (abiertas en la pose "siu")
      const [a, b] = pose === 'siu' ? [8, 20] : [10, 18];
      r(a, 39, 4, 2, C.skin); r(b, 39, 4, 2, C.skin);
      r(a, 41, 4, 4, C.shirt); r(b, 41, 4, 4, C.shirt);
      r(a, 41, 4, 1, C.shirtS); r(b, 41, 4, 1, C.shirtS);
      r(a - 1, 45, 6, 2, C.glove); r(b - 1, 45, 6, 2, C.glove);
      r(a - 1, 47, 6, 1, C.sole); r(b - 1, 47, 6, 1, C.sole);
      r(a, 46, 3, 1, C.text); r(b + 1, 46, 3, 1, C.text);
    }

    // Short con el 9
    r(8, 32, 16, 5, C.shirt); r(8, 37, 7, 2, C.shirt); r(17, 37, 7, 2, C.shirt);
    r(8, 32, 16, 1, C.shirtS); r(15, 35, 2, 2, C.shirtS);
    glyph(g, GLYPHS['9'], 19, 33, C.text);

    // Torso
    r(8, 18, 16, 14, C.shirt);
    r(8, 18, 1, 14, C.shirtS); r(23, 18, 1, 14, C.shirtS);
    r(6, 18, 3, 4, C.shirt); r(23, 18, 3, 4, C.shirt);
    r(6, 18, 3, 1, C.pad); r(23, 18, 3, 1, C.pad);
    r(12, 18, 8, 1, C.shirtS); r(14, 19, 4, 1, C.shirtS);
    text(g, 'NICO', 9, 20, C.text);
    glyph(g, BIG9, 13, 25, C.text);

    // Brazos según pose
    if (pose === 'up' || pose === 'slide') {
      r(3, 7, 4, 13, C.shirt); r(25, 7, 4, 13, C.shirt);
      r(3, 10, 4, 3, C.pad); r(25, 10, 4, 3, C.pad);
      r(3, 7, 1, 13, C.shirtS); r(28, 7, 1, 13, C.shirtS);
      glove(2, 1, 6, 6); glove(24, 1, 6, 6);
    } else if (pose === 'hold') {
      r(4, 19, 4, 6, C.shirt); r(24, 19, 4, 6, C.shirt);
      r(4, 19, 1, 6, C.shirtS); r(27, 19, 1, 6, C.shirtS);
      r(6, 24, 4, 4, C.shirt); r(22, 24, 4, 4, C.shirt);
      drawMap(g, BALL, 12, 25, BALL_PAL);
      glove(8, 26, 4, 6); glove(21, 26, 4, 6);
    } else if (pose === 'shake' || pose === 'shake2') {
      // Brazo derecho (lado derecho de la imagen) estirado para dar la mano
      const dy = pose === 'shake2' ? 1 : 0;
      r(3, 19, 4, 10, C.shirt); r(3, 22, 4, 3, C.pad); r(3, 19, 1, 10, C.shirtS);
      glove(2, 29, 6, 5);
      r(24, 19, 4, 4, C.shirt);
      r(26, 22 + dy, 4, 4, C.shirt);
      glove(28, 24 + dy, 4, 4);
    } else if (pose === 'pose') {
      // Foto de futbolista: pulgar arriba con una mano; la otra abraza al tío (queda detrás de él)
      r(3, 18, 4, 8, C.shirt); r(3, 18, 1, 8, C.shirtS);
      glove(2, 13, 5, 5);
      r(3, 10, 2, 3, C.glove);
      r(24, 19, 3, 6, C.shirt);
    } else if (pose === 'siu') {
      // Celebración CR7: brazos abiertos hacia abajo
      r(4, 19, 4, 5, C.shirt); r(2, 23, 4, 5, C.shirt); r(2, 23, 1, 5, C.shirtS);
      glove(0, 27, 5, 5);
      r(24, 19, 4, 5, C.shirt); r(26, 23, 4, 5, C.shirt); r(29, 23, 1, 5, C.shirtS);
      glove(27, 27, 5, 5);
    } else if (pose === 'open') {
      // Manos abiertas a la altura del pecho (para hacer malabares con el balón)
      r(4, 19, 4, 6, C.shirt); r(24, 19, 4, 6, C.shirt);
      r(4, 19, 1, 6, C.shirtS); r(27, 19, 1, 6, C.shirtS);
      r(5, 24, 4, 3, C.shirt); r(23, 24, 4, 3, C.shirt);
      glove(5, 26, 5, 4); glove(22, 26, 5, 4);
    } else { // idle / listo
      r(3, 19, 4, 10, C.shirt); r(25, 19, 4, 10, C.shirt);
      r(3, 22, 4, 3, C.pad); r(25, 22, 4, 3, C.pad);
      r(3, 19, 1, 10, C.shirtS); r(28, 19, 1, 10, C.shirtS);
      glove(2, 29, 6, 5); glove(24, 29, 6, 5);
    }

    // Cuello
    r(13, 16, 6, 2, C.skin); r(13, 17, 6, 1, C.skinS);

    // Cabeza
    r(9, 4, 14, 11, C.skin); r(10, 15, 12, 1, C.skin);
    r(7, 8, 2, 4, C.skin); r(23, 8, 2, 4, C.skin);
    r(8, 9, 1, 2, C.skinS); r(23, 9, 1, 2, C.skinS);

    // Pelo castaño con chasquilla
    r(9, 0, 14, 2, C.hair); r(8, 1, 16, 3, C.hair); r(7, 3, 18, 2, C.hair);
    r(8, 5, 1, 4, C.hair); r(23, 5, 1, 3, C.hair);
    r(9, 5, 10, 1, C.hair); r(9, 6, 5, 1, C.hair); r(19, 5, 3, 1, C.hair);
    r(12, 1, 6, 1, C.hairL); r(10, 3, 4, 1, C.hairL);

    // Cejas
    r(11, 7, 3, 1, C.brow); r(18, 7, 3, 1, C.brow);

    // Ojos
    if (eyes === 'closed') {
      r(11, 10, 3, 1, C.eye); r(18, 10, 3, 1, C.eye);
    } else if (eyes === 'wide') {
      // ojos de sorpresa
      r(11, 7, 3, 4, C.eyeW); r(18, 7, 3, 4, C.eyeW);
      r(12, 8, 1, 2, C.eye); r(19, 8, 1, 2, C.eye);
    } else if (eyes === 'happy') {
      // ojos felices ^ ^
      r(11, 9, 1, 1, C.eye); r(12, 8, 1, 1, C.eye); r(13, 9, 1, 1, C.eye);
      r(18, 9, 1, 1, C.eye); r(19, 8, 1, 1, C.eye); r(20, 9, 1, 1, C.eye);
    } else if (eyes === 'down') {
      r(11, 9, 3, 2, C.eyeW); r(18, 9, 3, 2, C.eyeW);
      r(12, 10, 2, 1, C.eye); r(18, 10, 2, 1, C.eye);
    } else {
      r(11, 8, 3, 3, C.eyeW); r(18, 8, 3, 3, C.eyeW);
      r(12, 8, 2, 3, C.eye); r(18, 8, 2, 3, C.eye);
      r(12, 8, 1, 1, '#ffffff'); r(18, 8, 1, 1, '#ffffff');
    }

    // Nariz y mejillas
    r(15, 11, 2, 1, C.skinS);
    r(10, 12, 2, 1, C.blush); r(20, 12, 2, 1, C.blush);

    // Boca
    if (mouth === 'open') {
      r(14, 12, 4, 3, C.mouthIn); r(15, 14, 2, 1, C.tongue);
    } else if (mouth === 'frown') {
      r(14, 13, 4, 1, C.mouth); r(13, 14, 1, 1, C.mouth); r(18, 14, 1, 1, C.mouth);
    } else if (mouth === 'grin') {
      // sonrisa grande de emoción, con dientes
      r(12, 11, 1, 1, C.mouth); r(19, 11, 1, 1, C.mouth);
      r(13, 12, 6, 2, C.mouthIn); r(13, 12, 6, 1, '#ffffff');
      r(14, 14, 4, 1, C.mouthIn); r(15, 14, 2, 1, C.tongue);
    } else if (mouth === 'wow') {
      r(14, 12, 4, 3, C.mouthIn); r(15, 12, 2, 1, C.mouth);
    } else if (mouth === 'o') {
      r(15, 12, 2, 2, C.mouthIn);
    } else {
      r(13, 12, 1, 1, C.mouth); r(18, 12, 1, 1, C.mouth); r(14, 13, 4, 1, C.mouth);
    }

    if (kneel) {
      g.restore();
      r(9, 46, 6, 2, C.skin); r(17, 46, 6, 2, C.skin); // rodillas en el pasto
    }
  }

  /* ---------- Jugadores ganadores (niño / niña) con uniforme de fútbol ---------- */
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const ch = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
    return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => ch(v).toString(16).padStart(2, '0')).join('');
  }

  // o = { id, gender:'boy'|'girl', skin, hair, kit:{shirt, trim, shorts, socks} }
  function drawKidRaw(g, o, pose, mouth, eyes) {
    const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const k = o.kit, skinS = shade(o.skin, 0.86), shirtS = shade(k.shirt, 0.78);

    // Piernas, medias y guayos negros
    r(10, 39, 4, 2, o.skin); r(18, 39, 4, 2, o.skin);
    r(10, 41, 4, 4, k.socks); r(18, 41, 4, 4, k.socks);
    r(10, 41, 4, 1, '#ffffff'); r(18, 41, 4, 1, '#ffffff');
    r(9, 45, 6, 2, '#1b1b22'); r(17, 45, 6, 2, '#1b1b22');
    r(9, 47, 6, 1, '#6a6a76'); r(17, 47, 6, 1, '#6a6a76');

    // Pantaloneta
    r(8, 32, 16, 5, k.shorts); r(8, 37, 7, 2, k.shorts); r(17, 37, 7, 2, k.shorts);
    r(8, 32, 16, 1, shade(k.shorts, 0.8));

    // Camiseta con franja central
    r(8, 18, 16, 14, k.shirt);
    r(8, 18, 1, 14, shirtS); r(23, 18, 1, 14, shirtS);
    r(6, 18, 3, 4, k.shirt); r(23, 18, 3, 4, k.shirt);
    r(15, 19, 2, 13, k.trim); r(12, 18, 8, 1, k.trim);

    // Brazos (manga corta)
    if (pose === 'up') {
      r(4, 14, 4, 6, k.shirt); r(24, 14, 4, 6, k.shirt);
      r(4, 5, 4, 9, o.skin); r(24, 5, 4, 9, o.skin);
      r(4, 2, 4, 3, o.skin); r(24, 2, 4, 3, o.skin);
    } else if (pose === 'open') {
      r(4, 19, 4, 4, k.shirt); r(24, 19, 4, 4, k.shirt);
      r(5, 23, 4, 3, o.skin); r(23, 23, 4, 3, o.skin);
      r(6, 25, 4, 3, o.skin); r(22, 25, 4, 3, o.skin);
    } else if (pose === 'siu') {
      r(4, 19, 4, 4, k.shirt); r(24, 19, 4, 4, k.shirt);
      r(2, 23, 4, 4, o.skin); r(26, 23, 4, 4, o.skin);
      r(0, 27, 4, 4, o.skin); r(28, 27, 4, 4, o.skin);
    } else {
      r(4, 19, 4, 4, k.shirt); r(24, 19, 4, 4, k.shirt);
      r(4, 23, 4, 7, o.skin); r(24, 23, 4, 7, o.skin);
      r(4, 30, 4, 2, skinS); r(24, 30, 4, 2, skinS);
    }

    // Cuello
    r(13, 16, 6, 2, o.skin); r(13, 17, 6, 1, skinS);

    const girl = o.gender === 'girl';
    if (girl) r(8, 3, 16, 13, o.hair); // pelo largo por detrás

    // Cara
    r(9, 4, 14, 11, o.skin); r(10, 15, 12, 1, o.skin);
    if (!girl) { r(7, 8, 2, 4, o.skin); r(23, 8, 2, 4, o.skin); r(8, 9, 1, 2, skinS); r(23, 9, 1, 2, skinS); }

    // Pelo
    const hairL = shade(o.hair, 1.35);
    r(9, 0, 14, 2, o.hair); r(8, 1, 16, 3, o.hair); r(7, 3, 18, 2, o.hair);
    if (girl) {
      r(9, 5, 14, 1, o.hair); r(9, 6, 3, 1, o.hair); r(20, 6, 3, 1, o.hair);
      r(7, 5, 2, 14, o.hair); r(23, 5, 2, 14, o.hair);   // mechones sobre los hombros
      r(20, 0, 4, 2, '#ff5fa2'); r(21, 2, 2, 1, '#ff5fa2'); // moño
    } else {
      r(8, 5, 1, 4, o.hair); r(23, 5, 1, 3, o.hair);
      r(9, 5, 10, 1, o.hair); r(9, 6, 5, 1, o.hair); r(19, 5, 3, 1, o.hair);
    }
    r(12, 1, 6, 1, hairL);

    // Cara: cejas, ojos, nariz, mejillas, boca
    r(11, 7, 3, 1, shade(o.hair, 0.9)); r(18, 7, 3, 1, shade(o.hair, 0.9));
    if (eyes === 'happy') {
      r(11, 9, 1, 1, C.eye); r(12, 8, 1, 1, C.eye); r(13, 9, 1, 1, C.eye);
      r(18, 9, 1, 1, C.eye); r(19, 8, 1, 1, C.eye); r(20, 9, 1, 1, C.eye);
    } else {
      r(11, 8, 3, 3, C.eyeW); r(18, 8, 3, 3, C.eyeW);
      r(12, 8, 2, 3, C.eye); r(18, 8, 2, 3, C.eye);
      r(12, 8, 1, 1, '#ffffff'); r(18, 8, 1, 1, '#ffffff');
      if (girl) { r(10, 8, 1, 1, C.eye); r(21, 8, 1, 1, C.eye); }
    }
    r(15, 11, 2, 1, skinS);
    r(10, 12, 2, 1, C.blush); r(20, 12, 2, 1, C.blush);
    if (mouth === 'open') {
      r(14, 12, 4, 3, C.mouthIn); r(15, 14, 2, 1, C.tongue);
    } else {
      r(12, 11, 1, 1, C.mouth); r(19, 11, 1, 1, C.mouth);
      r(13, 12, 6, 2, C.mouthIn); r(13, 12, 6, 1, '#ffffff');
    }
  }

  function kid(o, pose = 'idle', mouth = 'grin', eyes = 'open') {
    const key = 'kid|' + o.id + '|' + pose + '|' + mouth + '|' + eyes;
    if (!cache[key]) {
      const c = mk(32, 48);
      drawKidRaw(c.getContext('2d'), o, pose, mouth, eyes);
      cache[key] = outline(c, C.outline);
    }
    return cache[key];
  }

  /* ---------- Trofeo ---------- */
  const TROPHY = [
    'Y.YYYYYY.Y',
    'Y.YWYYYY.Y',
    'YYYWYYYYYY',
    '.YYWYYYYY.',
    '..YYYYYY..',
    '...YYYY...',
    '....YY....',
    '....YY....',
    '...YYYY...',
    '..BBBBBB..',
    '..BBBBBB..',
  ];
  function trophy() {
    if (!cache.trophy) {
      const c = mk(10, 11);
      drawMap(c.getContext('2d'), TROPHY, 0, 0, { Y: '#ffcf3a', W: '#fff3b0', B: '#8a5418' });
      cache.trophy = outline(c, C.outline);
    }
    return cache.trophy;
  }

  /* ---------- Árbitro ---------- */
  const R = {
    hair: '#1a1410', skin: '#e0a77d', skinS: '#c48a62',
    shirt: '#1d1d26', shirtL: '#3a3a48', white: '#f5f5f2',
    eye: '#1a1410', mouth: '#8a3b2c', badge: '#ffd23f', shoe: '#0d0d12', sole: '#5a5a66',
  };
  const CARD = { yellow: '#ffd23f', red: '#e63946' };

  function drawRefRaw(g, pose, frame, card) {
    const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

    // Piernas (al correr, una se levanta)
    const lifts = pose === 'run' ? (frame ? [0, 2] : [2, 0]) : [0, 0];
    [10, 18].forEach((x, i) => {
      const L = lifts[i];
      r(x, 38 - L, 4, 2, R.skin);
      r(x, 40 - L, 4, 4, R.shirt);
      r(x, 40 - L, 4, 1, R.white);
      r(x - 1, 44 - L, 6, 3, R.shoe);
      r(x - 1, 46 - L, 6, 1, R.sole);
    });

    // Short
    r(8, 32, 16, 4, R.shirt); r(8, 36, 7, 2, R.shirt); r(17, 36, 7, 2, R.shirt);

    // Camiseta negra con cuello blanco e insignia
    r(8, 18, 16, 14, R.shirt);
    r(8, 18, 1, 14, R.shirtL); r(23, 18, 1, 14, R.shirtL);
    r(6, 18, 3, 3, R.shirt); r(23, 18, 3, 3, R.shirt);
    r(12, 18, 8, 2, R.white); r(15, 20, 2, 1, R.white);
    r(18, 22, 3, 3, R.badge);
    r(8, 31, 16, 1, R.shirtL);

    // Brazos
    if (pose === 'card') {
      r(4, 19, 4, 5, R.shirt); r(4, 24, 4, 6, R.skin); r(4, 30, 4, 2, R.skinS);
      r(25, 15, 4, 5, R.shirt);
      r(26, 9, 3, 6, R.skin);
      r(25, 0, 6, 8, CARD[card] || CARD.yellow);
      r(25, 0, 6, 1, 'rgba(255,255,255,.5)');
      r(25, 6, 4, 3, R.skin);
    } else {
      const a = frame ? 3 : 0, b = frame ? 0 : 3;
      r(4, 19, 4, 5, R.shirt); r(4, 24, 4, 4 + a, R.skin);
      r(24, 19, 4, 5, R.shirt); r(24, 24, 4, 4 + b, R.skin);
    }

    // Cuello y cabeza
    r(13, 16, 6, 2, R.skin);
    r(9, 4, 14, 11, R.skin); r(10, 15, 12, 1, R.skin);
    r(7, 8, 2, 4, R.skin); r(23, 8, 2, 4, R.skin);
    r(9, 1, 14, 2, R.hair); r(8, 2, 16, 3, R.hair); r(8, 5, 1, 3, R.hair); r(23, 5, 1, 3, R.hair);
    // Cejas serias, ojos, nariz, bigote
    r(11, 7, 3, 1, R.hair); r(18, 7, 3, 1, R.hair);
    r(13, 8, 2, 1, R.hair); r(17, 8, 2, 1, R.hair);
    r(12, 9, 2, 2, R.eye); r(18, 9, 2, 2, R.eye);
    r(15, 10, 2, 2, R.skinS);
    r(12, 12, 8, 1, R.hair); r(13, 13, 6, 1, R.hair);
    r(14, 14, 4, 1, R.mouth);
  }

  /* ---------- Tío Pipe (adulto, 32x60): pelo corto, camisa azul clara, jean y botas cafés ---------- */
  const U = {
    hair: '#3a2416', hairL: '#5e3b22',
    skin: '#efbf98', skinS: '#d6976f', stub: '#d9a684',
    shirt: '#a9d2f2', shirtS: '#7fb0da', button: '#ffffff',
    jean: '#3b5b8c', jeanS: '#2c4670', belt: '#4a2c14', buckle: '#d9b45a',
    boot: '#7a4a24', bootS: '#4f2f14',
  };

  function drawUncleRaw(g, pose, mouth, eyes) {
    const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const apart = pose === 'siu';

    // Jean y botas
    r(8, 38, 16, 4, U.jean);
    const [la, lb] = apart ? [6, 19] : [8, 17];
    r(la, 42, 7, 12, U.jean); r(lb, 42, 7, 12, U.jean);
    r(la + 3, 42, 1, 12, U.jeanS); r(lb + 3, 42, 1, 12, U.jeanS);
    r(la - 1, 54, 8, 5, U.boot); r(lb, 54, 8, 5, U.boot);
    r(la - 1, 59, 8, 1, U.bootS); r(lb, 59, 8, 1, U.bootS);
    r(la - 1, 55, 8, 1, U.bootS); r(lb, 55, 8, 1, U.bootS);

    // Camisa azul clara con botones y cinturón
    r(7, 19, 18, 18, U.shirt);
    r(7, 19, 1, 18, U.shirtS); r(24, 19, 1, 18, U.shirtS);
    r(5, 19, 3, 4, U.shirt); r(24, 19, 3, 4, U.shirt);
    r(11, 19, 4, 2, U.shirtS); r(17, 19, 4, 2, U.shirtS);
    r(15, 19, 2, 3, U.skin);
    for (let y = 24; y < 36; y += 4) r(15, y, 2, 1, U.button);
    r(16, 22, 1, 15, U.shirtS);
    r(7, 37, 18, 1, U.belt); r(15, 37, 2, 1, U.buckle);

    // Brazos
    const arm = (x, y, w, h) => { r(x, y, w, h, U.shirt); };
    if (pose === 'shake' || pose === 'shake2') {
      const dy = pose === 'shake2' ? 1 : 0;
      // brazo bajando en diagonal hasta la altura de la mano de Nico
      arm(3, 20, 4, 5); arm(1, 24, 4, 6); arm(0, 29 + dy, 3, 6);
      r(0, 35 + dy, 3, 3, U.skin);
      arm(25, 20, 4, 15); r(28, 20, 1, 15, U.shirtS); r(25, 35, 4, 3, U.skin);
    } else if (pose === 'siu') {
      arm(4, 20, 4, 6); arm(2, 25, 4, 6); arm(0, 30, 4, 4); r(0, 34, 3, 3, U.skin);
      arm(24, 20, 4, 6); arm(26, 25, 4, 6); arm(28, 30, 4, 4); r(29, 34, 3, 3, U.skin);
    } else if (pose === 'pose') {
      // Brazo izquierdo se dibuja aparte (abrazando a Nico por detrás); el derecho hace "amor y paz" ✌
      arm(25, 14, 4, 8); r(28, 14, 1, 8, U.shirtS);
      r(25, 9, 5, 5, U.skin);                    // palma
      r(26, 12, 3, 1, U.skinS);                  // dedos doblados
      // dos dedos en V (separados arriba para que se lea la "V")
      r(24, 1, 2, 4, U.skin); r(25, 5, 2, 4, U.skin);
      r(29, 1, 2, 4, U.skin); r(28, 5, 2, 4, U.skin);
    } else if (pose === 'jump') {
      arm(3, 7, 4, 14); arm(25, 7, 4, 14);
      r(3, 4, 4, 3, U.skin); r(25, 4, 4, 3, U.skin);
    } else {
      arm(3, 20, 4, 15); r(3, 20, 1, 15, U.shirtS); r(3, 35, 4, 3, U.skin);
      arm(25, 20, 4, 15); r(28, 20, 1, 15, U.shirtS); r(25, 35, 4, 3, U.skin);
    }

    // Cuello y cabeza (se parece a Nico, pero más grande y con pelo corto)
    r(13, 17, 6, 2, U.skin); r(13, 18, 6, 1, U.skinS);
    r(9, 3, 14, 13, U.skin); r(10, 16, 12, 1, U.skin);
    r(7, 8, 2, 4, U.skin); r(23, 8, 2, 4, U.skin);
    r(8, 9, 1, 2, U.skinS); r(23, 9, 1, 2, U.skinS);
    r(10, 13, 12, 3, U.stub); r(11, 16, 10, 1, U.stub); // barba de pocos días
    r(9, 0, 14, 2, U.hair); r(8, 1, 16, 3, U.hair); r(8, 4, 1, 3, U.hair); r(23, 4, 1, 3, U.hair);
    r(9, 4, 6, 1, U.hair); r(12, 1, 6, 1, U.hairL);
    r(11, 7, 3, 1, U.hair); r(18, 7, 3, 1, U.hair);
    if (eyes === 'happy') {
      r(11, 10, 1, 1, C.eye); r(12, 9, 1, 1, C.eye); r(13, 10, 1, 1, C.eye);
      r(18, 10, 1, 1, C.eye); r(19, 9, 1, 1, C.eye); r(20, 10, 1, 1, C.eye);
    } else {
      r(11, 9, 3, 2, C.eyeW); r(18, 9, 3, 2, C.eyeW);
      r(12, 9, 2, 2, C.eye); r(18, 9, 2, 2, C.eye);
    }
    r(15, 11, 2, 2, U.skinS);
    if (mouth === 'open') {
      r(13, 13, 6, 3, C.mouthIn); r(13, 13, 6, 1, '#ffffff'); r(15, 15, 2, 1, C.tongue);
    } else if (mouth === 'grin') {
      r(12, 13, 1, 1, C.mouth); r(19, 13, 1, 1, C.mouth);
      r(13, 14, 6, 1, '#ffffff'); r(13, 15, 6, 1, C.mouthIn);
    } else {
      r(13, 13, 1, 1, C.mouth); r(18, 13, 1, 1, C.mouth); r(14, 14, 4, 1, C.mouth);
    }
  }

  function uncle(pose = 'stand', mouth = 'smile', eyes = 'open') {
    const key = 'uncle|' + pose + '|' + mouth + '|' + eyes;
    if (!cache[key]) {
      const c = mk(32, 60);
      drawUncleRaw(c.getContext('2d'), pose, mouth, eyes);
      cache[key] = outline(c, C.outline);
    }
    return cache[key];
  }

  function referee(pose = 'run', frame = 0, card = 'yellow') {
    const key = 'ref|' + pose + '|' + frame + '|' + card;
    if (!cache[key]) {
      const c = mk(32, 48);
      drawRefRaw(c.getContext('2d'), pose, frame, card);
      cache[key] = outline(c, C.outline);
    }
    return cache[key];
  }

  const cache = {};
  // Devuelve un canvas 34x50 (32x48 + contorno)
  function nico(pose = 'idle', mouth = 'smile', eyes = 'open') {
    const key = pose + '|' + mouth + '|' + eyes;
    if (!cache[key]) {
      const c = mk(32, 48);
      drawNicoRaw(c.getContext('2d'), pose, mouth, eyes);
      cache[key] = outline(c, C.outline);
    }
    return cache[key];
  }

  const ballCache = [];
  function ball(frame = 0) {
    if (!ballCache[frame]) {
      const c = mk(9, 9);
      const g = c.getContext('2d');
      if (frame === 1) { g.translate(9, 0); g.scale(-1, 1); }
      drawMap(g, BALL, 0, 0, BALL_PAL);
      ballCache[frame] = c;
    }
    return ballCache[frame];
  }

  /* ---------- Patrón de fondo: balones, guayos, guantes, pitos y tarjetas ---------- */
  const ICONS = {
    ball: { map: BALL, pal: BALL_PAL },
    cleat: {
      map: [
        '....KKKK....',
        '...KWWWWK...',
        '..KWWBWWWKKK',
        '.KWWWBBWWWWK',
        'KWWWWWWWWWWK',
        'KKKKKKKKKKKK',
        '.K.K..K.K...',
      ],
      pal: { K: '#15151d', W: '#f7f7f7', B: '#15151d' },
    },
    glove: {
      map: [
        '..K.K.K...',
        '.KWKWKWK..',
        '.KWKWKWK..',
        '.KWKWKWKK.',
        '.KWWWWWKWK',
        '.KWWWWWWWK',
        '.KWWWWWWK.',
        '.KWWWWWWK.',
        '..KWWWWK..',
        '..KSSSSK..',
        '..KSSSSK..',
        '..KKKKKK..',
      ],
      pal: { K: '#15151d', W: '#f7f7f7', S: '#a9afba' },
    },
    whistle: {
      map: [
        'KK..........',
        'K.K.........',
        '.KKKKKKKKK..',
        'KSSSSSSSSSKK',
        'KSSSKKSSSSSK',
        'KSSSSSSSSKK.',
        '.KKKKKKKK...',
      ],
      pal: { K: '#15151d', S: '#d7dbe3' },
    },
    yellow: {
      map: ['KKKKKK', 'KYYYYK', 'KYYYYK', 'KYYYYK', 'KYYYYK', 'KYYYYK', 'KYYYYK', 'KKKKKK'],
      pal: { K: '#15151d', Y: '#ffd23f' },
    },
    red: {
      map: ['KKKKKK', 'KRRRRK', 'KRRRRK', 'KRRRRK', 'KRRRRK', 'KRRRRK', 'KRRRRK', 'KKKKKK'],
      pal: { K: '#15151d', R: '#e63946' },
    },
  };

  // Genera una baldosa que se repite sin cortes (cada ícono queda dentro de su celda)
  function pattern(tile = 320, cell = 80) {
    const c = mk(tile, tile);
    const g = c.getContext('2d');
    let seed = 2026;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const order = ['ball', 'cleat', 'ball', 'glove', 'whistle', 'ball', 'yellow', 'cleat', 'ball', 'red', 'glove', 'ball', 'whistle', 'yellow', 'ball', 'cleat'];
    g.globalAlpha = 0.16;
    let n = 0;
    for (let cy = 0; cy < tile; cy += cell) {
      for (let cx = 0; cx < tile; cx += cell) {
        const ic = ICONS[order[n++ % order.length]];
        const w = ic.map[0].length, h = ic.map.length;
        const maxS = Math.max(1, Math.floor((cell - 12) / Math.max(w, h)));
        const s = Math.min(maxS, 2 + Math.floor(rnd() * 3)); // tamaños 2x a 4x
        const iw = w * s, ih = h * s;
        const x = cx + 6 + Math.floor(rnd() * (cell - 12 - iw + 1));
        const y = cy + 6 + Math.floor(rnd() * (cell - 12 - ih + 1));
        ic.map.forEach((row, j) => {
          for (let i = 0; i < row.length; i++) {
            const col = ic.pal[row[i]];
            if (col) { g.fillStyle = col; g.fillRect(x + i * s, y + j * s, s, s); }
          }
        });
      }
    }
    return c.toDataURL();
  }

  return { nico, uncle, kid, trophy, referee, ball, text, textWidth, pattern, C };
})();
