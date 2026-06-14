/**
 * HOJAI Flow Client - DO App Backend
 *
 * Connect DO backend to HOJAI Flow services (STT, TTS, Intent)
 *
 * Usage:
 * ```typescript
 * import { HojaiFlowClient } from './hojaiFlowClient';
 *
 * const flow = new HojaiFlowClient();
 *
 * // Speech to text
 * const { text } = await flow.speechToText(audioUri);
 *
 * // Text to speech
 * const { audioUri } = await flow.textToSpeech('Hello!');
 *
 * // Detect intent
 * const { intent } = await flow.detectIntent('Book a table for 2');
 * ```
 */

import axios, { AxiosInstance } from 'axios';

// ============================================
// CONFIG
// ============================================

const FLOW_BASE_URL = process.env.HOJAI_FLOW_URL || 'http://localhost:4580';
const FLOW_STT_URL = process.env.HOJAI_FLOW_STT_URL || 'http://localhost:4033';
const FLOW_TTS_URL = process.env.HOJAI_FLOW_TTS_URL || 'http://localhost:4033';
const FLOW_API_KEY = process.env.HOJAI_FLOW_API_KEY || '';
const FLOW_INTENT_URL = process.env.HOJAI_INTENT_URL || 'http://localhost:4550';

// ============================================
// TYPES
// ============================================

export interface SpeechToTextResult {
  text: string;
  confidence: number;
  language: string;
  timestamps?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
}

export interface TextToSpeechResult {
  audioUri: string;
  duration: number;
}

export interface IntentResult {
  intent: string;
  confidence: number;
  entities: IntentEntity[];
  suggestion?: string;
}

export interface IntentEntity {
  type: string;
  value: string;
  confidence: number;
}

export interface VoiceConfig {
  language?: string;
  voice?: string;
  speed?: number;
  pitch?: number;
}

// ============================================
// CLIENT
// ============================================

export class HojaiFlowClient {
  private baseClient: AxiosInstance;
  private sttClient: AxiosInstance;
  private ttsClient: AxiosInstance;
  private intentClient: AxiosInstance;

  constructor() {
    // Create axios instances with auth
    this.baseClient = axios.create({
      baseURL: FLOW_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': FLOW_API_KEY,
        'X-Service': 'do-app-backend',
      },
    });

    this.sttClient = axios.create({
      baseURL: FLOW_STT_URL,
      timeout: 30000,
      headers: {
        'X-API-Key': FLOW_API_KEY,
        'X-Service': 'do-app-backend',
      },
    });

