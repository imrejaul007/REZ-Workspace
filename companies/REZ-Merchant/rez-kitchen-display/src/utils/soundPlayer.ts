import { exec } from 'child_process';
import { SoundType } from '../types';

/**
 * Sound configuration for different notification types
 */
const SOUND_CONFIGS: Record<SoundType, { frequency: number; duration: number; pattern: number[] }> = {
  new_order: { frequency: 880, duration: 200, pattern: [200, 100, 200] },
  delay_alert: { frequency: 1000, duration: 500, pattern: [500, 100, 500, 100, 500] },
  order_ready: { frequency: 660, duration: 150, pattern: [150, 50, 150, 50, 300] },
  order_complete: { frequency: 523, duration: 100, pattern: [100, 50, 100] },
};

/**
 * Cross-platform sound player utility
 */
export class SoundPlayer {
  private enabled: boolean = true;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  /**
   * Enable or disable sound notifications
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Play a notification sound
   */
  play(type: SoundType): void {
    if (!this.enabled) {
      console.log(`[SoundPlayer] Sound disabled, skipping: ${type}`);
      return;
    }

    const config = SOUND_CONFIGS[type];
    const platform = process.platform;

    switch (platform) {
      case 'darwin':
        this.playMacOS(type, config);
        break;
      case 'win32':
        this.playWindows(type, config);
        break;
      case 'linux':
        this.playLinux(type, config);
        break;
      default:
        this.playFallback(type);
    }
  }

  /**
   * Play sound on macOS using afplay or say command
   */
  private playMacOS(type: SoundType, config: typeof SOUND_CONFIGS[new_order]): void {
    // Use terminal bell as fallback, or try system sounds
    console.log(`\x07[${type.toUpperCase()}]`);

    // Alternative: Use say command for voice notifications
    // exec(`say "${this.getVoiceMessage(type)}"`, (err) => {
    //   if (err) console.error('Say error:', err);
    // });
  }

  /**
   * Play sound on Windows
   */
  private playWindows(type: SoundType, config: typeof SOUND_CONFIGS[new_order]): void {
    console.log(`\x07[${type.toUpperCase()}]`);
  }

  /**
   * Play sound on Linux
   */
  private playLinux(type: SoundType, config: typeof SOUND_CONFIGS[new_order]): void {
    // Try using speaker-test or beep
    exec('which beep', (err) => {
      if (!err) {
        exec(`beep -f ${config.frequency} -l ${config.duration}`, (beepErr) => {
          if (beepErr) console.log(`\x07[${type.toUpperCase()}]`);
        });
      } else {
        console.log(`\x07[${type.toUpperCase()}]`);
      }
    });
  }

  /**
   * Fallback for unknown platforms
   */
  private playFallback(type: SoundType): void {
    console.log(`\x07[${type.toUpperCase()}]`);
  }

  /**
   * Get voice message for text-to-speech
   */
  private getVoiceMessage(type: SoundType): string {
    switch (type) {
      case 'new_order':
        return 'New order incoming';
      case 'delay_alert':
        return 'Warning. Order delayed';
      case 'order_ready':
        return 'Order ready for pickup';
      case 'order_complete':
        return 'Order completed';
      default:
        return 'Notification';
    }
  }

  /**
   * Play a beep pattern
   */
  playPattern(type: SoundType): void {
    const config = SOUND_CONFIGS[type];
    let totalDelay = 0;

    for (let i = 0; i < config.pattern.length; i++) {
      if (i % 2 === 0) {
        // Beep
        setTimeout(() => {
          console.log('\x07');
        }, totalDelay);
      }
      totalDelay += config.pattern[i];
    }
  }
}

/**
 * Get sound configuration for a specific type
 */
export function getSoundConfig(type: SoundType) {
  return SOUND_CONFIGS[type];
}

/**
 * Get all available sound types
 */
export function getAvailableSounds(): SoundType[] {
  return Object.keys(SOUND_CONFIGS) as SoundType[];
}
