'use client';

import React from 'react';
import type { Message as MessageType } from '@/types/copilot';
import { AnswerText } from '@/components/Response/AnswerText';
import { MetricCard } from '@/components/Response/MetricCard';
import { Chart } from '@/components/Response/Chart';
import { ActionButtons } from '@/components/Response/ActionButtons';
import { User, Bot } from 'lucide-react';

interface MessageProps {
  message: MessageType;
  className?: string;
}

export function Message({ message, className = '' }: MessageProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''} ${className}`}>
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-primary-600' : 'bg-primary-100'
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-primary-600" />
 )}
      </div>

      {/* Message Content */}
      <div
        className={`max-w-lg ${
          isUser ? 'items-end' : 'items-start'
        } flex flex-col`}
      >
        {/* Timestamp */}
        <span className="text-xs text-gray-400 mb-1 px-1">
          {message.timestamp.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </span>

        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-5 py-4 shadow-sm ${
            isUser
              ? 'bg-primary-600 text-white rounded-tr-sm'
              : 'bg-white text-gray-900 rounded-tl-sm'
          }`}
        >
          {isUser ? (
            // User message - just text
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : (
            // Assistant message - structured response
            <div className="space-y-4">
              {/* Main answer text */}
              <AnswerText text={message.content} />

              {/* Metrics */}
              {message.response?.metrics && message.response.metrics.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {message.response.metrics.map((metric) => (
                    <MetricCard key={metric.id} metric={metric} />
                  ))}
                </div>
              )}

              {/* Charts */}
              {message.response?.charts && message.response.charts.length > 0 && (
                <div className="mt-4">
                  {message.response.charts.map((chart, index) => (
                    <Chart key={index} config={chart} />
                  ))}
                </div>
              )}

              {/* Action buttons */}
              {message.response?.actions && message.response.actions.length > 0 && (
                <div className="mt-4">
                  <ActionButtons actions={message.response.actions} />
                </div>
              )}

              {/* Follow-up suggestions */}
              {message.response?.followUpSuggestions &&
                message.response.followUpSuggestions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Try asking
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {message.response.followUpSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-full hover:bg-primary-50 hover:text-primary-700 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}