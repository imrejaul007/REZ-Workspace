/**
 * useWakeWord - "Hey Genie" Wake Word Detection
 *
 * Like Siri, OK Google, or Alexa - listen for wake word in background
 *
 * Usage:
 * ```typescript
 * import { useWakeWord } from '@/hooks/useWakeWord';
 *
 * function MyComponent() {
 *   const { isListening, startListening, stopListening, onWakeWord } = useWakeWord();
 *
 *   // Listen for "Hey Genie"
 *   await startListening();
 *
 *   // Handle wake word detected
 *   onWakeWord(() => {
 *     // Open voice assistant
 *     openAssistant();
 *   });
 * }
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import axios from 'axios';

// ============================================
// CONFIG
// ============================================

const WAKE_WORD_API_KEY = process.env.EXPO_PUBLIC_HOJAI_WAKE_WORD_API_KEY || '';
const WAKE_WORD_URL = process.env.EXPO_PUBLIC_HOJAI_WAKE_WORD_URL || 'http://localhost:4034';

// Wake words we support
export const WAKE_WORDS = [
  'hey genie',
  'genie',
  'ok genie',
  'hey genie',
  'hi genie',
] as const;

export type WakeWord = typeof WAKE_WORDS[number];

// ============================================
// TYPES
// ============================================

export interface WakeWordState {
  isListening: boolean;
  isProcessing: boolean;
  detectedWord: WakeWord | null;
  confidence: number;
  error: string | null;
  batteryLevel: number | null;
}

export interface WakeWordOptions {
  wakeWords?: readonly string[];
  language?: 'en-IN' | 'en-US' | 'hi-IN';
  sensitivity?: 'low' | 'medium' | 'high';
  onWakeWord?: (word: WakeWord, confidence: number) => void;
  onError?: (error: string) => void;
  onListeningStart?: () => void;
  onListeningStop?: () => void;
}

export interface WakeWordResult {
  detected: boolean;
  word: WakeWord | null;
  confidence: number;
}

// ============================================
// DEFAULT OPTIONS
// ============================================

const DEFAULT_OPTIONS: Required<WakeWordOptions> = {
  wakeWords: WAKE_WORDS,
  language: 'en-IN',
  sensitivity: 'medium',
  onWakeWord: () => {},
  onError: () => {},
  onListeningStart: () => {},
  onListeningStop: () => {},
};

// ============================================
// HOOK
// ============================================

export function useWakeWord(options: WakeWordOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // State
  const [state, setState] = useState<WakeWordState>({
    isListening: false,
    isProcessing: false,
    detectedWord: null,
    confidence: 0,
    error: null,
    batteryLevel: null,
  });

  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const processingRef = useRef(false);
  const audioChunkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  // ============================================
  // START LISTENING
  // ============================================

  const startListening = useCallback(async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        const error = 'Microphone permission denied';
        setState((prev) => ({ ...prev, error }));
        opts.onError(error);
        return;
      }

      // Configure audio mode for background listening
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.MAX,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      await recording.startAsync();
      recordingRef.current = recording;

      setState((prev) => ({
        ...prev,
        isListening: true,
        error: null,
      }));

      opts.onListeningStart();

      // Start processing audio chunks
      startAudioProcessing();

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to start listening';
      setState((prev) => ({ ...prev, error: errorMessage, isListening: false }));
      opts.onError(errorMessage);
    }
  }, [opts]);

  // ============================================
  // STOP LISTENING
  // ============================================

  const stopListening = useCallback(async () => {
    try {
      // Stop processing
      if (audioChunkIntervalRef.current) {
        clearInterval(audioChunkIntervalRef.current);
        audioChunkIntervalRef.current = null;
      }

      // Stop recording
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }

      setState((prev) => ({
        ...prev,
        isListening: false,
        isProcessing: false,
      }));

      opts.onListeningStop();
    } catch (error: any) {
      console.error('Stop listening error:', error);
    }
  }, [opts]);

  // ============================================
  // AUDIO PROCESSING
  // ============================================

  const startAudioProcessing = useCallback(() => {
    if (audioChunkIntervalRef.current) {
      clearInterval(audioChunkIntervalRef.current);
    }

    // Process audio every 500ms
    audioChunkIntervalRef.current = setInterval(async () => {
      if (processingRef.current || !recordingRef.current) return;

      processingRef.current = true;

      try {
        // Get current status
        const status = await recordingRef.current.getStatusAsync();
        if (!status.isRecording) {
          processingRef.current = false;
          return;
        }

        // Create form data with audio
        const uri = recordingRef.current.getURI();
        if (!uri) {
          processingRef.current = false;
          return;
        }

        // Try wake word detection via API
        const result = await detectWakeWord(uri);

        if (result.detected && result.confidence > 0.7) {
          // Wake word detected!
          setState((prev) => ({
            ...prev,
            detectedWord: result.word,
            confidence: result.confidence,
          }));

          // Haptic feedback
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Callback
          if (result.word) {
            opts.onWakeWord(result.word, result.confidence);
          }
        }
      } catch (error) {
        // Silently handle errors - just continue listening
        console.debug('Wake word check:', error);
      }

      processingRef.current = false;
    }, 500); // Check every 500ms
  }, [opts]);

  // ============================================
  // WAKE WORD DETECTION
  // ============================================

  const detectWakeWord = async (audioUri: string): Promise<WakeWordResult> => {
    // Try API first
    if (WAKE_WORD_API_KEY && WAKE_WORD_URL) {
      try {
        const formData = new FormData();
        formData.append('audio', {
          uri: audioUri,
          type: 'audio/wav',
          name: 'audio.wav',
        } as any);
        formData.append('wakeWords', JSON.stringify(opts.wakeWords));
        formData.append('sensitivity', opts.sensitivity);
        formData.append('language', opts.language);

        const response = await axios.post(`${WAKE_WORD_URL}/api/wake-word/detect`, formData, {
          headers: {
            'X-API-Key': WAKE_WORD_API_KEY,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 3000,
        });

        if (response.data?.detected) {
          return {
            detected: true,
            word: response.data.word as WakeWord,
            confidence: response.data.confidence,
          };
        }
      } catch (error) {
        // API not available, use local detection
        console.debug('Wake word API not available');
      }
    }

    // Local detection (fallback - less accurate)
    return await localWakeWordDetection(audioUri);
  };

  // ============================================
  // LOCAL DETECTION (FALLBACK)
  // ============================================

  const localWakeWordDetection = async (audioUri: string): Promise<WakeWordResult> => {
    try {
      // Fetch audio as blob
      const response = await fetch(audioUri);
      const blob = await response.blob();

      // Create audio context for basic detection
      // This is a simplified version - production would use TensorFlow.js
      // or a dedicated wake word model like Picovoice

      // For now, return no detection (API should handle it)
      return {
        detected: false,
        word: null,
        confidence: 0,
      };
    } catch (error) {
      return {
        detected: false,
        word: null,
        confidence: 0,
      };
    }
  };

  // ============================================
  // GET BATTERY LEVEL
  // ============================================

  const getBatteryLevel = useCallback(async () => {
    try {
      // This would use expo-battery if available
      // For now, return null
      return null;
    } catch (error) {
      return null;
    }
  }, []);

  // ============================================
  // TOGGLE
  // ============================================

  const toggle = useCallback(async () => {
    if (state.isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // State
    isListening: state.isListening,
    isProcessing: state.isProcessing,
    detectedWord: state.detectedWord,
    confidence: state.confidence,
    error: state.error,
    batteryLevel: state.batteryLevel,

    // Actions
    startListening,
    stopListening,
    toggle,

    // Get battery
    getBatteryLevel,

    // Constants
    supportedWakeWords: WAKE_WORDS,
  };
}

// ============================================
// SUGGESTED WAKE WORD MODELS
// ============================================

/**
 * For production wake word detection, consider these options:
 *
 * 1. Picovoice Porcupine (Recommended)
 *    - Offline, privacy-friendly
 *    - Custom wake words supported
 *    - Very low battery usage
 *    - npm: @picovoice/porcupine
 *
 * 2. Sensory "Hey Genie" (Cloud)
 *    - Very accurate
 *    - Requires internet
 *    - Higher battery usage
 *
 * 3. TensorFlow.js + Custom Model
 *    - Can run offline
 *    - More complex setup
 *    - Fine-tuned for your use case
 *
 * 4. Vosk + Keyword Spotting
 *    - Open source
 *    - Good accuracy
 *    - Medium complexity
 */

