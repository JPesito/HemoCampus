// src/lib/sfx.js
// --- Motor de SFX sin assets para HemoCampus ---
// - playToggle(true/false): “añadir” (pip) / “quitar” (pop) más naturales
// - Sonidos arcade: playStart, playScore, playComboUp, playLoseLife, playGameOver
// - Control: setSfxEnabled, setSfxVolume

let _ctx;
let _master;
let _enabled = true;

function ctx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
    _master = _ctx.createGain();
    _master.gain.value = 0.7; // volumen global por defecto
    _master.connect(_ctx.destination);
  }
  // En algunos navegadores, el contexto puede estar suspendido
  if (_ctx.state === "suspended") {
    _ctx.resume().catch(() => {});
  }
  return _ctx;
}

export function setSfxEnabled(on = true) {
  _enabled = !!on;
}
export function setSfxVolume(v = 0.7) {
  const c = ctx();
  const val = Math.max(0, Math.min(1, Number(v)));
  _master.gain.setTargetAtTime(val, c.currentTime, 0.01);
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function makePan() {
  const c = ctx();
  if (typeof c.createStereoPanner === "function") {
    const p = c.createStereoPanner();
    p.pan.value = randRange(-0.15, 0.15);
    return p;
  }
  // Fallback si no hay StereoPannerNode
  return c.createGain();
}

function envAD(g, t0, a = 0.01, d = 0.15, peak = 0.22) {
  g.gain.cancelScheduledValues(t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
}

function osc({ type = "sine", f0 = 440, f1 = null, dur = 0.15, gain = 0.2, t = ctx().currentTime }) {
  const c = ctx();
  const o = c.createOscillator();
  const g = c.createGain();
  const pan = makePan();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 && f1 > 0) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.9);
  envAD(g, t, Math.min(0.02, dur * 0.25), dur, gain);
  o.connect(g).connect(pan).connect(_master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noiseBurst({ dur = 0.12, type = "bandpass", freq = 2000, q = 6, gain = 0.08, t = ctx().currentTime }) {
  const c = ctx();
  const len = Math.ceil(dur * c.sampleRate);
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  // ruido blanco
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buffer;

  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(freq, t);
  filter.Q.setValueAtTime(q, t);

  const g = c.createGain();
  const pan = makePan();
  envAD(g, t, 0.005, dur * 0.95, gain);

  src.connect(filter).connect(g).connect(pan).connect(_master);
  src.start(t);
  src.stop(t + dur + 0.02);
}

/** Sonido al alternar reactivo: “pip” (añadir) / “pop” (quitar) */
export function playToggle(on = true) {
  if (!_enabled) return;
  try {
    const c = ctx();
    const now = c.currentTime + 0.001;

    if (on) {
      // “Pip” de pipeta: subida breve + chispa brillante
      const detune = randRange(0.97, 1.03);
      const base = 520 * detune;

      osc({ type: "triangle", f0: base, f1: base * 1.9, dur: 0.16, gain: 0.14, t: now });
      osc({ type: "sine",     f0: base * 2.2, f1: base * 1.9, dur: 0.10, gain: 0.10, t: now + 0.03 });
      noiseBurst({ dur: 0.08, type: "bandpass", freq: 2600, q: 7, gain: 0.05, t: now + 0.01 });
    } else {
      // “Pop”/aspirar: caída suave + soplido grave
      const detune = randRange(0.96, 1.02);
      const base = 340 * detune;

      osc({ type: "sawtooth", f0: base * 1.1, f1: base * 0.55, dur: 0.18, gain: 0.12, t: now });
      osc({ type: "sine",     f0: 140,        f1: 120,         dur: 0.16, gain: 0.10, t: now + 0.02 });
      noiseBurst({ dur: 0.12, type: "bandpass", freq: 600, q: 4.5, gain: 0.06, t: now + 0.01 });
    }
  } catch {
    // ignorar si el navegador bloquea audio
  }
}

/* ---------- Sonidos modo Arcade ---------- */

function toneSimple({ f0, f1 = null, dur = 0.12, type = "sine", gain = 0.14, delay = 0 }) {
  try {
    const c = ctx();
    const t = c.currentTime + 0.01 + (delay || 0);
    osc({ type, f0, f1, dur, gain, t });
  } catch {}
}

export function playStart() {
  if (!_enabled) return;
  toneSimple({ type: "triangle", f0: 440, f1: 660, dur: 0.12, gain: 0.14, delay: 0.00 });
  toneSimple({ type: "triangle", f0: 660, f1: 880, dur: 0.12, gain: 0.12, delay: 0.10 });
}

export function playScore() {
  if (!_enabled) return;
  toneSimple({ type: "sine", f0: 800, f1: 1200, dur: 0.12, gain: 0.16 });
}

export function playComboUp() {
  if (!_enabled) return;
  toneSimple({ type: "triangle", f0: 600, f1: 900, dur: 0.09, gain: 0.12, delay: 0.00 });
  toneSimple({ type: "triangle", f0: 900, f1: 1200, dur: 0.09, gain: 0.10, delay: 0.08 });
}

export function playLoseLife() {
  if (!_enabled) return;
  toneSimple({ type: "sawtooth", f0: 220, f1: 160, dur: 0.18, gain: 0.14 });
}

export function playGameOver() {
  if (!_enabled) return;
  toneSimple({ type: "sawtooth", f0: 200, f1: 150, dur: 0.25, gain: 0.16, delay: 0.00 });
  toneSimple({ type: "sine",     f0: 150, f1: 120, dur: 0.20, gain: 0.12, delay: 0.20 });
}
