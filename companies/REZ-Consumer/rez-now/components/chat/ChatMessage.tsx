'use client';

import { useState, useRef } from 'react';
import { AIMessage } from '@/lib/api/chat';
import { cn } from '@/lib/utils/cn';
import OrderSuggestion from './OrderSuggestion';
import ReservationSuggestion from './ReservationSuggestion';
import { useStore } from '@/app/[storeSlug]/StoreContextProvider';

interface OrderItem {
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}

interface ReservationItem {
  date: string;
  time: string;
  guests: number;
  name?: string;
  phone?: string;
}

interface ChatMessageProps {
  message: AIMessage;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const { store } = useStore();
  const isUser = message.role === 'user';
  const [showTimestamp, setShowTimestamp] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isAssistant = message.role === 'assistant';
  const msgType = message.type ?? 'text';

  // Type-narrowed metadata accessors
  const metadata = message.metadata ?? {};
  const orderItems = (msgType === 'order' ? metadata.items as OrderItem[] | undefined : undefined);
  const reservationParams = (msgType === 'reservation' ? metadata.reservationParams as ReservationItem | undefined : undefined);
  const hasRecommendation = isAssistant && msgType === 'recommendation' && !metadata.items;

  return (
    <div
      className={cn('flex flex-col gap-0.5', isUser ? 'items-end' : 'items-start')}
    >
      <div
        ref={bubbleRef}
        role="article"
        aria-label={`${isUser ? 'You' : 'AI assistant'}: ${message.content}`}
        onMouseEnter={() => setShowTimestamp(true)}
        onMouseLeave={() => setShowTimestamp(false)}
        onFocus={() => setShowTimestamp(true)}
        onBlur={() => setShowTimestamp(false)}
        className={cn(
          'max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed break-words',
          'transition-colors focus:outline-2 focus:outline-offset-2',
          isUser
            ? 'bg-indigo-600 text-white rounded-br-sm focus:outline-indigo-300'
            : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100 focus:outline-indigo-400'
        )}
        tabIndex={0}
      >
        {/* Text content */}
        <p className="whitespace-pre-wrap">{message.content}</p>

        {/* Order suggestion */}
        {orderItems && orderItems.length > 0 && (
          <div className="mt-2">
            <OrderSuggestion
              items={orderItems}
              storeSlug={store.slug}
            />
          </div>
        )}

        {/* Reservation suggestion */}
        {reservationParams && (
          <div className="mt-2">
            <ReservationSuggestion
              params={reservationParams}
              storeSlug={store.slug}
            />
          </div>
        )}

        {/* Handoff notice */}
        {isAssistant && msgType === 'handoff' && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-1.5">A team member will be with you shortly.</p>
          </div>
        )}

        {/* Recommendation preview */}
        {hasRecommendation && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-indigo-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  fillRule="evenodd"
                  d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                  clipRule="evenodd"
                />
              </svg>
              Recommendation
            </div>
          </div>
        )}
      </div>

      {/* Timestamp */}
      <span
        className={cn(
          'text-[10px] transition-opacity duration-150',
          showTimestamp ? 'opacity-100' : 'opacity-0',
          isUser ? 'text-indigo-300' : 'text-gray-400'
        )}
        aria-label={`Sent at ${formattedTime}`}
      >
        {formattedTime}
      </span>
    </div>
  );
}
