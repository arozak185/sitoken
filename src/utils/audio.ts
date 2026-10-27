/**
 * Audio synthesizer for exam token updates using Web Audio API.
 * Produces a soft, professional, pleasant chime that alerts
 * students & proctors without causing panic or harsh disturbance.
 */

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
    audioCtx.resume();
  }
  return audioCtx;
}

export function playTokenUpdateChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // First tone (E5 ~ 659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.5);

    // Second tone (A5 ~ 880 Hz, higher pleasant resolving tone)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.22);
    gain2.gain.setValueAtTime(0.001, now + 0.22);
    gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.27);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.22);
    osc2.stop(now + 0.85);
  } catch (err) {
    console.warn('Unable to play audio chime:', err);
  }
}
