/* =========================================================
   Sonidos 8-bit generados con Web Audio (sin archivos).
   ========================================================= */
const Sfx = (() => {
  'use strict';
  let ac = null, master = null, noiseBuf = null;
  let muted = false;
  try { muted = localStorage.getItem('nico9.muted') === '1'; } catch (e) { /* sin storage */ }

  function unlock() {
    try {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac = new AC();
        master = ac.createGain();
        master.gain.value = muted ? 0 : 0.6;
        master.connect(ac.destination);
      }
      if (ac.state === 'suspended') ac.resume();
    } catch (e) { /* audio no disponible */ }
  }

  const ok = () => ac && ac.state === 'running' && !muted;

  function tone(f, d, { type = 'square', v = 0.1, at = 0, to = null } = {}) {
    if (!ok()) return;
    const t = ac.currentTime + at;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + d + 0.02);
  }

  function noise(d, { v = 0.2, at = 0, freq = 1200, q = 1 } = {}) {
    if (!ok()) return;
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const ch = noiseBuf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    }
    const t = ac.currentTime + at;
    const s = ac.createBufferSource();
    s.buffer = noiseBuf; s.loop = true;
    const f = ac.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + d + 0.02);
  }

  function whistle(d = 0.35, at = 0) {
    if (!ok()) return;
    const t = ac.currentTime + at;
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = 2900;
    const lfo = ac.createOscillator(); lfo.frequency.value = 28;
    const lg = ac.createGain(); lg.gain.value = 180;
    lfo.connect(lg); lg.connect(o.frequency);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    g.gain.setValueAtTime(0.12, t + d - 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(master);
    o.start(t); lfo.start(t); o.stop(t + d + 0.02); lfo.stop(t + d + 0.02);
  }

  return {
    unlock,
    blip: () => tone(990, 0.03, { v: 0.035 }),
    move: () => tone(660, 0.04, { v: 0.05 }),
    beep: () => tone(523, 0.12, { v: 0.08 }),
    kick: () => { noise(0.09, { v: 0.35, freq: 900 }); tone(160, 0.1, { type: 'triangle', v: 0.25, to: 60 }); },
    goal: () => {
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.13, { v: 0.08, at: i * 0.09 }));
      noise(1.4, { v: 0.12, freq: 700, q: 0.5, at: 0.05 });
    },
    save: () => {
      noise(0.06, { v: 0.25, freq: 400 });
      tone(392, 0.12, { v: 0.08, at: 0.05, to: 300 });
      tone(262, 0.25, { v: 0.08, at: 0.17, to: 180 });
    },
    tick: () => tone(1320, 0.05, { v: 0.06 }),
    whistle: () => whistle(0.35),
    whistleEnd: () => { whistle(0.25); whistle(0.25, 0.35); whistle(0.7, 0.7); },
    toggle() {
      muted = !muted;
      try { localStorage.setItem('nico9.muted', muted ? '1' : '0'); } catch (e) { /* */ }
      if (master) master.gain.value = muted ? 0 : 0.6;
      return muted;
    },
    get muted() { return muted; },
  };
})();
