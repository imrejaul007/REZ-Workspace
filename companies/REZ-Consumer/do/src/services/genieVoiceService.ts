/**
 * Genie Voice Integration Service
 *
 * Connects DO App to Genie Services + HOJAI AI
 *
 * Architecture:
 * DO App → GenieVoiceService → Genie Services (4703-4713)
 *                           → HOJAI AI (4500-4590)
 *                           → Edge STT (4035)
 */

import axios, { AxiosInstance } from 'axios';

// ============================================
// CONFIG
// ============================================

const CONFIG = {
  // Genie Services (Personal AI)
  genieMemory: process.env.EXPO_PUBLIC_GENIE_MEMORY_URL || 'http://localhost:4703',
  genieRelationship: process.env.EXPO_PUBLIC_GENIE_RELATIONSHIP_URL || 'http://localhost:4704',
  genieBriefing: process.env.EXPO_PUBLIC_GENIE_BRIEFING_URL || 'http://localhost:4706',
  genieCall: process.env.EXPO_PUBLIC_GENIE_CALL_URL || 'http://localhost:4707',
  genieCalendar: process.env.EXPO_PUBLIC_GENIE_CALENDAR_URL || 'http://localhost:4709',
  genieEmail: process.env.EXPO_PUBLIC_GENIE_EMAIL_URL || 'http://localhost:4710',
  genieVoice: process.env.EXPO_PUBLIC_GENIE_VOICE_URL || 'http://localhost:4712',
  genieMeeting: process.env.EXPO_PUBLIC_GENIE_MEETING_URL || 'http://localhost:4713',

  // HOJAI AI
  hojaiGateway: process.env.EXPO_PUBLIC_HOJAI_GATEWAY_URL || 'http://localhost:4500',
  hojaiMemory: process.env.EXPO_PUBLIC_HOJAI_MEMORY_URL || 'http://localhost:4520',
  hojaiAgents: process.env.EXPO_PUBLIC_HOJAI_AGENTS_URL || 'http://localhost:4550',

  // Edge STT (on-device)
  edgeSTT: process.env.EXPO_PUBLIC_EDGE_STT_URL || 'http://localhost:4035',

  // Cloud STT/TTS
  cloudSTT: process.env.EXPO_PUBLIC_CLOUD_STT_URL || 'http://localhost:4033',
  cloudTTS: process.env.EXPO_PUBLIC_CLOUD_TTS_URL || 'http://localhost:4033',

  // Timeout
  TIMEOUT: 30000,
};

// ============================================
// TYPES
// ============================================

export interface VoiceCommand {
  text: string;
  language?: string;
  context?: Record<string, unknown>;
}

export interface VoiceResponse {
  text: string;
  action?: string;
  confidence: number;
  data?: Record<string, unknown>;
}

export interface GenieMemory {
  id: string;
  userId: string;
  content: string;
  type: 'event' | 'preference' | 'fact' | 'relationship' | 'task';
  metadata?: Record<string, unknown>;
  createdAt: Date;
  source: 'voice' | 'text' | 'calendar' | 'email';
}

export interface GenieBriefing {
  date: string;
  summary: string;
  events: Array<{
    title: string;
    time: string;
    type: 'meeting' | 'reminder' | 'task';
  }>;
  tasks: Array<{
    text: string;
    due: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  insights: string[];
}

// ============================================
// GENIE VOICE SERVICE
// ============================================

class GenieVoiceService {
  private axios: AxiosInstance;
  private sttProvider: 'edge' | 'cloud' | 'auto' = 'auto';
  private ttsProvider: 'edge' | 'cloud' | 'auto' = 'auto';

  constructor() {
    this.axios = axios.create({
      timeout: CONFIG.TIMEOUT,
    });
  }

  // ============================================
  // VOICE PROCESSING
  // ============================================

