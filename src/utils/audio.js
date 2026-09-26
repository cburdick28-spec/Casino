// src/utils/audio.js
// Tiny synth-chime engine built on the Web Audio API. No external media
// assets — every sound is generated on the fly with oscillators + gain
// envelopes, in keeping with the retro-synthwave theme.

let ctx = null;

function getContext() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  // Browsers suspend AudioContext until a user gesture; resume opportunistically.
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

/**
 * Play a single tone with a simple attack/decay envelope.
 * @param {number} freq - frequency in Hz
 * @param {number} duration - seconds
 * @param {object} opts
 */
function tone(freq, duration = 0.15, opts = {}) {
  const audioCtx = getContext();
  if (!audioCtx) return;

  const {
    type = "sine",
    startGain = 0.001,
    peakGain = 0.2,
    delay = 0,
    detune = 0,
  } = opts;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;

  const now = audioCtx.currentTime + delay;
  gain.gain.setValueAtTime(startGain, now);
  gain.gain.exponentialRampToValueAtTime(peakGain, now + duration * 0.15);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.05);
}

/** Bright ascending arpeggio for successful payouts. */
function playPayout() {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((f, i) =>
    tone(f, 0.18, { type: "triangle", peakGain: 0.16, delay: i * 0.06 })
  );
}

/** Harsh two-tone buzzer for a cheater alert. */
function playCheaterAlert() {
  tone(220, 0.22, { type: "sawtooth", peakGain: 0.22 });
  tone(180, 0.28, { type: "sawtooth", peakGain: 0.2, delay: 0.2 });
}

/** Short low buzzer, used for negative/failed actions. */
function playBuzzer() {
  tone(110, 0.35, { type: "square", peakGain: 0.18 });
}

/** Chirpy confirmation for purchases/upgrades. */
function playUpgrade() {
  tone(440, 0.1, { type: "square", peakGain: 0.14 });
  tone(660, 0.12, { type: "square", peakGain: 0.14, delay: 0.09 });
}

/** Mysterious descending synth stab for a random event popping up. */
function playEvent() {
  tone(880, 0.15, { type: "triangle", peakGain: 0.15 });
  tone(660, 0.15, { type: "triangle", peakGain: 0.13, delay: 0.12 });
  tone(440, 0.2, { type: "triangle", peakGain: 0.12, delay: 0.24 });
}

const SOUND_MAP = {
  payout: playPayout,
  cheater_alert: playCheaterAlert,
  buzzer: playBuzzer,
  upgrade: playUpgrade,
  event: playEvent,
};

/**
 * Play a named sound effect. Safe to call from anywhere — no-ops silently
 * if the Web Audio API is unavailable (SSR, older browsers, muted tab, etc).
 * @param {string} name - one of SOUND map keys from utils/gameData.js
 */
export function playSound(name) {
  try {
    const fn = SOUND_MAP[name];
    if (fn) fn();
  } catch (err) {
    // Audio is decorative — never let it break the sim.
    console.warn("[audio] failed to play sound:", name, err);
  }
}

/** Call once from a user gesture (e.g. first click) to unlock audio on iOS/Safari. */
export function unlockAudio() {
  const audioCtx = getContext();
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
}
