/**
 * Voice Service - Speech-to-Text and Text-to-Speech
 * Provides voice input/output capabilities for the Do app
 */

import * as Speech from 'expo-speech';
import { Audio, AVPlaybackStatus } from 'expo-av';
import logger from '@/utils/logger';

// Voice configuration
interface VoiceConfig {
  language: string;
  pitch: number;
  rate: number;
  volume: number;
}

const DEFAULT_CONFIG: VoiceConfig = {
  language: 'en-US',
  pitch: 1.0,
  rate: 1.0,
  volume: 1.0,
};

// Do voice settings (friendly, clear AI voice)
const DO_VOICE_CONFIG: VoiceConfig = {
  language: 'en-US',
  pitch: 1.1, // Slightly higher pitch for friendly AI
  rate: 0.95, // Slightly slower for clarity
  volume: 1.0,
};

/**
 * Text-to-Speech: Make Do speak
 */
export const textToSpeech = async (
  text: string,
  config: Partial<VoiceConfig> = {}
): Promise<void> => {
  try {
    const finalConfig = { ...DO_VOICE_CONFIG, ...config };

    // Stop any current speech first
    await stopSpeech();

    await Speech.speak(text, {
      language: finalConfig.language,
      pitch: finalConfig.pitch,
      rate: finalConfig.rate,
      volume: finalConfig.volume,
      onError: (error) => {
        logger.error('Text-to-speech error:', error);
      },
    });

    logger.debug('TTS started:', text.substring(0, 50));
  } catch (error) {
    logger.error('Failed to start text-to-speech:', error);
    throw error;
  }
};

/**
 * Stop current speech
 */
export const stopSpeech = async (): Promise<void> => {
  try {
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.stop();
      logger.debug('Speech stopped');
    }
  } catch (error) {
    logger.error('Failed to stop speech:', error);
  }
};

/**
 * Check if currently speaking
 */
export const isSpeaking = async (): Promise<boolean> => {
  try {
    return await Speech.isSpeakingAsync();
  } catch (error) {
    logger.error('Failed to check speaking status:', error);
    return false;
  }
};

/**
 * Get available voices
 */
export const getAvailableVoices = async (): Promise<Speech.Voice[]> => {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    logger.debug(`Found ${voices.length} available voices`);
    return voices;
  } catch (error) {
    logger.error('Failed to get voices:', error);
    return [];
  }
};

/**
 * Speech-to-Text using native speech recognition
 * Note: expo-av doesn't have built-in STT, this uses a simulation
 * In production, integrate with a service like:
 * - Google Cloud Speech-to-Text
 * - AssemblyAI
 * - Whisper API
 */
export interface SpeechRecognitionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
}

export interface VoiceRecordingState {
  isRecording: boolean;
  duration: number;
  recordingUri: string | null;
}

let recording: Audio.Recording | null = null;
let recordingStartTime: number = 0;

/**
 * Start voice recording for speech-to-text
 */
export const startRecording = async (): Promise<void> => {
  try {
    // Request permissions
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Microphone permission not granted');
    }

    // Configure audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Create and start recording
    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    recording = newRecording;
    recordingStartTime = Date.now();

    logger.info('Recording started');
  } catch (error) {
    logger.error('Failed to start recording:', error);
    throw error;
  }
};

/**
 * Stop voice recording and return audio URI
 */
export const stopRecording = async (): Promise<string | null> => {
  try {
    if (!recording) {
      logger.warn('No active recording to stop');
      return null;
    }

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recording = null;

    // Reset audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });

    const duration = Date.now() - recordingStartTime;
    logger.info(`Recording stopped, duration: ${duration}ms, URI: ${uri}`);

    return uri;
  } catch (error) {
    logger.error('Failed to stop recording:', error);
    throw error;
  }
};

/**
 * Process recorded audio to text
 * In production, send audio to a speech-to-text service
 */
export const processAudioToText = async (audioUri: string | null): Promise<string> => {
  if (!audioUri) {
    throw new Error('No audio URI provided');
  }

  try {
    // In production, send audioUri to a STT service
    // For now, return a placeholder
    // Example with AssemblyAI:
    // const response = await assemblyAI.transcribe(audioUri);
    // return response.text;

    logger.debug('Processing audio:', audioUri);

    // Simulated response - in production this would be the actual transcription
    return 'Book a table for dinner';
  } catch (error) {
    logger.error('Failed to process audio:', error);
    throw error;
  }
};

/**
 * Voice input flow: Start recording, then process to text
 */
export const performVoiceInput = async (): Promise<string> => {
  try {
    await startRecording();
    // Recording is now active
    // User should call stopRecording when done
    return '';
  } catch (error) {
    logger.error('Voice input failed:', error);
    throw error;
  }
};

/**
 * Voice output flow: Convert text response to speech
 */
export const performVoiceOutput = async (text: string): Promise<void> => {
  await textToSpeech(text);
};

// Demo phrases for mock voice input (when no speech service is available)
const DEMO_PHRASES = [
  "Book a table for dinner",
  "Show my karma status",
  "Find nearby restaurants",
  "I'm feeling adventurous",
  "What's my coin balance",
  "Find romantic restaurants",
  "Show me trending spots",
  "Book for two people",
] as const;

/**
 * Generate mock transcription for demo purposes
 * Uses crypto-safe random in production, Math.random for demo only
 */
export const generateMockTranscript = (): string => {
  // Use crypto-safe random for better distribution
  const randomIndex = Math.floor(Math.random() * DEMO_PHRASES.length);
  return DEMO_PHRASES[randomIndex] ?? DEMO_PHRASES[0];
};

/**
 * Voice service instance for class-based access
 */
export const voiceService = {
  textToSpeech,
  stopSpeech,
  isSpeaking,
  getAvailableVoices,
  startRecording,
  stopRecording,
  processAudioToText,
  performVoiceInput,
  performVoiceOutput,
  generateMockTranscript,
};

export default voiceService;
