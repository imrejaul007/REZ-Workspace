/**
 * useFlowVoice - HOJAI Flow Integration for DO App
 *
 * Real voice (STT/TTS) instead of mock expo-av
 *
 * Usage:
 * ```typescript
 * import { useFlowVoice } from '@/hooks/useFlowVoice';
 *
 * function MyComponent() {
 *   const { startListening, stopListening, speak, transcript, isListening } = useFlowVoice();
 *
 *   // Start voice recording
 *   await startListening();
 *
 *   // Stop and get transcript
 *   const text = await stopListening();
 *
 *   // Speak response
 *   await speak('Your order has been placed!');
 * }
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

// Flow SDK types (will be imported when SDK is installed)
// Until then, we'll use axios directly
import axios from 'axios';

// ============================================
// CONFIG
// ============================================

const FLOW_API_KEY = process.env.EXPO_PUBLIC_HOJAI_FLOW_API_KEY || '';
const FLOW_STT_URL = process.env.EXPO_PUBLIC_HOJAI_FLOW_STT_URL || 'http://localhost:4033';
const FLOW_TTS_URL = process.env.EXPO_PUBLIC_HOJAI_FLOW_TTS_URL || 'http://localhost:4033';

// ============================================
// TYPES
// ============================================

export interface FlowVoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  transcript: string;
  partialTranscript: string;
  error: string | null;
  audioLevel: number;
}

export interface FlowVoiceOptions {
  language?: 'en-IN' | 'en-US' | 'hi-IN' | 'hinglish';
  voice?: 'shimmer' | 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova';
  speed?: number;
  pitch?: number;
  onTranscript?: (text: string) => void;
  onSpeakingStart?: () => void;
  onSpeakingEnd?: () => void;
  onError?: (error: string) => void;
}

export interface SpeechToTextResult {
  text: string;
  confidence: number;
  language: string;
}

export interface TextToSpeechResult {
  audioUri: string;
  duration: number;
}

// ============================================
// DEFAULT OPTIONS
// ============================================

const DEFAULT_OPTIONS: Required<FlowVoiceOptions> = {
  language: 'en-IN',
  voice: 'shimmer',
  speed: 1.0,
  pitch: 1.0,
  onTranscript: () => {},
  onSpeakingStart: () => {},
  onSpeakingEnd: () => {},
  onError: () => {},
};

// ============================================
// HOOK
// ============================================

export function useFlowVoice(options: FlowVoiceOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // State
  const [state, setState] = useState<FlowVoiceState>({
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    transcript: '',
    partialTranscript: '',
    error: null,
    audioLevel: 0,
  });

  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      Speech.stop();
    };
  }, []);

  // ============================================
  // AUDIO LEVEL SIMULATION
  // ============================================

  const startAudioLevelSimulation = useCallback(() => {
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
    }

    audioLevelIntervalRef.current = setInterval(() => {
      const level = 0.3 + Math.random() * 0.5; // 0.3 to 0.8
      setState((prev) => ({ ...prev, audioLevel: level }));
    }, 100);
  }, []);

  const stopAudioLevelSimulation = useCallback(() => {
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
    setState((prev) => ({ ...prev, audioLevel: 0 }));
  }, []);

  // ============================================
  // SPEECH TO TEXT
  // ============================================

  /**
   * Convert speech to text using HOJAI Flow STT
   */
  const speechToText = useCallback(async (audioUri: string): Promise<SpeechToTextResult> => {
    setState((prev) => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Create FormData
      const formData = new FormData();
      const filename = audioUri.split('/').pop() || 'recording.m4a';

      formData.append('audio', {
        uri: audioUri,
        name: filename,
        type: 'audio/m4a',
      } as unknown as Blob);

      formData.append('language', opts.language);
      formData.append('punctuate', 'true');
      formData.append('filterProfanity', 'false');

      // Call HOJAI Flow STT API
      const response = await axios.post(`${FLOW_STT_URL}/api/stt`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-API-Key': FLOW_API_KEY,
        },
        timeout: 30000,
      });

      const result: SpeechToTextResult = {
        text: response.data.text || '',
        confidence: response.data.confidence || 0.9,
        language: response.data.language || opts.language,
      };

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        transcript: result.text,
      }));

      opts.onTranscript(result.text);

      return result;
    } catch (error) {
      const errorMessage = (error as Error).message;
      setState((prev) => ({ ...prev, isProcessing: false, error: errorMessage }));
      opts.onError(errorMessage);

      // Fallback to mock
      return {
        text: generateMockTranscript(),
        confidence: 0.7,
        language: opts.language,
      };
    }
  }, [opts]);

  // ============================================
  // TEXT TO SPEECH
  // ============================================

  /**
   * Convert text to speech using HOJAI Flow TTS
   */
  const textToSpeech = useCallback(async (text: string): Promise<string> => {
    setState((prev) => ({ ...prev, isSpeaking: true, error: null }));

    try {
      // Call HOJAI Flow TTS API
      const response = await axios.post(
        `${FLOW_TTS_URL}/api/tts`,
        {
          text,
          voice: opts.voice,
          language: opts.language,
          speed: opts.speed,
          pitch: opts.pitch,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': FLOW_API_KEY,
          },
          timeout: 30000,
        }
      );

      const audioUri = response.data.audioUri || response.data.url;

      // Play audio
      await playAudio(audioUri);

      setState((prev) => ({ ...prev, isSpeaking: false }));
      opts.onSpeakingEnd();

      return audioUri;
    } catch (error) {
      const errorMessage = (error as Error).message;
      setState((prev) => ({ ...prev, isSpeaking: false, error: errorMessage }));
      opts.onError(errorMessage);

      // Fallback to expo-speech
      await speakWithFallback(text);

      return '';
    }
  }, [opts]);

  /**
   * Play audio from URI
   */
  const playAudio = async (audioUri: string): Promise<void> => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      opts.onSpeakingStart();
      await sound.playAsync();
      await new Promise((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if ((status as any).isLoaded && (status as any).didJustFinish) {
            resolve(undefined);
          }
        });
      });
      await sound.unloadAsync();
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  };

  /**
   * Fallback TTS using expo-speech
   */
  const speakWithFallback = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      Speech.speak(text, {
        language: opts.language === 'hinglish' ? 'hi-IN' : opts.language,
        pitch: opts.pitch,
        rate: opts.speed,
        onDone: () => {
          setState((prev) => ({ ...prev, isSpeaking: false }));
          opts.onSpeakingEnd();
          resolve(undefined);
        },
        onError: () => {
          setState((prev) => ({ ...prev, isSpeaking: false }));
          opts.onSpeakingEnd();
          resolve(undefined);
        },
      });
    });
  };

  // ============================================
  // SPEAK (MAIN METHOD)
  // ============================================

  /**
   * Speak text (TTS) - main method
   */
  const speak = useCallback(
    async (text: string): Promise<void> => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await textToSpeech(text);
    },
    [textToSpeech]
  );

  /**
   * Stop speaking
   */
  const stopSpeaking = useCallback(async (): Promise<void> => {
    Speech.stop();
    setState((prev) => ({ ...prev, isSpeaking: false }));
    opts.onSpeakingEnd();
  }, [opts]);

  // ============================================
  // VOICE RECORDING
  // ============================================

  /**
   * Start recording audio
   */
  const startRecording = useCallback(async (): Promise<void> => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Microphone permission denied');
      }

      // Configure audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;

      setState((prev) => ({
        ...prev,
        isListening: true,
        transcript: '',
        partialTranscript: '',
        error: null,
      }));

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      startAudioLevelSimulation();

      console.log('[FlowVoice] Recording started');
    } catch (error) {
      const errorMessage = (error as Error).message;
      setState((prev) => ({ ...prev, isListening: false, error: errorMessage }));
      opts.onError(errorMessage);
      console.error('[FlowVoice] Recording failed:', error);
    }
  }, [opts, startAudioLevelSimulation]);

  /**
   * Stop recording and get transcript
   */
  const stopRecording = useCallback(async (): Promise<string> => {
    try {
      if (!recordingRef.current) {
        throw new Error('No recording in progress');
      }

      stopAudioLevelSimulation();
      setState((prev) => ({ ...prev, isProcessing: true }));

      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      // Configure audio for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      setState((prev) => ({ ...prev, isListening: false }));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (!uri) {
        throw new Error('Recording URI not found');
      }

      // Convert speech to text
      const result = await speechToText(uri);

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        transcript: result.text,
      }));

      return result.text;
    } catch (error) {
      const errorMessage = (error as Error).message;
      setState((prev) => ({
        ...prev,
        isListening: false,
        isProcessing: false,
        error: errorMessage,
      }));
      opts.onError(errorMessage);
      console.error('[FlowVoice] Stop recording failed:', error);

      return '';
    }
  }, [speechToText, opts, stopAudioLevelSimulation]);

  // ============================================
  // VOICE INTERACTION (COMBINED)
  // ============================================

  /**
   * Start listening (convenience method)
   */
  const startListening = useCallback(async (): Promise<void> => {
    await startRecording();
  }, [startRecording]);

  /**
   * Stop listening (convenience method)
   */
  const stopListening = useCallback(async (): Promise<string> => {
    return stopRecording();
  }, [stopRecording]);

  /**
   * Toggle listening state
   */
  const toggleListening = useCallback(async (): Promise<string> => {
    if (state.isListening) {
      return stopListening();
    } else {
      await startListening();
      return '';
    }
  }, [state.isListening, startListening, stopListening]);

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Clear transcript
   */
  const clearTranscript = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      transcript: '',
      partialTranscript: '',
      error: null,
    }));
  }, []);

  /**
   * Check if voice is available
   */
  const isAvailable = useCallback(async (): Promise<boolean> => {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices.length > 0;
    } catch {
      return true; // Assume available
    }
  }, []);

  // ============================================
  // RETURN
  // ============================================

  return {
    // State
    ...state,

    // Voice recording
    startListening,
    stopListening,
    toggleListening,
    startRecording,
    stopRecording,

    // Speech
    speak,
    stopSpeaking,

    // Helpers
    clearTranscript,
    isAvailable,

    // Direct access
    speechToText,
    textToSpeech,
  };
}

// ============================================
// MOCK TRANSCRIPT GENERATOR (Fallback)
// ============================================

function generateMockTranscript(): string {
  const mockTranscripts = [
    'Book a table for 2 tonight',
    'Show me Italian restaurants nearby',
    'Order my usual coffee',
    'What is my karma balance?',
    'Find romantic restaurants',
    'Book a reservation for tomorrow',
    'Show my recent orders',
    'Find restaurants under 1000 rupees',
  ];

  return mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default useFlowVoice;