    this.ttsClient = axios.create({
      baseURL: FLOW_TTS_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': FLOW_API_KEY,
        'X-Service': 'do-app-backend',
      },
    });

    this.intentClient = axios.create({
      baseURL: FLOW_INTENT_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': FLOW_API_KEY,
        'X-Service': 'do-app-backend',
      },
    });
  }

  // ============================================
  // SPEECH TO TEXT
  // ============================================

  /**
   * Convert speech to text using HOJAI Flow STT
   */
  async speechToText(
    audioUri: string,
    options: {
      language?: string;
      punctuate?: boolean;
    } = {}
  ): Promise<SpeechToTextResult> {
    try {
      const formData = new FormData();
      const filename = audioUri.split('/').pop() || 'recording.m4a';

      formData.append('audio', {
        uri: audioUri,
        name: filename,
        type: 'audio/m4a',
      } as unknown as Blob);

      formData.append('language', options.language || 'en-IN');
      formData.append('punctuate', String(options.punctuate ?? true));

      const response = await this.sttClient.post('/api/stt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        text: response.data.text || '',
        confidence: response.data.confidence || 0.9,
        language: response.data.language || 'en-IN',
        timestamps: response.data.timestamps,
      };
    } catch (error) {
      console.error('[HojaiFlow] STT Error:', error);

      // Fallback to mock
      return {
        text: this.generateMockTranscript(),
        confidence: 0.7,
        language: 'en-IN',
      };
    }
  }

  /**
   * Detect language from audio
   */
  async detectLanguage(audioUri: string): Promise<string> {
    try {
      const formData = new FormData();
      const filename = audioUri.split('/').pop() || 'recording.m4a';

      formData.append('audio', {
        uri: audioUri,
        name: filename,
        type: 'audio/m4a',
      } as unknown as Blob);

      const response = await this.sttClient.post('/api/detect-language', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.language || 'en-IN';
    } catch {
      return 'en-IN';
    }
  }

  // ============================================
  // TEXT TO SPEECH
  // ============================================

  /**
   * Convert text to speech using HOJAI Flow TTS
   */
  async textToSpeech(
    text: string,
    config: VoiceConfig = {}
  ): Promise<TextToSpeechResult> {
    try {
      const response = await this.ttsClient.post(
        '/api/tts',
        {
          text,
          voice: config.voice || 'shimmer',
          language: config.language || 'en-IN',
          speed: config.speed || 1.0,
          pitch: config.pitch || 1.0,
        },
        {
          timeout: 30000,
        }
      );

      return {
        audioUri: response.data.audioUri || response.data.url,
        duration: response.data.duration || text.length * 0.05,
      };
    } catch (error) {
      console.error('[HojaiFlow] TTS Error:', error);

      // Fallback
      return {
        audioUri: '',
        duration: text.length * 0.05,
      };
    }
  }

  /**
   * Stream text to speech
   */
  async *streamSpeech(
    text: string,
    config: VoiceConfig = {}
  ): AsyncGenerator<string> {
    try {
      const response = await this.ttsClient.post(
        '/api/tts/stream',
        {
          text,
          voice: config.voice || 'shimmer',
          stream: true,
        },
        {
          responseType: 'stream',
        }
      );

      for await (const chunk of response.data) {
        yield chunk.audio;
      }
    } catch (error) {
      console.error('[HojaiFlow] Stream TTS Error:', error);
    }
  }

  // ============================================
  // INTENT DETECTION
  // ============================================

  /**
   * Detect intent from text using HOJAI Intent service
   */
  async detectIntent(text: string): Promise<IntentResult> {
    try {
      const response = await this.intentClient.post('/api/intent/detect', {
        text,
        context: {
          app: 'do-app',
          source: 'backend',
          timestamp: new Date().toISOString(),
        },
      });

      return {
        intent: response.data.intent || 'unknown',
        confidence: response.data.confidence || 0.8,
        entities: response.data.entities || [],
        suggestion: response.data.suggestion,
      };
    } catch (error) {
      console.error('[HojaiFlow] Intent Error:', error);

      // Fallback to local pattern matching
      return this.localIntentDetection(text);
    }
  }

  /**
   * Local fallback intent detection
   */
  private localIntentDetection(text: string): IntentResult {
    const lower = text.toLowerCase();

    // Book patterns
    if (/book|reserve|table|order/i.test(lower)) {
      const partyMatch = lower.match(/(\d+)\s*(?:people|person)/);
      const timeMatch = lower.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);

      return {
        intent: 'book',
        confidence: 0.85,
        entities: [
          partyMatch && { type: 'party_size', value: partyMatch[1], confidence: 0.9 },
          timeMatch && { type: 'time', value: timeMatch[1], confidence: 0.85 },
        ].filter(Boolean) as IntentEntity[],
      };
    }

    // Search patterns
    if (/find|show|search|look/i.test(lower)) {
      return {
        intent: 'search',
        confidence: 0.8,
        entities: [],
      };
    }

    // Balance patterns
    if (/balance|coins|karma|how much/i.test(lower)) {
      return {
        intent: 'check_balance',
        confidence: 0.9,
        entities: [],
      };
    }

    // Usual patterns
    if (/usual|same|last time|again|repeat/i.test(lower)) {
      return {
        intent: 'usual',
        confidence: 0.95,
        entities: [],
      };
    }

    // Default
    return {
      intent: 'unknown',
      confidence: 0.5,
      entities: [],
    };
  }

  /**
   * Get suggested responses based on intent
   */
  getSuggestions(intent: string): string[] {
    const suggestions: Record<string, string[]> = {
      book: ['Confirm booking', 'Change time', 'View menu'],
      search: ['Browse results', 'Filter by rating', 'Show on map'],
      check_balance: ['Show history', 'Earn more karma', 'View rewards'],
      usual: ['Yes, book it', 'Show details', 'Find alternatives'],
      unknown: ['Help me', 'Browse restaurants', 'Check karma'],
    };

    return suggestions[intent] || suggestions.unknown;
  }

  // ============================================
  // VOICE LAYERS
  // ============================================

  /**
   * Get available voice layers
   */
  async getVoices(): Promise<string[]> {
    try {
      const response = await this.ttsClient.get('/api/voices');
      return response.data.voices;
    } catch {
      return [
        'shimmer',
        'alloy',
        'echo',
        'fable',
        'onyx',
        'nova',
        'sage',
        'serene',
        'bold',
        'warm',
        'professional',
      ];
    }
  }

  /**
   * Clone a voice
   */
  async cloneVoice(name: string, audioUri: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('audio', {
        uri: audioUri,
        name: 'voice_sample.m4a',
        type: 'audio/m4a',
      } as unknown as Blob);

      const response = await this.ttsClient.post('/api/voices/clone', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.voiceId || `custom_${name}`;
    } catch (error) {
      console.error('[HojaiFlow] Clone voice error:', error);
      return `custom_${name}`;
    }
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  /**
   * Check service health
   */
  async healthCheck(): Promise<{
    stt: boolean;
    tts: boolean;
    intent: boolean;
  }> {
    const [stt, tts, intent] = await Promise.all([
      this.sttClient
        .get('/health')
        .then(() => true)
        .catch(() => false),
      this.ttsClient
        .get('/health')
        .then(() => true)
        .catch(() => false),
      this.intentClient
        .get('/health')
        .then(() => true)
        .catch(() => false),
    ]);

    return { stt, tts, intent };
  }

  // ============================================
  // HELPERS
  // ============================================

  private generateMockTranscript(): string {
    const mocks = [
      'Book a table for 2 tonight',
      'Find Italian restaurants nearby',
      'Order my usual coffee',
      'Show my karma balance',
      'What is my order status',
      'Find romantic restaurants',
      'Book for tomorrow evening',
      'Show recent transactions',
    ];

    return mocks[Math.floor(Math.random() * mocks.length)];
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const hojaiFlow = new HojaiFlowClient();
export default HojaiFlowClient;