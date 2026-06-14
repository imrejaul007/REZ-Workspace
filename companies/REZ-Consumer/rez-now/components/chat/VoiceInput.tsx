'use client';

/**
 * Voice Input Component
 *
 * Provides speech-to-text functionality for the chat widget.
 * Features:
 * - Microphone button
 * - Speech recognition
 * - Auto-submit option
 * - Visual feedback during recording
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  autoSubmit?: boolean;
  className?: string;
  placeholder?: string;
}

type SpeechRecognitionEvent = {
  results: Array<{
    0: { transcript: string };
    isFinal: boolean;
    length: number;
  }>;
};

type SpeechRecognitionErrorEvent = {
  error: string;
};

type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function VoiceInput({
  onTranscript,
  disabled = false,
  autoSubmit = true,
  className,
  placeholder = 'Press the mic button to speak',
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check for browser support
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Indian English

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.results.length - 1; i >= 0; i--) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcriptText;
        } else {
          interimTranscript += transcriptText;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        if (autoSubmit) {
          onTranscript(finalTranscript);
          setTranscript('');
        }
      } else {
        setTranscript(interimTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(event.error);
      setIsListening(false);

      // Don't show error for 'no-speech' as it's expected
      if (event.error !== 'no-speech') {
        logger.error('[VoiceInput] Speech recognition error:', { error: event.error });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // If we have interim results but recognition ended, submit them
      if (transcript && autoSubmit) {
        onTranscript(transcript);
        setTranscript('');
      }
    };

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isSupported, onTranscript, autoSubmit, transcript]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || disabled || isListening) return;

    try {
      recognitionRef.current.start();
    } catch (err) {
      // Recognition might already be running
      logger.error('[VoiceInput] Failed to start recognition:', { error: err });
    }
  }, [disabled, isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;

    try {
      recognitionRef.current.stop();
    } catch (err) {
      logger.error('[VoiceInput] Failed to stop recognition:', { error: err });
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  if (!isSupported) {
    return (
      <div className={cn('flex items-center justify-center text-xs text-gray-400', className)}>
        Voice input not supported in this browser
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Microphone Button */}
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        className={cn(
          'relative flex items-center justify-center',
          'w-12 h-12 rounded-full',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          isListening
            ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400 animate-pulse'
            : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        aria-label={isListening ? 'Stop recording' : 'Start voice input'}
      >
        {/* Sound waves animation */}
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-25" />
            <span className="absolute inset-2 rounded-full bg-red-400 animate-pulse opacity-50" />
          </>
        )}

        {/* Microphone Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={cn(
            'w-6 h-6 text-white transition-transform',
            isListening && 'scale-110'
          )}
        >
          {isListening ? (
            // Stop icon
            <path d="M6 6h12v12H6V6z" />
          ) : (
            // Microphone icon
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          )}
        </svg>
      </button>

      {/* Transcript Preview */}
      {(transcript || isListening) && (
        <div className="text-center">
          <p className={cn(
            'text-xs text-gray-500 dark:text-gray-400',
            'animate-pulse',
            isListening && 'text-red-500'
          )}>
            {transcript || 'Listening...'}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}

      {/* Helper Text */}
      {!transcript && !isListening && !error && (
        <p className="text-xs text-gray-400 text-center">
          {placeholder}
        </p>
      )}
    </div>
  );
}
