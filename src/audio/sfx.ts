/**
 * Chiptune sound effects synthesised with WebAudio: no audio files, tiny footprint.
 * The context is created on the first user gesture (browsers require that).
 */

interface ToneOptions {
  freq: number;
  /** Glide to this frequency. */
  to?: number;
  dur?: number;
  type?: OscillatorType;
  vol?: number;
  delay?: number;
}

interface NoiseOptions {
  dur?: number;
  vol?: number;
  freq?: number;
  q?: number;
  delay?: number;
  type?: BiquadFilterType;
}

let ctx: AudioContext | null = null;

let master: GainNode | null = null;

let noiseBuffer: AudioBuffer | null = null;

let enabled = true;

let calm = false;

export function configureAudio({ sound, calmMode }: { sound: boolean; calmMode: boolean }): void {
  enabled = sound;
  calm = calmMode;
  if (master) master.gain.value = calm ? 0.12 : 0.22;
}

export function unlockAudio(): void {
  if (!enabled) return;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = calm ? 0.12 : 0.22;
      master.connect(ctx.destination);
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    ctx = null;
  }
}

// tone() and noise() only run from play(), once the context is running.
function tone({ freq, to, dur = 0.12, type = 'square', vol = 0.5, delay = 0 }: ToneOptions): void {
  const ctx = running();
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(master!);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise({ dur = 0.3, vol = 0.3, freq = 800, q = 0.7, delay = 0, type = 'bandpass' }: NoiseOptions): void {
  const ctx = running();
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.15, dur / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(master!);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

const SOUNDS = {
  blip: () => tone({ freq: 660, dur: 0.05, vol: 0.2 }),
  select: () => {
    tone({ freq: 523, dur: 0.06, vol: 0.25 });
    tone({ freq: 784, dur: 0.08, vol: 0.25, delay: 0.05 });
  },
  back: () => tone({ freq: 392, to: 294, dur: 0.1, vol: 0.2 }),
  whistle: () => {
    tone({ freq: 2200, dur: 0.16, type: 'sine', vol: 0.3 });
    tone({ freq: 2200, dur: 0.32, type: 'sine', vol: 0.3, delay: 0.22 });
  },
  kick: () => {
    tone({ freq: 150, to: 45, dur: 0.16, type: 'sine', vol: 0.9 });
    noise({ dur: 0.06, vol: 0.25, freq: 2400, type: 'highpass' });
  },
  goal: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.14, vol: 0.3, delay: i * 0.08 }));
    noise({ dur: 1.4, vol: calm ? 0.12 : 0.28, freq: 900, q: 0.4 });
  },
  concede: () => {
    noise({ dur: 1.1, vol: calm ? 0.08 : 0.18, freq: 700, q: 0.4 });
    tone({ freq: 330, dur: 0.12, vol: 0.2, delay: 0.1 });
  },
  save: () => {
    tone({ freq: 880, dur: 0.07, vol: 0.3 });
    tone({ freq: 1175, dur: 0.12, vol: 0.3, delay: 0.07 });
    noise({ dur: 0.9, vol: calm ? 0.1 : 0.22, freq: 1100, q: 0.5 });
  },
  groan: () => {
    tone({ freq: 392, to: 262, dur: 0.35, type: 'triangle', vol: 0.35 });
    noise({ dur: 0.7, vol: calm ? 0.06 : 0.12, freq: 400, q: 0.5 });
  },
  post: () => {
    tone({ freq: 1568, dur: 0.3, type: 'triangle', vol: 0.35 });
    tone({ freq: 2349, dur: 0.2, type: 'sine', vol: 0.15 });
  },
  win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.16, vol: 0.3, delay: i * 0.11 })),
  lose: () => [392, 349, 311, 262].forEach((f, i) => tone({ freq: f, dur: 0.22, type: 'triangle', vol: 0.3, delay: i * 0.16 })),
  tick: () => tone({ freq: 1200, dur: 0.03, vol: 0.12 }),
};

export function play(name: SoundName): void {
  if (!enabled || !ctx || ctx.state !== 'running') return;
  try {
    SOUNDS[name]?.();
  } catch {
    /* audio is decoration; never let it break the game */
  }
}

export type SoundName = keyof typeof SOUNDS;

function running(): AudioContext {
  return ctx as AudioContext;
}
