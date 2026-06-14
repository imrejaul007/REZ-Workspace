'use client';

import { useState, useCallback, useRef, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils/cn';

const MAX_MESSAGE_LENGTH = 500;
const CHAR_COUNTER_THRESHOLD = 400;

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  isLoading = false,
  disabled = false,
  placeholder = 'Ask about menu, order, or book...',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charsLeft = MAX_MESSAGE_LENGTH - value.length;
  const isOverThreshold = value.length >= CHAR_COUNTER_THRESHOLD;
  const canSend = value.trim().length > 0 && !isLoading && !disabled;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSend(value.trim());
    setValue('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [canSend, onSend, value]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      if (text.length > MAX_MESSAGE_LENGTH) return;
      setValue(text);

      // Auto-grow textarea
      const ta = e.target;
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    },
    []
  );

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          aria-label="Chat message"
          aria-describedby={isOverThreshold ? 'chat-char-counter' : undefined}
          disabled={disabled || isLoading}
          className={cn(
            'flex-1 resize-none rounded-xl border border-gray-200',
            'px-3 py-2 text-sm leading-relaxed',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-h-[40px] max-h-[120px] overflow-y-auto'
          )}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          className={cn(
            'flex-shrink-0 p-2.5 rounded-xl',
            'transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
            canSend
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <svg
              className="animate-spin w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
              aria-hidden="true"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>

      {isOverThreshold && (
        <p
          id="chat-char-counter"
          className={cn('text-xs text-right', charsLeft <= 0 ? 'text-red-500' : 'text-gray-400')}
          aria-live="polite"
        >
          {charsLeft} character{charsLeft !== 1 ? 's' : ''} remaining
        </p>
      )}
    </div>
  );
}
