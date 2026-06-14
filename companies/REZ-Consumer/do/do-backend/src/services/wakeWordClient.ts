/**
 * Wake Word Client - Connect DO Backend to Genie Wake Word Engine
 *
 * Handles "Hey Genie" wake word detection and management
 */

import axios from 'axios';

const WAKE_WORD_URL = process.env.HOJAI_WAKE_WORD_URL || 'http://localhost:4580';
const WAKE_WORD_API_KEY = process.env.HOJAI_WAKE_WORD_API_KEY;

// ============================================
// TYPES
// ============================================

export interface WakeWord {
  id: string;
  name: string;
  phrase: string;
  type: 'default' | 'custom';
  enabled: boolean;
  sensitivity: number;
  deviceId?: string;
  language?: string;
  createdAt: string;
}

export interface WakeWordSettings {
  alwaysListening: boolean;
  confirmationSound: boolean;
  visualFeedback: boolean;
  wakeOnWhisper: boolean;
  multipleDevices: boolean;
  language: string;
}

export interface WakeWordStatus {
  listening: boolean;
  lastTrigger: string;
  enabledWakeWords: number;
  settings: WakeWordSettings;
}

// ============================================
// CLIENT
// ============================================

export class WakeWordClient {
  private client = axios.create({
    baseURL: WAKE_WORD_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(WAKE_WORD_API_KEY && { 'X-API-Key': WAKE_WORD_API_KEY }),
    },
    timeout: 10000,
  });

  // ============================================
  // USER SETUP
  // ============================================

  /**
   * Initialize wake word for user
   */
  async initializeUser(userId: string): Promise<any> {
    const response = await this.client.post(`/user/${userId}`);
    return response.data;
  }

  /**
   * Get user wake word status
   */
  async getStatus(userId: string): Promise<WakeWordStatus> {
    const response = await this.client.get(`/user/${userId}/status`);
    return response.data;
  }

  // ============================================
  // WAKE WORDS
  // ============================================

  /**
   * Get all wake words for user
   */
  async getWakeWords(userId: string): Promise<WakeWord[]> {
    const response = await this.client.get(`/user/${userId}/wakewords`);
    return response.data.wakeWords || [];
  }

  /**
   * Add custom wake word
   */
  async addWakeWord(
    userId: string,
    phrase: string,
    name?: string,
    sensitivity?: number,
    deviceId?: string
  ): Promise<WakeWord> {
    const response = await this.client.post(`/user/${userId}/wakewords`, {
      phrase,
      name,
      sensitivity,
      deviceId,
    });
    return response.data.wakeWord;
  }

  /**
   * Update wake word
   */
  async updateWakeWord(
    userId: string,
    wakeWordId: string,
    updates: { enabled?: boolean; sensitivity?: number; name?: string }
  ): Promise<WakeWord> {
    const response = await this.client.put(`/user/${userId}/wakewords/${wakeWordId}`, updates);
    return response.data.wakeWord;
  }

  /**
   * Delete custom wake word
   */
  async deleteWakeWord(userId: string, wakeWordId: string): Promise<void> {
    await this.client.delete(`/user/${userId}/wakewords/${wakeWordId}`);
  }

  // ============================================
  // DETECTION
  // ============================================

  /**
   * Detect wake word from audio
   * Note: For real-time detection, use the on-device SDK (Picovoice)
   */
  async detectWakeWord(userId: string, audio: string): Promise<{
    detected: boolean;
    wakeWord?: WakeWord;
    confidence?: number;
    listening?: boolean;
  }> {
    const response = await this.client.post(`/user/${userId}/detect`, { audio });
    return response.data;
  }

  /**
   * Test wake word detection (for testing without audio)
   */
  async testWakeWord(userId: string, phrase: string): Promise<{
    detected: boolean;
    wakeWord?: WakeWord;
    response?: string;
  }> {
    const response = await this.client.post(`/user/${userId}/test`, { phrase });
    return response.data;
  }

  // ============================================
  // SETTINGS
  // ============================================

  /**
   * Get wake word settings
   */
  async getSettings(userId: string): Promise<WakeWordSettings> {
    const response = await this.client.get(`/user/${userId}/settings`);
    return response.data.settings;
  }

  /**
   * Update wake word settings
   */
  async updateSettings(userId: string, settings: Partial<WakeWordSettings>): Promise<WakeWordSettings> {
    const response = await this.client.put(`/user/${userId}/settings`, settings);
    return response.data.settings;
  }

  // ============================================
  // LISTENING CONTROL
  // ============================================

  /**
   * Start listening for wake word
   */
  async startListening(userId: string): Promise<boolean> {
    const response = await this.client.post(`/user/${userId}/listen`);
    return response.data.listening;
  }

  /**
   * Stop listening for wake word
   */
  async stopListening(userId: string): Promise<boolean> {
    const response = await this.client.post(`/user/${userId}/stop`);
    return response.data.listening;
  }
}

// ============================================
// DEFAULT WAKE WORDS
// ============================================

export const DEFAULT_WAKE_WORDS = [
  { phrase: 'hey genie', name: 'Genie', type: 'default' as const },
  { phrase: 'hey genie home', name: 'Genie Home', type: 'default' as const },
  { phrase: 'hey genie office', name: 'Genie Office', type: 'default' as const },
  { phrase: 'hey genie car', name: 'Genie Car', type: 'default' as const },
];

// ============================================
// EXPORT DEFAULT INSTANCE
// ============================================

export const wakeWordClient = new WakeWordClient();

export default wakeWordClient;