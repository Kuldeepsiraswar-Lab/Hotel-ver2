// Web Audio API Synthesizer for Restaurant Order Alerts & Bell Chimes

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Unlock audio on initial user interaction (click / touch / keypress)
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
}

const SOUND_PREF_KEY = 'restaurant_sound_alerts_enabled';
const KITCHEN_CHIME_PREF_KEY = 'restaurant_kitchen_chime_sound_enabled';

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(SOUND_PREF_KEY);
  return val === null ? true : val === 'true';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SOUND_PREF_KEY, String(enabled));
  }
}

export function isKitchenChimeEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(KITCHEN_CHIME_PREF_KEY);
  return val === null ? true : val === 'true';
}

export function setKitchenChimeEnabled(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KITCHEN_CHIME_PREF_KEY, String(enabled));
  }
}

/**
 * Plays a bright, melodic multi-tone kitchen order chime (Ding-Dong / Three-tone Bell)
 * Perfect for new Table QR orders arriving at the POS desk.
 */
export function playOrderChimeSound(): void {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 3 Harmonic Chime Notes: E5 (659Hz), G#5 (830Hz), B5 (987Hz), E6 (1318Hz)
    const notes = [
      { freq: 659.25, time: now, duration: 0.35, gain: 0.28 },
      { freq: 830.61, time: now + 0.12, duration: 0.45, gain: 0.32 },
      { freq: 1046.50, time: now + 0.25, duration: 0.7, gain: 0.35 },
      { freq: 1318.51, time: now + 0.38, duration: 0.9, gain: 0.38 }
    ];

    notes.forEach(({ freq, time, duration, gain }) => {
      // Primary Tone Oscillator
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      // Attack & Decay Envelope
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(gain, time + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + duration);

      // Add high harmonic overtone for a crystal bell metallic sparkle
      const overtoneOsc = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      overtoneOsc.type = 'triangle';
      overtoneOsc.frequency.setValueAtTime(freq * 2.75, time);

      overtoneGain.gain.setValueAtTime(0, time);
      overtoneGain.gain.linearRampToValueAtTime(gain * 0.15, time + 0.015);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, time + (duration * 0.5));

      overtoneOsc.connect(overtoneGain);
      overtoneGain.connect(ctx.destination);

      overtoneOsc.start(time);
      overtoneOsc.stop(time + (duration * 0.5));
    });
  } catch (err) {
    console.warn('Audio chime playback failed:', err);
  }
}

/**
 * Plays the kitchen acoustic order chime, controlled specifically by the Kitchen chime toggle.
 * @param force If true, plays regardless of preference (for testing/previewing the sound).
 */
export function playKitchenOrderChime(force = false): void {
  if (!force && !isKitchenChimeEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Kitchen Order Chime: Resonant 4-tone ascending alert with warm bell overtone
    const notes = [
      { freq: 587.33, time: now, duration: 0.3, gain: 0.26 }, // D5
      { freq: 739.99, time: now + 0.1, duration: 0.35, gain: 0.30 }, // F#5
      { freq: 880.00, time: now + 0.22, duration: 0.55, gain: 0.34 }, // A5
      { freq: 1174.66, time: now + 0.34, duration: 0.8, gain: 0.38 } // D6 (Final bell)
    ];

    notes.forEach(({ freq, time, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(gain, time + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + duration);

      // Metallic high overtone
      const overtoneOsc = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      overtoneOsc.type = 'triangle';
      overtoneOsc.frequency.setValueAtTime(freq * 2.0, time);

      overtoneGain.gain.setValueAtTime(0, time);
      overtoneGain.gain.linearRampToValueAtTime(gain * 0.12, time + 0.01);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, time + (duration * 0.4));

      overtoneOsc.connect(overtoneGain);
      overtoneGain.connect(ctx.destination);

      overtoneOsc.start(time);
      overtoneOsc.stop(time + (duration * 0.4));
    });
  } catch (err) {
    console.warn('Kitchen acoustic order chime failed:', err);
  }
}

/**
 * Plays a service call / kitchen desk bell ding (Single sharp bell tone)
 */
export function playKitchenBell(): void {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, now); // High A6 bell

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.35, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.8);
  } catch (err) {
    console.warn('Kitchen bell sound failed:', err);
  }
}

/**
 * Test chime trigger for the notification settings / navbar
 */
export function testChimeSound(): void {
  const previousState = isSoundEnabled();
  // Temporarily ensure sound context fires even if testing
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        playOrderChimeSound();
      });
    } else {
      playOrderChimeSound();
    }
  } catch (e) {
    playOrderChimeSound();
  }
}
