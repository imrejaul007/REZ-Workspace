// Type declarations for optional Expo modules
// These modules may not be installed in all environments

declare module 'expo-speech' {
  export interface SpeechOptions {
    language?: string;
    pitch?: number;
    rate?: number;
    onDone?: () => void;
    onError?: (error: Error) => void;
    onStopped?: () => void;
  }

  export const speak: (text: string, options?: SpeechOptions) => Promise<void>;
  export const stop: () => void;
  export const isSpeaking: () => Promise<boolean>;
}

declare module 'expo-speech-recognition' {
  export const requestPermissionsAsync: () => Promise<{ status: string }>;
  export const hasAudioPermissionAsync: () => Promise<boolean>;
  export const recognitionAsync: (options?: {
    showsWaveform?: boolean;
    persistentNotification?: boolean;
    continues?: boolean;
  }) => Promise<Array<{ transcription: string }>>;
  export const stopRecognition: () => void;
  export const SpeechRecognitionResult: {
    prototype: object;
  };
}
