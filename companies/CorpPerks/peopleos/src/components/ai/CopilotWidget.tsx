'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CopilotResponse } from '@/lib/ai/client';

// Generate unique ID using crypto
function generateUniqueId(): string {
  return crypto.randomUUID();
}

// Secure random index for array selection
function secureRandomIndex(length: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % length;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: Record<string, any>;
  visualizations?: CopilotResponse['visualizations'];
  actionItems?: CopilotResponse['actionItems'];
  confidence?: number;
  timestamp: Date;
}

interface CopilotWidgetProps {
  expanded?: boolean;
  className?: string;
}

const SUGGESTIONS = [
  'Why is attrition increasing?',
  'Show attendance trends',
  'What is the productivity score?',
  'Who is at risk of leaving?',
  'Compare department performance',
];

export default function CopilotWidget({ expanded = false, className = '' }: CopilotWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = useCallback(async (e?: React.FormEvent, customQuery?: string) => {
    e?.preventDefault();
    const queryToUse = customQuery || query;
    if (!queryToUse.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: queryToUse,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customQuery) setQuery('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Simulate AI response (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1500));

      const responses = [
        "Based on the data, I can see several key patterns emerging. The attrition rate has increased by 15% compared to last quarter, primarily in the Engineering and Support departments.",
        "Looking at the attendance data, there's a concerning trend in the Support team with a 23% increase in late arrivals over the past two weeks.",
        "The workforce health score is currently at 72/100, which is in the 'Fair' range. The main drivers of this are declining engagement scores and increased overtime hours.",
        "I've identified 3 employees at high risk of attrition. They show signs of declining engagement, reduced project activity, and irregular attendance patterns.",
      ];

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responses[secureRandomIndex(responses.length)],
        // Statistical simulation: confidence 0.75-0.95
        confidence: 0.75 + (secureRandom() * 0.2),
        timestamp: new Date(),
        actionItems: [
          { text: 'Review high-risk employee profiles', priority: 'high', category: 'attrition' },
          { text: 'Schedule 1:1 meetings', priority: 'medium', category: 'engagement' },
          { text: 'Analyze overtime patterns', priority: 'medium', category: 'productivity' },
        ],
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [query, isLoading]);

  const handleSuggestionClick = (suggestion: string) => {
    handleSubmit(undefined, suggestion);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, idx) => {
      let formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');

      if (line.startsWith('•') || line.startsWith('-')) {
        return (
          <div key={idx} className="ml-4 flex gap-2 my-1" dangerouslySetInnerHTML={{ __html: formatted }} />
        );
      }
      if (line.match(/^[A-Z][^a-z]+:/)) {
        return (
          <p key={idx} className="font-semibold mt-3 text-gray-900" dangerouslySetInnerHTML={{ __html: formatted }} />
        );
      }
      if (!line.trim()) {
        return <br key={idx} />;
      }
      return (
        <p key={idx} className="my-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    });
  };

  return (
    <>
      {/* Floating Button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={`
            fixed bottom-6 right-6 w-16 h-16
            bg-gradient-to-br from-indigo-600 to-purple-600
            hover:from-indigo-700 hover:to-purple-700
            text-white rounded-full shadow-2xl
            flex items-center justify-center
            transition-all duration-300
            hover:scale-110 active:scale-95
            z-50 ${className}
          `}
        >
          <span className="text-2xl">🧠</span>
          {/* Notification badge */}
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            !
          </span>
        </button>
      )}

      {/* Expanded Widget */}
      {isExpanded && (
        <div className={`
          fixed bottom-6 right-6 w-[420px] max-h-[700px]
          bg-white rounded-2xl shadow-2xl border border-gray-200
          flex flex-col overflow-hidden
          z-50 animate-slide-up ${className}
        `}>
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="font-bold text-white">Workforce Copilot</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-indigo-200">AI-powered insights</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Clear chat"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">👋</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">How can I help?</h4>
                <p className="text-gray-500 text-sm mb-4">Ask me anything about your workforce data</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTIONS.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1.5 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-full text-xs text-gray-700 hover:text-indigo-700 transition-all shadow-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'user' ? (
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[85%] shadow-sm">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm max-w-[85%] shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm">🤖</span>
                      </div>
                      <span className="text-xs text-gray-500">AI Assistant</span>
                      {message.confidence && (
                        <span className="ml-auto text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                          {Math.round(message.confidence * 100)}% confident
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {formatContent(message.content)}
                    </div>

                    {/* Action Items */}
                    {message.actionItems && message.actionItems.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs font-medium text-gray-500 mb-2">Recommended Actions:</div>
                        <div className="space-y-1.5">
                          {message.actionItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                item.priority === 'high' ? 'bg-red-500' :
                                item.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                              }`} />
                              <span className="text-gray-700">{item.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-gray-500">Analyzing your data...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length > 0 && !isLoading && (
            <div className="px-4 pb-2 bg-gray-50 border-t border-gray-100">
              <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
                {SUGGESTIONS.slice(0, 3).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1 bg-white border border-gray-200 hover:border-indigo-300 rounded-full text-xs text-gray-600 hover:text-indigo-700 whitespace-nowrap transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about attrition, attendance, productivity..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className={`
                  p-2.5 rounded-xl font-medium transition-all
                  ${query.trim() && !isLoading
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
