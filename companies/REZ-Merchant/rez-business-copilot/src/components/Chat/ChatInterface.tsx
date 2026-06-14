'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChatStore, useMessages, useIsLoading } from '@/store/chatStore';
import { QueryInput } from './QueryInput';
import { Message } from './Message';
import { SuggestedQuestions } from './SuggestedQuestions';
import type { Message as MessageType, CopilotResponse } from '@/types/copilot';

interface ChatInterfaceProps {
  merchantId?: string;
  className?: string;
}

export function ChatInterface({ merchantId = 'demo', className = '' }: ChatInterfaceProps) {
  const messages = useMessages();
  const isLoading = useIsLoading();
  const { addMessage, setLoading, addToHistory } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [suggestedQuestionsVisible, setSuggestedQuestionsVisible] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle query submission
  const handleQuerySubmit = async (query: string) => {
    if (!query.trim() || isLoading) return;

    setSuggestedQuestionsVisible(false);
    setLoading(true);

    // Add user message
    const userMessage: MessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };
    addMessage(userMessage);

    // Add to history
    addToHistory({
      id: `history-${Date.now()}`,
      query,
      timestamp: new Date(),
    });

    try {
      // Call API
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          merchantId,
          conversationHistory: messages.slice(-10),
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Add assistant message
        const assistantMessage: MessageType = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.data.answer,
          timestamp: new Date(),
          response: data.data as CopilotResponse,
        };
        addMessage(assistantMessage);
      } else {
        // Add error message
        const errorMessage: MessageType = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'I apologize, but I encountered an issue processing your query. Please try again.',
          timestamp: new Date(),
        };
        addMessage(errorMessage);
      }
    } catch (error) {
      console.error('Query error:', error);
      const errorMessage: MessageType = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an issue processing your query. Please try again.',
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle suggested question click
  const handleSuggestedQuestion = (question: string) => {
    handleQuerySubmit(question);
  };

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Business Copilot</h1>
          <p className="text-sm text-gray-500">Ask questions about your business</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 mr-1.5 bg-green-500 rounded-full animate-pulse"></span>
            Online
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-white rounded-2xl p-8 shadow-sm max-w-md">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Business Copilot</h2>
              <p className="text-gray-500 mb-6">
                Ask me anything about your business performance, get insights, and receive personalized recommendations.
              </p>

              {/* Suggested Questions */}
              <SuggestedQuestions
                onSelect={handleSuggestedQuestion}
                visible={suggestedQuestionsVisible}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-20">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-6 py-4 shadow-sm max-w-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-sm text-gray-500">Analyzing your data...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Suggested follow-up questions when there are messages */}
            {messages.length > 0 && !isLoading && (
              <SuggestedQuestions
                onSelect={handleSuggestedQuestion}
                visible={suggestedQuestionsVisible}
                variant="follow-up"
              />
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Query Input */}
      <div className="border-t bg-white p-4">
        <QueryInput
          onSubmit={handleQuerySubmit}
          disabled={isLoading}
          placeholder="Ask about your business..."
        />
      </div>
    </div>
  );
}