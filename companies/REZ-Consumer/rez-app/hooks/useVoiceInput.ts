/**
 * Voice Input Hook
 * Speech-to-text for AI Assistant
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';
import * as SpeechRecognition from 'expo-speech-recognition';
import { Platform } from 'react-native';
import { logger } from '@/utils/logger';

interface UseVoiceInputResult {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
}

export function useVoiceInput(): UseVoiceInputResult {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<unknown | null>(null);

  useEffect(() => {
    // Check if speech recognition is available
    const checkAvailability = async () => {
      try {
        const available = await SpeechRecognition.hasAudioPermissionAsync();
        if (!available) {
          setError('Microphone permission not granted');
        }
      } catch {
        setError('Speech recognition not available on this device');
      }
    };

    checkAvailability();
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript('');
    setIsListening(true);

    try {
      // Request permission
      const { status } = await SpeechRecognition.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('Microphone permission denied');
        setIsListening(false);
        return;
      }

      // Start recognition
      const result = await SpeechRecognition.recognitionAsync({
        showsWaveform: true,
        persistentNotification: true,
        continues: false,
      });

      if (result && result.length > 0) {
        setTranscript(result[0].transcription);
      }
    } catch (e) {
      setError('Failed to start speech recognition');
      logger.error('Speech recognition error:', e);
    } finally {
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    SpeechRecognition.stopRecognition();
  }, []);

  const speak = useCallback(async (text: string) => {
    setIsSpeaking(true);

    try {
      await Speech.speak(text, {
        language: 'en-IN',
        pitch: 1.0,
        rate: 1.0,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
      });
    } catch (e) {
      setError('Failed to speak');
      setIsSpeaking(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    isSpeaking,
    transcript,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}

// Simple voice command detection
export function useVoiceCommands() {
  const [lastCommand, setLastCommand] = useState<string | null>(null);

  const commands = [
    { pattern: /find me (.+)/i, action: 'search' },
    { pattern: /show me (.+)/i, action: 'display' },
    { pattern: /book (.+)/i, action: 'book' },
    { pattern: /order (.+)/i, action: 'order' },
    { pattern: /where is (.+)/i, action: 'location' },
    { pattern: /how much (.+)/i, action: 'price' },
    { pattern: /what is (.+)/i, action: 'info' },
    { pattern: /who is (.+)/i, action: 'info' },
    { pattern: /when (.+)/i, action: 'time' },
    { pattern: /best (.+)/i, action: 'recommend' },
    { pattern: /cheapest (.+)/i, action: 'cheapest' },
    { pattern: /nearby (.+)/i, action: 'nearby' },
    { pattern: /under (.+)/i, action: 'budget' },
  ];

  const processCommand = useCallback((text: string): { action: string; query: string } | null => {
    for (const command of commands) {
      const match = text.match(command.pattern);
      if (match) {
        setLastCommand(text);
        return {
          action: command.action,
          query: match[1] || text,
        };
      }
    }
    return null;
  }, []);

  return { lastCommand, processCommand };
}
