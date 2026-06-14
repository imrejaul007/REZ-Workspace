/**
 * Scanner Feedback Utilities
 * Sound and vibration feedback for successful scans
 */

import { logger } from '@/lib/utils/logger';

// Base64 encoded short beep sound (simple sine wave beep)
const SCAN_SOUND_DATA_URL = 'data:audio/wav;base64,UklGRl4GAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==';

/**
 * Audio context for playing scan sounds
 */
let audioContext: AudioContext | null = null;
let audioBuffer: AudioBuffer | null = null;

/**
 * Initialize the audio context (must be called from user interaction)
 */
async function initAudio(): Promise<void> {
  if (audioContext) return;

  try {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Create a simple beep sound
    const sampleRate = audioContext.sampleRate;
    const duration = 0.15; // 150ms
    const frequency = 880; // A5 note
    const samples = Math.floor(sampleRate * duration);

    audioBuffer = audioContext.createBuffer(1, samples, sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    // Generate a sine wave with envelope
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const envelope = Math.min(1, (samples - i) / (samples * 0.1)); // Fade out
      const wave = Math.sin(2 * Math.PI * frequency * t);
      // Add harmonics for a richer sound
      const harmonic = Math.sin(4 * Math.PI * frequency * t) * 0.3;
      channelData[i] = (wave + harmonic) * 0.3 * envelope;
    }
  } catch (err) {
    logger.warn('Failed to initialize audio context:', { error: err });
  }
}

/**
 * Play a success sound when QR code is scanned
 */
export async function playScanSound(): Promise<void> {
  try {
    await initAudio();

    if (!audioContext || !audioBuffer) {
      // Fallback: try to play the data URL sound
      const audio = new Audio(SCAN_SOUND_DATA_URL);
      audio.volume = 0.3;
      await audio.play().catch(() => {
        // Ignore audio play errors
      });
      return;
    }

    // Resume context if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.3; // Volume

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    source.start(0);
  } catch (err) {
    // Silently fail - audio is not critical
    logger.debug('Failed to play scan sound:', { error: err });
  }
}

/**
 * Trigger device vibration on successful scan
 * Only works on devices that support vibration API
 */
export function triggerVibration(): void {
  if (!('vibrate' in navigator)) {
    return;
  }

  try {
    // Pattern: vibrate for 100ms, pause for 50ms, vibrate for 100ms
    navigator.vibrate([100, 50, 100]);
  } catch (err) {
    logger.debug('Failed to trigger vibration:', { error: err });
  }
}

/**
 * Play an error sound
 */
export async function playErrorSound(): Promise<void> {
  try {
    await initAudio();

    if (!audioContext || !audioBuffer) return;

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Lower frequency error tone
    const sampleRate = audioContext.sampleRate;
    const duration = 0.2;
    const frequency = 220; // Lower A3 note
    const samples = Math.floor(sampleRate * duration);

    const errorBuffer = audioContext.createBuffer(1, samples, sampleRate);
    const channelData = errorBuffer.getChannelData(0);

    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const envelope = Math.min(1, (samples - i) / (samples * 0.2));
      // Two-tone error sound
      const wave1 = Math.sin(2 * Math.PI * frequency * t);
      const wave2 = Math.sin(2 * Math.PI * (frequency * 0.8) * t);
      channelData[i] = (wave1 + wave2) * 0.2 * envelope;
    }

    const source = audioContext.createBufferSource();
    source.buffer = errorBuffer;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.3;

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    source.start(0);
  } catch (err) {
    logger.debug('Failed to play error sound:', { error: err });
  }
}

/**
 * Check if haptic feedback is available
 */
export function isHapticSupported(): boolean {
  return 'vibrate' in navigator;
}

/**
 * Check if audio feedback is available
 */
export function isAudioSupported(): boolean {
  return typeof window !== 'undefined' &&
    ('AudioContext' in window || 'webkitAudioContext' in window);
}