  /**
   * Process voice command through Genie
   */
  async processVoiceCommand(
    audioUri: string,
    options: { language?: string; context?: Record<string, unknown> } = {}
  ): Promise<VoiceResponse> {
    try {
      // 1. Transcribe audio
      const transcription = await this.transcribe(audioUri, options.language);

      // 2. Process with Genie Memory for context
      const context = await this.getGenieContext(options.context);

      // 3. Process with HOJAI AI for intent
      const intent = await this.processIntent(transcription, context);

      // 4. Execute action if needed
      const response = await this.executeAction(intent, context);

      return {
        text: response.text,
        action: intent.action,
        confidence: intent.confidence,
        data: response.data,
      };
    } catch (error) {
      console.error('Genie voice command failed:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio using best available provider
   */
  async transcribe(audioUri: string, language?: string): Promise<string> {
    // Try Edge STT first (faster, private)
    if (this.sttProvider === 'auto' || this.sttProvider === 'edge') {
      try {
        const result = await this.transcribeWithEdge(audioUri, language);
        return result.text;
      } catch (error) {
        console.warn('Edge STT failed, falling back to cloud:', error);
      }
    }

    // Fall back to cloud STT
    return this.transcribeWithCloud(audioUri, language);
  }

  private async transcribeWithEdge(audioUri: string, language?: string): Promise<{ text: string; confidence: number }> {
    const formData = new FormData();

    // Read audio file
    const response = await fetch(audioUri);
    const blob = await response.blob();

    formData.append('audio', blob, 'audio.wav');
    if (language) formData.append('language', language);

    const result = await this.axios.post(`${CONFIG.edgeSTT}/api/stt`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 10000, // Edge should be fast
    });

    return {
      text: result.data.text,
      confidence: result.data.confidence || 0.9,
    };
  }

  private async transcribeWithCloud(audioUri: string, language?: string): Promise<string> {
    const formData = new FormData();

    const response = await fetch(audioUri);
    const blob = await response.blob();

    formData.append('audio', blob, 'audio.wav');
    if (language) formData.append('language', language);

    const result = await this.axios.post(`${CONFIG.cloudSTT}/api/stt`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return result.data.text;
  }

  /**
   * Text to Speech
   */
  async speak(text: string, language?: string): Promise<void> {
    try {
      // Use Genie Voice service for TTS
      const result = await this.axios.post(
        `${CONFIG.genieVoice}/api/tts`,
        { text, language: language || 'en-IN' },
        { responseType: 'arraybuffer' }
      );

      // Play audio
      // This would use expo-av to play the audio
      // For now, return
      console.log('TTS generated, audio size:', result.data.byteLength);
    } catch (error) {
      console.warn('TTS failed, using fallback:', error);
      // Fallback to expo-speech
      // await speakWithFallback(text);
    }
  }

  // ============================================
  // GENIE MEMORY
  // ============================================

  /**
   * Remember something from voice
   */
  async remember(userId: string, content: string, type: GenieMemory['type'], metadata?: Record<string, unknown>): Promise<GenieMemory> {
    const result = await this.axios.post(`${CONFIG.genieMemory}/api/memory/remember`, {
      userId,
      content,
      type,
      metadata,
      source: 'voice',
    });

    return result.data;
  }

  /**
   * Recall memories
   */
  async recall(userId: string, query?: string): Promise<GenieMemory[]> {
    const result = await this.axios.get(`${CONFIG.genieMemory}/api/memory/recall`, {
      params: { userId, query },
    });

    return result.data.memories || [];
  }

  /**
   * Get user's usual/preferences
   */
  async getUsual(userId: string): Promise<Record<string, unknown>> {
    const result = await this.axios.get(`${CONFIG.genieMemory}/api/memory/usual/${userId}`);
    return result.data;
  }

  /**
   * Get Genie context for processing
   */
  private async getGenieContext(context?: Record<string, unknown>): Promise<Record<string, unknown>> {
    const userId = context?.userId as string;
    if (!userId) return context || {};

    try {
      const [memories, usual, briefing] = await Promise.all([
        this.recall(userId),
        this.getUsual(userId),
        this.getBriefing(userId).catch(() => null),
      ]);

      return {
        ...context,
        memories,
        usual,
        briefing,
      };
    } catch (error) {
      console.warn('Failed to get Genie context:', error);
      return context || {};
    }
  }

  // ============================================
  // GENIE BRIEFING
  // ============================================

  /**
   * Get daily briefing
   */
  async getBriefing(userId: string): Promise<GenieBriefing> {
    const result = await this.axios.get(`${CONFIG.genieBriefing}/api/briefing/daily`, {
      params: { userId },
    });

    return result.data;
  }

  /**
   * Generate morning briefing
   */
  async generateBriefing(userId: string): Promise<GenieBriefing> {
    const result = await this.axios.post(`${CONFIG.genieBriefing}/api/briefing/generate`, {
      userId,
    });

    return result.data;
  }

  // ============================================
  // HOJAI AI PROCESSING
  // ============================================

  /**
   * Process intent using HOJAI AI
   */
  private async processIntent(
    text: string,
    context: Record<string, unknown>
  ): Promise<{ action: string; confidence: number; entities: Record<string, unknown> }> {
    try {
      const result = await this.axios.post(`${CONFIG.hojaiGateway}/api/intent/process`, {
        text,
        context,
        userId: context.userId,
      });

      return {
        action: result.data.action,
        confidence: result.data.confidence,
        entities: result.data.entities || {},
      };
    } catch (error) {
      console.warn('Intent processing failed, using fallback:', error);
      // Simple keyword-based fallback
      return this.simpleIntentDetection(text);
    }
  }

  /**
   * Simple keyword-based intent detection (fallback)
   */
  private simpleIntentDetection(text: string): { action: string; confidence: number; entities: Record<string, unknown> } {
    const lower = text.toLowerCase();

    if (lower.includes('order') || lower.includes('buy')) {
      return { action: 'order', confidence: 0.8, entities: { type: 'commerce' } };
    }
    if (lower.includes('remember') || lower.includes('note')) {
      return { action: 'remember', confidence: 0.9, entities: { type: 'memory' } };
    }
    if (lower.includes('call') || lower.includes('phone')) {
      return { action: 'call', confidence: 0.85, entities: { type: 'communication' } };
    }
    if (lower.includes('remind') || lower.includes('reminder')) {
      return { action: 'reminder', confidence: 0.9, entities: { type: 'task' } };
    }
    if (lower.includes('book') || lower.includes('reserve')) {
      return { action: 'book', confidence: 0.85, entities: { type: 'booking' } };
    }
    if (lower.includes('what') || lower.includes('how') || lower.includes('when')) {
      return { action: 'query', confidence: 0.8, entities: { type: 'information' } };
    }

    return { action: 'general', confidence: 0.5, entities: {} };
  }

  /**
   * Execute action based on intent
   */
  private async executeAction(
    intent: { action: string; entities: Record<string, unknown> },
    context: Record<string, unknown>
  ): Promise<{ text: string; data?: Record<string, unknown> }> {
    const userId = context.userId as string;

    switch (intent.action) {
      case 'order':
        return { text: 'I\'ll help you place that order!', data: { type: 'commerce' } };

      case 'remember':
        return { text: 'I\'ll remember that for you.', data: { type: 'memory' } };

      case 'call':
        return { text: 'I\'ll make that call for you.', data: { type: 'communication' } };

      case 'reminder':
        return { text: 'I\'ve set a reminder for you.', data: { type: 'task' } };

      case 'book':
        return { text: 'Let me book that for you.', data: { type: 'booking' } };

      case 'query':
        return { text: 'Let me check that for you...', data: { type: 'information' } };

      default:
        return { text: 'I\'m not sure I understand. Can you try again?' };
    }
  }

  // ============================================
  // CONFIGURATION
  // ============================================

  /**
   * Set STT provider preference
   */
  setSTTProvider(provider: 'edge' | 'cloud' | 'auto'): void {
    this.sttProvider = provider;
  }

  /**
   * Set TTS provider preference
   */
  setTTSProvider(provider: 'edge' | 'cloud' | 'auto'): void {
    this.ttsProvider = provider;
  }

  /**
   * Health check all services
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const services = {
      'genie-memory': CONFIG.genieMemory,
      'genie-voice': CONFIG.genieVoice,
      'hojai-gateway': CONFIG.hojaiGateway,
      'edge-stt': CONFIG.edgeSTT,
      'cloud-stt': CONFIG.cloudSTT,
    };

    const results: Record<string, boolean> = {};

    for (const [name, url] of Object.entries(services)) {
      try {
        const response = await this.axios.get(`${url}/health`, { timeout: 5000 });
        results[name] = response.status === 200;
      } catch {
        results[name] = false;
      }
    }

    return results;
  }
}

// ============================================
// EXPORTS
// ============================================

export const genieVoiceService = new GenieVoiceService();

export default genieVoiceService;

// Configuration export for external use
export { CONFIG as genieConfig };