// ============================================
// INTEGRATION WITH useFlowVoice
// ============================================

/**
 * Full example - combining wake word with voice:
 *
 * ```typescript
 * import { useWakeWord } from '@/hooks/useWakeWord';
 * import { useFlowVoice } from '@/hooks/useFlowVoice';
 *
 * function VoiceAssistant() {
 *   const wakeWord = useWakeWord({
 *     onWakeWord: async (word, confidence) => {
 *       // Open assistant UI
 *       setIsOpen(true);
 *
 *       // Announce ready
 *       await flow.speak('Yes? How can I help?');
 *     },
 *   });
 *
 *   const flow = useFlowVoice();
 *
 *   // Start listening for wake word
 *   useEffect(() => {
 *     wakeWord.startListening();
 *     return () => wakeWord.stopListening();
 *   }, []);
 *
 *   // When assistant opens, listen for command
 *   const handleCommand = async () => {
 *     await wakeWord.stopListening();
 *     await flow.startListening();
 *
 *     const text = await flow.stopListening();
 *     // Process command...
 *
 *     // Resume wake word listening
 *     await wakeWord.startListening();
 *   };
 *
 *   return (
 *     <TouchableOpacity onPress={handleCommand}>
 *       <MicIcon />
 *     </TouchableOpacity>
 *   );
 * }
 * ```
 */

export default useWakeWord;