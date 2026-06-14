/**
 * useGenieVoice - React hook for Genie Voice AI
 *
 * Integrated with DO App, Genie Services, and HOJAI AI
 *
 * Usage:
 * ```typescript
 * import { useGenieVoice } from '@/hooks/useGenieVoice';
 *
 * function VoiceAssistant() {
 *   const {
 *     isListening,
 *     transcript,
 *     speak,
 *     processVoiceCommand,
 *   } = useGenieVoice({ userId });
 *
 *   const handleVoiceCommand = async () => {
 *     await startListening();
 *     const audio = await stopListening();
 *     const result = await processVoiceCommand(audio);
 *     await speak(result.text);
 *   };
 * }
 * ```
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { genieVoiceService, GenieBriefing, GenieMemory } from '../services/genieVoiceService';

// ============================================
// TYPES
// ============================================

export interface UseGenieVoiceOptions {
  userId: string;
  language?: 'en-IN' | 'hi-IN' | 'hinglish';
  autoWakeWord?: boolean;
  onWakeWord?: () => void;
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
  onError?: (error: Error) => void;
}

export interface GenieVoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  transcript: string;
  response: string;
  error: string | null;
  audioLevel: number;
  wakeWordDetected: boolean;
}

export interface VoiceCommandResult {
  text: string;
  action?: string;
  confidence: number;
  data?: Record<string, unknown>;
}

// ============================================
// DEFAULT OPTIONS
// ============================================

const DEFAULT_OPTIONS: Required<UseGenieVoiceOptions> = {
  userId: '',
  language: 'en-IN',
  autoWakeWord: false,
  onWakeWord: () => {},
  onTranscript: () => {},
  onResponse: () => {},
  onError: () => {},
};

// ============================================
// HOOK
// ============================================

export function useGenieVoice(options: UseGenieVoiceOptions) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // State
  const [state, setState] = useState<GenieVoiceState>({
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    transcript: '',
    response: '',
    error: null,
    audioLevel: 0,
    wakeWordDetected: false,
  });

  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // ============================================
  // VOICE RECORDING
  // ============================================

  /**
   * Start listening for voice input
   */
  const startListening = useCallback(async (): Promise<void> => {
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
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;

      setState((prev) => ({
        ...prev,
        isListening: true,
        transcript: '',
        error: null,
      }));

      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    } catch (error) {
      setState((prev) => ({ ...prev, error: (error as Error).message, isListening: false }));
      opts.onError(error as Error);
    }
  }, [opts]);

  /**
   * Stop listening and get audio URI
   */
  const stopListening = useCallback(async (): Promise<string> => {
    if (!recordingRef.current) {
      throw new Error('No recording in progress');
    }

    try {
      setState((prev) => ({ ...prev, isProcessing: true }));

      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      // Configure for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      setState((prev) => ({
        ...prev,
        isListening: false,
        isProcessing: false,
      }));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      return uri || '';

    } catch (error) {
      setState((prev) => ({
        ...prev,
        isListening: false,
        isProcessing: false,
        error: (error as Error).message,
      }));
      throw error;
    }
  }, []);

  /**
   * Process voice command through Genie
   */
  const processVoiceCommand = useCallback(async (audioUri: string): Promise<VoiceCommandResult> => {
    if (!audioUri) {
      throw new Error('No audio to process');
    }

    setState((prev) => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await genieVoiceService.processVoiceCommand(audioUri, {
        language: opts.language,
        context: { userId: opts.userId },
      });

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        transcript: '', // Would be set from transcription
        response: result.text,
      }));

      opts.onTranscript(result.text);
      opts.onResponse(result.text);

      return result;

    } catch (error) {
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: (error as Error).message,
      }));
      opts.onError(error as Error);
      throw error;
    }
  }, [opts]);

  // ============================================
  // SPEAK / TTS
  // ============================================

  /**
   * Speak text response
   */
  const speak = useCallback(async (text: string): Promise<void> => {
    setState((prev) => ({ ...prev, isSpeaking: true, response: text }));

    try {
      // Try Genie Voice service first
      await genieVoiceService.speak(text, opts.language);

      // Fallback to expo-speech
      await new Promise<void>((resolve, reject) => {
        Speech.speak(text, {
          language: opts.language === 'hinglish' ? 'hi-IN' : opts.language,
          pitch: 1.0,
          rate: 1.0,
          onDone: () => {
            setState((prev) => ({ ...prev, isSpeaking: false }));
            resolve();
          },
          onError: (e) => {
            console.warn('Speech error:', e);
            setState((prev) => ({ ...prev, isSpeaking: false }));
            resolve(); // Don't fail on speech error
          },
        });
      });

    } catch (error) {
      console.warn('TTS failed:', error);
      setState((prev) => ({ ...prev, isSpeaking: false }));
    }
  }, [opts.language]);

  /**
   * Stop speaking
   */
  const stopSpeaking = useCallback(async (): Promise<void> => {
    Speech.stop();
    setState((prev) => ({ ...prev, isSpeaking: false }));
  }, []);

  // ============================================
  // TOGGLE
  // ============================================

  /**
   * Toggle listening
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
  // GENIE MEMORY
  // ============================================

  /**
   * Remember something
   */
  const remember = useCallback(async (
    content: string,
    type: GenieMemory['type'] = 'fact',
    metadata?: Record<string, unknown>
  ): Promise<GenieMemory> => {
    return genieVoiceService.remember(opts.userId, content, type, metadata);
  }, [opts.userId]);

  /**
   * Recall memories
   */
  const recall = useCallback(async (query?: string): Promise<GenieMemory[]> => {
    return genieVoiceService.recall(opts.userId, query);
  }, [opts.userId]);

  /**
   * Get user's usual/preferences
   */
  const getUsual = useCallback(async (): Promise<Record<string, unknown>> => {
    return genieVoiceService.getUsual(opts.userId);
  }, [opts.userId]);

  // ============================================
  // BRIEFING
  // ============================================

  /**
   * Get daily briefing
   */
  const getBriefing = useCallback(async (): Promise<GenieBriefing> => {
    return genieVoiceService.getBriefing(opts.userId);
  }, [opts.userId]);

  /**
   * Generate morning briefing
   */
  const generateBriefing = useCallback(async (): Promise<GenieBriefing> => {
    return genieVoiceService.generateBriefing(opts.userId);
  }, [opts.userId]);

  // ============================================
  // FULL VOICE FLOW
  // ============================================

  /**
   * Complete voice interaction flow
   * 1. Start listening
   * 2. Wait for user to speak
   * 3. Stop and process
   * 4. Speak response
   */
  const voiceInteraction = useCallback(async (): Promise<VoiceCommandResult> => {
    // 1. Start listening
    await startListening();

    // 2. (User speaks - this is async, UI handles showing "listening")

    // 3. Stop when done
    const audioUri = await stopListening();

    // 4. Process command
    const result = await processVoiceCommand(audioUri);

    // 5. Speak response
    await speak(result.text);

    return result;
  }, [startListening, stopListening, processVoiceCommand, speak]);

  // ============================================
  // CLEANUP
  // ============================================

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      Speech.stop();
    };
  }, []);

  // ============================================
  // RETURN
  // ============================================

  return {
    // State
    ...state,

    // Voice actions
    startListening,
    stopListening,
    toggleListening,
    processVoiceCommand,
    voiceInteraction,

    // Speech
    speak,
    stopSpeaking,

    // Genie Memory
    remember,
    recall,
    getUsual,

    // Briefing
    getBriefing,
    generateBriefing,

    // Helpers
    clearTranscript: () => setState((prev) => ({ ...prev, transcript: '', response: '' })),
    clearError: () => setState((prev) => ({ ...prev, error: null })),

    // Service access
    service: genieVoiceService,
  };
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default useGenieVoice;