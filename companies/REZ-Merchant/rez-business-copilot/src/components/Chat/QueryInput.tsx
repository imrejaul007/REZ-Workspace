'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import { useChatStore } from '@/store/chatStore';
import { Mic, Send, X } from 'lucide-react';

interface QueryInputProps {
  onSubmit: (query: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function QueryInput({
  onSubmit,
  disabled = false,
  placeholder = 'Ask a question...',
  className = '',
}: QueryInputProps) {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { setVoiceInputState } = useChatStore();

  // Handle form submission
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim() && !disabled) {
      onSubmit(query.trim());
      setQuery('');
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    // Auto-resize
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  };

  // Voice input using Web Speech API
  const toggleVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition || window.SpeechRecognition;

    if (isListening) {
      setIsListening(false);
      setVoiceInputState({ isListening: false });
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceInputState({ isListening: true });
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');
        setQuery(transcript);
        setVoiceInputState({ transcript });
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setVoiceInputState({ error: event.error, isListening: false });
      };

      recognition.onend = () => {
        setIsListening(false);
        setVoiceInputState({ isListening: false });
      };

      recognition.start();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex items-end gap-3 ${className}`}>
      <div className="flex-1 relative">
        <textarea
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-gray-50 transition-all"
          style={{ minHeight: '48px', maxHeight: '150px' }}
        />

        {/* Voice Button */}
        <button
          type="button"
          onClick={toggleVoiceInput}
          disabled={disabled}
          className={`absolute right-2 bottom-2 p-2 rounded-full transition-all ${
            isListening
              ? 'bg-error-100 text-error-600 animate-pulse'
              : 'bg-gray-100 text-gray-600 hover:bg-primary-100 hover:text-primary-600'
          }`}
          title={isListening ? 'Stop recording' : 'Start voice input'}
        >
          <Mic className="w-5 h-5" />
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!query.trim() || disabled}
        className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
}