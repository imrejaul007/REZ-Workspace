"use client";

import { useState, useRef, useEffect } from "react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import QuickActions from "@/components/QuickActions";
import Recommendations from "@/components/Recommendations";
import { Message } from "@/types/chat";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi there! I'm your REZ Assistant. I can help you find products, track orders, answer questions, and more. What can I help you with today?",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "I found some great options for you! Let me show you some recommendations based on what you're looking for.",
        "That's a popular choice! We have several variants available. Would you like to see them?",
        "I can help you with that. Here are some products that match your interests.",
        "Great question! Let me find the best options for you.",
      ];

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
      setShowRecommendations(true);
    }, 1500);
  };

  const handleQuickAction = (action: string) => {
    const actionResponses: Record<string, string> = {
      track: "I'd be happy to help you track your order. Could you please provide your order number?",
      deals: "Here are today's top deals and offers! Let me show you what's available.",
      recommend: "Based on your browsing history and preferences, here are some personalized recommendations for you.",
      support: "I'm here to help! What do you need assistance with today?",
    };

    handleSendMessage(actionResponses[action] || "How can I help you?");
  };

  return (
    <main className="flex h-full flex-col bg-surface-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-surface-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white shadow-md">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-surface-900">
                REZ Assistant
              </h1>
              <p className="text-xs text-surface-500">Powered by AI</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <a
              href="/history"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              History
            </a>
          </nav>
        </div>
      </header>

      {/* Chat Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin hide-scrollbar"
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          {/* Quick Actions */}
          {messages.length === 1 && (
            <QuickActions onAction={handleQuickAction} />
          )}

          {/* Messages */}
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start gap-3 message-enter">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-200">
                <svg
                  className="h-4 w-4 text-surface-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="typing-dot h-2 w-2 rounded-full bg-surface-400" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-surface-400" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-surface-400" />
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {showRecommendations && !isTyping && (
            <Recommendations
              onClose={() => setShowRecommendations(false)}
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-surface-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-4xl">
          <ChatInput onSend={handleSendMessage} />
        </div>
      </div>
    </main>
  );
}
