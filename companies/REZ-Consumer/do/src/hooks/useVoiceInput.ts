/**
 * Voice Input Hook - Speech recognition and synthesis for Do app
 * Provides real-time voice transcription and TTS playback
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import * as Permissions from 'expo-av';
import { voiceService, generateMockTranscript } from '@/services/voiceService';
import logger from '@/utils/logger';

// Voice input state
export interface VoiceInputState {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
  audioLevel: number; // 0-1 for waveform visualization
}

// Voice input options
export interface UseVoiceInputOptions {
  onTranscript?: (text: string) => void;
  onError?: (error: Error) => void;
  onListeningStart?: () => void;
  onListeningEnd?: () => void;
  enableMock?: boolean; // Use mock transcription for demo
  autoSubmit?: boolean; // Auto-submit transcript after recognition
}

const DEFAULT_OPTIONS: UseVoiceInputOptions = {
  enableMock: true, // Default to mock for demo
  autoSubmit: true,
};

/**
 * Voice Input Hook
 * Manages speech recognition state and provides callbacks
 */
export const useVoiceInput = (options: UseVoiceInputOptions = DEFAULT_OPTIONS) => {
  const {
    onTranscript,
    onError,
    onListeningStart,
    onListeningEnd,
    enableMock = true,
    autoSubmit = true,
  } = { ...DEFAULT_OPTIONS, ...options };

  // State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check speech support on mount
  useEffect(() => {
    const checkSupport = async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        const hasVoices = voices.length > 0;
        setIsSupported(hasVoices);
        logger.debug(`Speech support: ${hasVoices ? 'available' : 'limited'}`);
      } catch (err) {
        logger.warn('Speech support check failed:', err);
        setIsSupported(true); // Assume supported, degrade gracefully
      }
    };

    checkSupport();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (mockTimeoutRef.current) {
        clearTimeout(mockTimeoutRef.current);
      }
      voiceService.stopSpeech();
    };
  }, []);

  /**
   * Start listening for voice input
   */
  const startListening = useCallback(async () => {
    try {
      setError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Request microphone permission
      const { status } = await Permissions.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Microphone permission denied');
      }

      setIsListening(true);
      onListeningStart?.();

      // Start audio level simulation for waveform
      startAudioLevelSimulation();

      // For mock mode, simulate recognition after timeout
      if (enableMock) {
        startMockRecognition();
      } else {
        // In production, start actual speech recognition here
        // This would connect to a service like:
        // - Google Cloud Speech-to-Text
        // - AssemblyAI
        // - Web Speech API
        startMockRecognition();
      }

      logger.info('Voice input started');
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to start voice input:', error);
      setError(error.message);
      setIsListening(false);
      onError?.(error);
    }
  }, [enableMock, onError, onListeningStart]);

  /**
   * Stop listening for voice input
   */
  const stopListening = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Stop any pending timeouts/intervals
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (mockTimeoutRef.current) {
        clearTimeout(mockTimeoutRef.current);
        mockTimeoutRef.current = null;
      }

      setIsListening(false);
      setAudioLevel(0);
      onListeningEnd?.();

      logger.info('Voice input stopped');
    } catch (err) {
      logger.error('Failed to stop voice input:', err);
    }
  }, [onListeningEnd]);

  /**
   * Simulate audio level changes for waveform visualization
   */
  const startAudioLevelSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      // Generate pseudo-random audio level for visualization
      const level = Math.random() * 0.7 + 0.2; // 0.2 to 0.9
      setAudioLevel(level);
    }, 100);
  }, []);

  /**
   * Mock voice recognition for demo purposes
   */
  const startMockRecognition = useCallback(() => {
    if (mockTimeoutRef.current) {
      clearTimeout(mockTimeoutRef.current);
    }

    // Simulate recognition after 3-5 seconds
    const duration = 3000 + Math.random() * 2000;
    mockTimeoutRef.current = setTimeout(async () => {
      // Generate mock transcript
      const mockText = generateMockTranscript();

      setTranscript(mockText);
      setIsListening(false);
      setAudioLevel(0);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Haptic feedback for completion
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Handle transcript
      onTranscript?.(mockText);

      // Auto-submit if enabled
      if (autoSubmit && mockText) {
        logger.debug('Auto-submitting mock transcript:', mockText);
      }

      logger.info('Mock voice recognition complete:', mockText);
    }, duration);
  }, [autoSubmit, onTranscript]);

  /**
   * Speak text using TTS
   */
  const speak = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await voiceService.textToSpeech(text, {
        language: 'en-US',
        pitch: 1.1,
        rate: 0.95,
      });

      logger.info('Speaking:', text.substring(0, 50));
    } catch (err) {
      logger.error('Speech failed:', err);
      setIsSpeaking(false);
    }
  }, []);

  /**
   * Stop speaking
   */
  const stopSpeaking = useCallback(async () => {
    try {
      await voiceService.stopSpeech();
      setIsSpeaking(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      logger.debug('Speaking stopped');
    } catch (err) {
      logger.error('Stop speaking failed:', err);
    }
  }, []);

  /**
   * Clear current transcript
   */
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  /**
   * Toggle listening state
   */
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Return hook interface
  return {
    // State
    isListening,
    isSpeaking,
    isSupported,
    transcript,
    error,
    audioLevel,

    // Actions
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
    clearTranscript,
  };
};

/**
 * Voice input hook for text-to-speech only
 * Use this when you only need Do to speak responses
 */
export const useVoiceOutput = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const checkSupport = async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        setIsSupported(voices.length > 0);
      } catch {
        setIsSupported(true);
      }
    };
    checkSupport();
  }, []);

  const speak = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true);
      await voiceService.textToSpeech(text);
    } catch (err) {
      logger.error('TTS failed:', err);
    }
  }, []);

  const stop = useCallback(async () => {
    await voiceService.stopSpeech();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, isSupported, speak, stop };
};

export default useVoiceInput;
