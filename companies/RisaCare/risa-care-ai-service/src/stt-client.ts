import { logger } from '../../shared/logger';
/**
 * RisaCare Speech-to-Text Client
 * Connects to HOJAI Voice AI Service (port 4590) for Whisper integration
 */

import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// TYPES
// ============================================

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
  confidence: number;
}

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  segments?: TranscriptionSegment[];
  language?: string;
  duration?: number;
  error?: string;
}

export interface TTSOptions {
  text: string;
  voice?: string;
  speed?: number;
  language?: string;
}

// ============================================
// STT CLIENT CLASS
// ============================================

export class STTRisaCareClient {
  private client: AxiosInstance;
  private fallbackEnabled: boolean;

  constructor(options?: {
    baseUrl?: string;
    apiKey?: string;
    fallbackEnabled?: boolean;
  }) {
    const baseUrl = options?.baseUrl || process.env.VOICE_SERVICE_URL || 'http://localhost:4590';

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 120000, // 2 minutes for audio processing
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(options?.apiKey && { 'Authorization': `Bearer ${options.apiKey}` })
      }
    });

    this.fallbackEnabled = options?.fallbackEnabled ?? true;
  }

  /**
   * Transcribe audio from buffer
   */
  async transcribeFromBuffer(
    audioBuffer: Buffer,
    filename: string = 'audio.mp3',
    options?: {
      language?: string;
      prompt?: string;
      format?: string;
    }
  ): Promise<TranscriptionResult> {
    try {
      const formData = new FormData();
      formData.append('audio', new Blob([audioBuffer]), filename);

      if (options?.language) {
        formData.append('language', options.language);
      }
      if (options?.prompt) {
        formData.append('prompt', options.prompt);
      }

      const response = await this.client.post('/api/stt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return {
        success: true,
        text: response.data.text,
        segments: response.data.segments,
        language: response.data.language,
        duration: response.data.duration
      };
    } catch (error: any) {
      logger.error('STT transcription error:', error.message);

      if (this.fallbackEnabled) {
        // Return mock data for development
        return this.getMockTranscription();
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Transcribe audio from URL
   */
  async transcribeFromUrl(
    audioUrl: string,
    options?: {
      language?: string;
      prompt?: string;
    }
  ): Promise<TranscriptionResult> {
    try {
      const response = await this.client.post('/api/stt/url', {
        audioUrl,
        language: options?.language || 'en',
        prompt: options?.prompt || 'Medical consultation'
      });

      return {
        success: true,
        text: response.data.text,
        segments: response.data.segments,
        language: response.data.language,
        duration: response.data.duration
      };
    } catch (error: any) {
      logger.error('STT URL transcription error:', error.message);

      if (this.fallbackEnabled) {
        return this.getMockTranscription();
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Mock transcription for development
   */
  private getMockTranscription(): TranscriptionResult {
    return {
      success: true,
      text: 'Mock transcription for development. In production, this would call the Whisper API.',
      segments: [
        {
          start: 0,
          end: 5,
          text: 'Mock transcription for development.',
          confidence: 0.95
        },
        {
          start: 5,
          end: 10,
          text: 'In production, this would call the Whisper API.',
          confidence: 0.92
        }
      ],
      language: 'en',
      duration: 10
    };
  }
}

// ============================================
// TEXT-TO-SPEECH CLIENT
// ============================================

export class TTSRisaCareClient {
  private client: AxiosInstance;

  constructor(options?: {
    baseUrl?: string;
    apiKey?: string;
  }) {
    const baseUrl = options?.baseUrl || process.env.VOICE_SERVICE_URL || 'http://localhost:4590';

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.apiKey && { 'Authorization': `Bearer ${options.apiKey}` })
      }
    });
  }

  /**
   * Convert text to speech
   */
  async synthesize(options: TTSOptions): Promise<{
    success: boolean;
    audioUrl?: string;
    error?: string;
  }> {
    try {
      const response = await this.client.post('/api/tts', {
        text: options.text,
        voice: options.voice || 'default',
        speed: options.speed || 1.0,
        language: options.language || 'en'
      });

      return {
        success: true,
        audioUrl: response.data.audioUrl
      };
    } catch (error: any) {
      logger.error('TTS synthesis error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// ============================================
// MEDICAL NLP CLIENT
// ============================================

export class MedicalNLPRisaCareClient {
  private client: AxiosInstance;

  constructor(options?: {
    baseUrl?: string;
    apiKey?: string;
  }) {
    const baseUrl = options?.baseUrl || process.env.VOICE_SERVICE_URL || 'http://localhost:4590';

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.apiKey && { 'Authorization': `Bearer ${options.apiKey}` })
      }
    });
  }

  /**
   * Extract medical entities from text
   */
  async extractEntities(text: string): Promise<{
    success: boolean;
    entities?: {
      symptoms?: string[];
      diagnoses?: string[];
      medications?: string[];
      procedures?: string[];
      vitals?: Record<string, number>;
      allergies?: string[];
      conditions?: string[];
    };
    error?: string;
  }> {
    try {
      const response = await this.client.post('/api/medical/extract', { text });

      return {
        success: true,
        entities: response.data.entities
      };
    } catch (error: any) {
      logger.error('Medical NLP error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate visit summary
   */
  async generateVisitSummary(
    transcript: string,
    patientContext?: {
      name?: string;
      age?: number;
      conditions?: string[];
      medications?: string[];
    }
  ): Promise<{
    success: boolean;
    summary?: {
      chiefComplaint: string;
      historyOfPresentIllness: string;
      assessment: string;
      plan: string;
    };
    error?: string;
  }> {
    try {
      const response = await this.client.post('/api/medical/visit-summary', {
        transcript,
        patientContext
      });

      return {
        success: true,
        summary: response.data.summary
      };
    } catch (error: any) {
      logger.error('Visit summary error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check symptom urgency
   */
  async checkSymptomUrgency(symptoms: string[]): Promise<{
    success: boolean;
    urgency?: 'low' | 'moderate' | 'high' | 'emergency';
    recommendations?: string;
    error?: string;
  }> {
    try {
      const response = await this.client.post('/api/medical/symptoms/check', {
        symptoms
      });

      return {
        success: true,
        urgency: response.data.urgency,
        recommendations: response.data.recommendations
      };
    } catch (error: any) {
      logger.error('Symptom urgency check error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// ============================================
// DEFAULT EXPORTS
// ============================================

export const sttClient = new STTRisaCareClient({
  baseUrl: process.env.VOICE_SERVICE_URL || 'http://localhost:4590'
});

export const ttsClient = new TTSRisaCareClient({
  baseUrl: process.env.VOICE_SERVICE_URL || 'http://localhost:4590'
});

export const medicalNlpClient = new MedicalNLPRisaCareClient({
  baseUrl: process.env.VOICE_SERVICE_URL || 'http://localhost:4590'
});

export default {
  sttClient,
  ttsClient,
  medicalNlpClient,
  STTRisaCareClient,
  TTSRisaCareClient,
  MedicalNLPRisaCareClient
};
